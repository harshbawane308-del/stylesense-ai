import { NextRequest, NextResponse } from "next/server";
import { blueprintAgent } from "../../../../lib/ai/agents/blueprint-agent";
import { fabricAgent } from "../../../../lib/ai/agents/fabric-agent";
import { fashionDesignAgent } from "../../../../lib/ai/agents/fashion-design-agent";
import { imageGenerationAgent } from "../../../../lib/ai/agents/image-generation-agent";
import { manufacturingAgent } from "../../../../lib/ai/agents/manufacturing-agent";
import { requirementAgent } from "../../../../lib/ai/agents/requirement-agent";
import { trendAgent } from "../../../../lib/ai/agents/trend-agent";
import { getOwnedProjectFromServer, verifyFirebaseIdToken } from "../../../../lib/ai/server-firebase";
import type { Project } from "../../../../lib/firestore-types";

export const runtime = "nodejs";

type GenerationMode = "initial" | "regenerate";
type PipelineStatus = "completed" | "pending" | "failed";

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(item => toFirestoreValue(item)) } };
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toFirestoreValue(item)])),
      },
    };
  }
  return { stringValue: String(value) };
}

async function patchProjectFields(projectId: string, idToken: string, fields: Record<string, unknown>) {
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!firebaseProjectId) {
    throw new Error("Firebase project configuration is missing.");
  }

  const updateMask = Object.keys(fields)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join("&");

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/projects/${encodeURIComponent(projectId)}?${updateMask}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, toFirestoreValue(value)])),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(response.status === 403 ? "PERMISSION_DENIED" : "FIRESTORE_ERROR");
  }
}

function normalizeText<T>(value: T): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const candidate = value as { value?: unknown; text?: unknown };
    if (typeof candidate.value === "string") return candidate.value;
    if (typeof candidate.text === "string") return candidate.text;
  }
  return "Not specified";
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  try {
    const authorization = request.headers.get("authorization");
    const payload = (await request.json().catch(() => ({}))) as {
      projectId?: string;
      mode?: GenerationMode;
      editPrompt?: string;
    };

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const projectId = payload.projectId;
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const idToken = authorization.slice(7);
    const user = await verifyFirebaseIdToken(idToken);
    const project = await getOwnedProjectFromServer(projectId, idToken, user.uid);

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    }

    const pipeline: Array<{ label: string; status: PipelineStatus; message: string }> = [
      { label: "Preparing brief", status: "completed", message: `Loaded project ${project.name}.` },
    ];

    let requirementAnalysis = project.requirementAnalysis;
    if (!requirementAnalysis) {
      const requirementResult = await requirementAgent.run({ project });
      if (requirementResult.status !== "completed" || !requirementResult.normalizedRequirements) {
        return NextResponse.json({ error: requirementResult.message || "Requirement analysis failed." }, { status: 400 });
      }
      requirementAnalysis = {
        originalUserRequirements: project.designRequirements || null,
        normalizedRequirements: requirementResult.normalizedRequirements,
        analyzedAt: new Date().toISOString(),
        analysisVersion: "requirement-v1",
        requirementsHash: `${project.projectId}:${Date.now()}`,
      };
      await patchProjectFields(projectId, idToken, { requirementAnalysis, updatedAt: new Date().toISOString() });
      pipeline.push({ label: "Analyzing design requirements", status: "completed", message: "Requirements were normalized and saved." });
    } else {
      pipeline.push({ label: "Analyzing design requirements", status: "completed", message: "Requirements already existed and were reused." });
    }

    let designConcept = project.fashionDesignConcept;
    const editPrompt = payload.editPrompt?.trim();
    if (!designConcept || editPrompt) {
      const conceptResult = await fashionDesignAgent.run({
        project,
        requirementAnalysis: requirementAnalysis.normalizedRequirements,
        editPrompt,
      });
      if (conceptResult.status !== "completed" || !conceptResult.concept) {
        return NextResponse.json({ error: conceptResult.message || "Design concept generation failed." }, { status: 500 });
      }
      designConcept = {
        version: (project.fashionDesignConcept?.version ?? 0) + 1,
        ...conceptResult.concept,
        generatedAt: new Date().toISOString(),
        model: process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash",
        promptVersion: "fashion-design-v1",
        sourceRequirementAnalysisVersion: requirementAnalysis.analysisVersion,
        requirementsHash: requirementAnalysis.requirementsHash,
        status: "generated",
      };
      await patchProjectFields(projectId, idToken, { fashionDesignConcept: designConcept, updatedAt: new Date().toISOString() });
      pipeline.push({ label: "Developing design", status: "completed", message: editPrompt ? "The design concept was updated from the edit instruction." : "A validated fashion concept was generated." });
    } else {
      pipeline.push({ label: "Developing design", status: "completed", message: "The saved design concept was reused." });
    }

    let trendIntelligence = project.trendIntelligence;
    if (!trendIntelligence) {
      const trendResult = await trendAgent.run({
        project,
        requirementAnalysis,
        fashionDesignConcept: designConcept,
      });
      if (trendResult.status !== "completed" || !trendResult.trendIntelligence) {
        return NextResponse.json({ error: trendResult.message || "Trend intelligence failed." }, { status: 500 });
      }
      trendIntelligence = {
        version: 1,
        result: trendResult.trendIntelligence,
        generatedAt: new Date().toISOString(),
        model: process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash",
        promptVersion: "trend-v1",
        sourceRequirementAnalysisVersion: requirementAnalysis.analysisVersion,
        sourceDesignConceptVersion: designConcept.version,
        status: "generated",
      };
      await patchProjectFields(projectId, idToken, { trendIntelligence, updatedAt: new Date().toISOString() });
      pipeline.push({ label: "Studying fashion direction", status: "completed", message: "Trend intelligence was reviewed for relevance." });
    } else {
      pipeline.push({ label: "Studying fashion direction", status: "completed", message: "The saved trend direction was reused." });
    }

    let fabricIntelligence = project.fabricIntelligence;
    if (!fabricIntelligence) {
      const fabricResult = await fabricAgent.run({
        project,
        requirementAnalysis,
        fashionDesignConcept: designConcept,
        trendIntelligence,
      });
      if (fabricResult.status !== "completed" || fabricResult.recommendations.length === 0) {
        return NextResponse.json({ error: fabricResult.message || "Fabric intelligence failed." }, { status: 500 });
      }
      fabricIntelligence = {
        version: 1,
        result: {
          fabricSummary: "Fabric recommendations were generated from the confirmed brief, design concept, and trend direction.",
          recommendedFabrics: fabricResult.recommendations.map((item) => ({
            fabricName: item.fabricName,
            baseFiberStory: item.composition || "Likely fiber direction inferred from the design brief.",
            likelyComposition: item.composition,
            weightRange: item.weight,
            drape: item.drape,
            handFeel: item.handFeel,
            texture: item.texture,
            seasonSuitability: item.seasonSuitability,
            garmentSuitability: item.garmentSuitability,
            manufacturingSuitability: item.manufacturingSuitability,
            evidenceStatus: "design_inference",
            evidenceNote: item.evidence,
            tradeoff: item.marketAvailability || "Requires sourcing confirmation before final approval.",
          })),
          materialsToPrioritize: fabricResult.recommendations.map((item) => item.fabricName),
          materialsToAvoid: ["Unverified luxury blends without documented drape and hand feel", "Heavy structures that conflict with the intended silhouette"],
          keyConsiderations: [
            "Validate exact composition and hand feel with the target mill or supplier.",
            "Confirm the final fabric supports drape and seasonality before committing to production.",
          ],
          seasonalityFit: fabricResult.recommendations[0]?.seasonSuitability || "Seasonality requires confirmation.",
          designCompatibility: fabricResult.recommendations[0]?.garmentSuitability || "Design compatibility requires confirmation.",
          manufacturingNotes: fabricResult.recommendations[0]?.manufacturingSuitability || "Manufacturing suitability requires confirmation.",
          confidence: 0.78,
          verificationStatus: "requires_confirmation",
          limitations: ["No live supplier or pricing data was available in this project.", "Material confirmation should be completed before vendor commitment."],
          generatedAt: new Date().toISOString(),
          model: process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash",
          promptVersion: "fabric-v1",
        },
        generatedAt: new Date().toISOString(),
        model: process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash",
        promptVersion: "fabric-v1",
        sourceRequirementAnalysisVersion: requirementAnalysis.analysisVersion,
        sourceTrendIntelligenceVersion: trendIntelligence.version,
        status: "generated",
      };
      await patchProjectFields(projectId, idToken, { fabricIntelligence, updatedAt: new Date().toISOString() });
      pipeline.push({ label: "Selecting fabric direction", status: "completed", message: "Fabric recommendations were saved with cautionary sourcing notes." });
    } else {
      pipeline.push({ label: "Selecting fabric direction", status: "completed", message: "The saved fabric direction was reused." });
    }

    const manufacturingResult = await manufacturingAgent.run({
      status: "completed",
      concept: designConcept ?? null,
      responsibilities: [],
      validation: { valid: true, errors: [], warnings: [] },
      message: "Design concept ready for feasibility assessment.",
    });

    if (manufacturingResult.status !== "completed") {
      return NextResponse.json({ error: manufacturingResult.message || "Manufacturing feasibility failed." }, { status: 500 });
    }

    pipeline.push({ label: "Assessing manufacturing feasibility", status: "completed", message: manufacturingResult.assessment.status === "feasible" ? "The concept is production-feasible." : "The concept needs minor manufacturing adjustments before final production." });

    const blueprintResult = await blueprintAgent.run({
      project: {
        projectId: project.projectId,
        userId: project.userId,
        garmentType: project.garmentType,
        targetGender: project.targetGender,
        targetCountry: project.targetCountry,
        season: project.season,
        style: project.style,
        fit: project.fit,
        color: project.color,
        preferredFabric: project.preferredFabric,
        texture: project.texture,
        requirements: project.requirements,
      },
      requirements: {
        status: requirementAnalysis ? "completed" : "failed",
        requirements: project.designRequirements || null,
        normalizedRequirements: requirementAnalysis?.normalizedRequirements ?? null,
        missingFields: [],
        responsibilities: [],
        validation: { valid: true, errors: [], warnings: [] },
        message: requirementAnalysis ? "Requirement analysis ready." : "Requirement analysis missing.",
      },
      fashionDesign: {
        status: "completed",
        concept: designConcept ?? null,
        responsibilities: [],
        validation: { valid: true, errors: [], warnings: [] },
        message: "Design concept ready.",
      },
      trends: {
        status: trendIntelligence ? "completed" : "failed",
        trendIntelligence: trendIntelligence?.result ?? null,
        signals: [],
        validation: { valid: true, errors: [], warnings: [] },
        message: trendIntelligence ? "Trend direction ready." : "Trend direction missing.",
      },
      fabric: {
        status: "completed",
        recommendations: fabricIntelligence?.result?.recommendedFabrics.map((item) => ({
          fabricName: item.fabricName,
          composition: item.likelyComposition,
          gsm: null,
          weight: item.weightRange,
          drape: item.drape,
          handFeel: item.handFeel,
          texture: item.texture,
          seasonSuitability: item.seasonSuitability,
          garmentSuitability: item.garmentSuitability,
          manufacturingSuitability: item.manufacturingSuitability,
          marketAvailability: item.tradeoff ?? "Requires verification",
          evidence: item.evidenceNote,
        })) ?? [],
        validation: { valid: true, errors: [], warnings: [] },
        message: "Fabric guidance ready.",
      },
      manufacturing: manufacturingResult,
      projectId: project.projectId,
      userId: project.userId,
      version: 1,
    });

    if (blueprintResult.status !== "completed" || !blueprintResult.blueprint) {
      return NextResponse.json({ error: blueprintResult.message || "Design blueprint generation failed." }, { status: 500 });
    }

    pipeline.push({ label: "Building design blueprint", status: "completed", message: "The approved design is now translated into a production-aware blueprint." });

    const generationResult = await imageGenerationAgent.run(blueprintResult.blueprint);
    const quotaFailure = (generationResult.message ?? "").toLowerCase().includes("quota is exhausted") || (generationResult.message ?? "").toLowerCase().includes("resource_exhausted");

    if (generationResult.status !== "completed") {
      return NextResponse.json(
        {
          error: generationResult.message || "Image generation failed.",
        },
        { status: quotaFailure ? 429 : 500 },
      );
    }

    pipeline.push({ label: "Generating visual", status: "completed", message: "The final front, back, and side views were generated." });

    const finalConcept = designConcept as Project["fashionDesignConcept"];
    const normalizedSummary = normalizeText(finalConcept?.designSummary)?.trim() || "A design concept aligned to the project brief was generated.";
    const normalizedStory = normalizeText(finalConcept?.designStory)?.trim() || "The design preserves the required silhouette and wearability while being grounded in the selected direction.";
    const finalColor = normalizeText(finalConcept?.colorDirection?.primaryColor)?.trim() || project.color || "Not specified";
    const finalSilhouette = normalizeText(finalConcept?.silhouette?.silhouetteType)?.trim() || project.style || "Modern silhouette";
    const finalFabric = normalizeText(fabricIntelligence?.result?.recommendedFabrics?.[0]?.fabricName)?.trim() || project.preferredFabric || "To be selected";

    const generatedDesignRecord = {
      conceptName: normalizeText(finalConcept?.conceptName) || `${project.name} concept`,
      designSummary: normalizedSummary,
      designStory: normalizedStory,
      silhouette: finalSilhouette,
      primaryColor: finalColor,
      fabricDirection: finalFabric,
      frontImageUrl: generationResult.frontImageUrl,
      backImageUrl: generationResult.backImageUrl,
      sideImageUrl: generationResult.sideImageUrl,
      version: generationResult.version,
      generatedAt: new Date().toISOString(),
      blueprint: blueprintResult.blueprint,
    };

    const updateStatus = payload.mode === "regenerate" ? "design_generated" : "design_generated";
    const persistedGeneratedDesignRecord = {
      ...generatedDesignRecord,
      frontImageUrl: null,
      backImageUrl: null,
      sideImageUrl: null,
    };
    await patchProjectFields(projectId, idToken, {
      status: updateStatus,
      generatedDesign: persistedGeneratedDesignRecord,
      designVersion: generationResult.version,
      updatedAt: new Date().toISOString(),
    });

    pipeline.push({ label: "Finalizing", status: "completed", message: payload.mode === "regenerate" ? "The design concept was refreshed from your latest edit prompt." : "The concept is ready for review and approval." });

    return NextResponse.json({
      design: {
        conceptName: normalizeText(finalConcept?.conceptName) || `${project.name} concept`,
        designSummary: normalizedSummary,
        designStory: normalizedStory,
        silhouette: finalSilhouette,
        primaryColor: finalColor,
        fabricDirection: finalFabric,
        frontImageUrl: generationResult.frontImageUrl,
        backImageUrl: generationResult.backImageUrl,
        sideImageUrl: generationResult.sideImageUrl,
        status: "ready",
      },
      pipeline,
      project: {
        status: updateStatus,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const quotaFailure = message.toLowerCase().includes("quota is exhausted") || message.toLowerCase().includes("resource_exhausted") || message.toLowerCase().includes("quota exceeded");
    const status = message === "UNAUTHENTICATED" ? 401 : message === "PERMISSION_DENIED" ? 403 : message.includes("GEMINI_API_KEY") ? 503 : quotaFailure ? 429 : message.includes("malformed") || message.includes("returned") ? 502 : 500;
    console.error("Generate Design orchestration failed", {
      message,
      status,
      latencyMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      {
        error: quotaFailure
          ? "Image generation unavailable because the AI image service quota is exhausted. The current Gemini API project/key has reached its image-generation quota or billing limit."
          : status === 503
            ? "AI configuration is not complete on the server yet."
            : status === 502
              ? "The AI returned invalid data during design generation."
              : "The design could not be generated.",
      },
      { status },
    );
  }
}
