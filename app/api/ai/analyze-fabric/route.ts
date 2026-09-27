import { NextRequest, NextResponse } from "next/server";
import { fabricAgent } from "../../../../lib/ai/agents/fabric-agent";
import { verifyFirebaseIdToken, getOwnedProjectFromServer } from "../../../../lib/ai/server-firebase";
import type { Project } from "../../../../lib/firestore-types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const authorization = request.headers.get("authorization");
    const payload = (await request.json()) as { projectId?: string };
    const projectId = payload.projectId;

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const idToken = authorization.slice(7);
    const user = await verifyFirebaseIdToken(idToken);
    const project = await getOwnedProjectFromServer(projectId, idToken, user.uid);

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    }

    if (!project.requirementAnalysis) {
      return NextResponse.json({ error: "Requirement analysis is required before fabric analysis." }, { status: 400 });
    }

    if (!project.fashionDesignConcept) {
      return NextResponse.json({ error: "Fashion Design Concept is required before fabric analysis." }, { status: 400 });
    }

    if (!project.trendIntelligence) {
      return NextResponse.json({ error: "Trend Intelligence is required before fabric analysis." }, { status: 400 });
    }

    const result = await fabricAgent.run({
      project: project as Project,
      requirementAnalysis: project.requirementAnalysis,
      fashionDesignConcept: project.fashionDesignConcept,
      trendIntelligence: project.trendIntelligence,
    });

    if (result.status !== "completed" || result.recommendations.length === 0) {
      return NextResponse.json({ error: result.message || "Fabric analysis failed." }, { status: 500 });
    }

    const fabricResult = {
      version: 1,
      result: {
        fabricSummary: "Fabric recommendations were generated from the confirmed brief, design concept, and trend direction. Exact sourcing or availability must be verified before committing to a mill or supplier.",
        recommendedFabrics: result.recommendations.map((recommendation, index) => ({
          fabricName: recommendation.fabricName,
          baseFiberStory: recommendation.composition || "Likely fiber direction inferred from the project brief and design intent.",
          likelyComposition: recommendation.composition,
          weightRange: recommendation.weight,
          drape: recommendation.drape,
          handFeel: recommendation.handFeel,
          texture: recommendation.texture,
          seasonSuitability: recommendation.seasonSuitability,
          garmentSuitability: recommendation.garmentSuitability,
          manufacturingSuitability: recommendation.manufacturingSuitability,
          evidenceStatus: index === 0 ? "project_based" : "design_inference",
          evidenceNote: recommendation.evidence,
          tradeoff: recommendation.marketAvailability || "Requires sourcing verification before final approval.",
        })),
        materialsToPrioritize: result.recommendations.map(item => item.fabricName),
        materialsToAvoid: ["Unverified luxury blends without documented hand feel and drape", "Heavy structures that conflict with the target silhouette"],
        keyConsiderations: [
          "Validate exact composition and hand feel with the selected mill or supplier.",
          "Confirm the final fabric supports the intended drape and seasonality.",
          "Keep the recommendation flexible until sourcing confirmation is completed.",
        ],
        seasonalityFit: result.recommendations[0]?.seasonSuitability || "Seasonality requires confirmation.",
        designCompatibility: result.recommendations[0]?.garmentSuitability || "Design compatibility remains to be confirmed.",
        manufacturingNotes: result.recommendations[0]?.manufacturingSuitability || "Manufacturing suitability should be checked before final vendor selection.",
        confidence: 0.78,
        verificationStatus: "requires_confirmation",
        limitations: [
          "No live supplier data or pricing data was available in the project.",
          "Material composition and availability must be confirmed before final procurement decisions.",
        ],
        generatedAt: new Date().toISOString(),
        model: process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash",
        promptVersion: "fabric-v1",
      },
      generatedAt: new Date().toISOString(),
      model: process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash",
      promptVersion: "fabric-v1",
      sourceRequirementAnalysisVersion: project.requirementAnalysis.analysisVersion,
      sourceTrendIntelligenceVersion: project.trendIntelligence.version,
      status: "generated",
    };

    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents/projects/${encodeURIComponent(projectId)}?updateMask.fieldPaths=fabricIntelligence&updateMask.fieldPaths=updatedAt`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          fabricIntelligence: {
            mapValue: {
              fields: Object.fromEntries(Object.entries(fabricResult).map(([key, value]) => [key, typeof value === "string" ? { stringValue: value } : typeof value === "number" ? { doubleValue: value } : typeof value === "boolean" ? { booleanValue: value } : Array.isArray(value) ? { arrayValue: { values: value.map(item => typeof item === "string" ? { stringValue: item } : { stringValue: String(item) }) } } : { stringValue: String(value) }]))
            }
          },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    });

    if (!response.ok) {
      throw new Error("FIRESTORE_ERROR");
    }

    console.info("Fabric Intelligence Agent success", { projectId, latencyMs: Date.now() - startedAt });
    return NextResponse.json({ fabricIntelligence: fabricResult.result, saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "PERMISSION_DENIED" ? 403 : message.includes("GEMINI_API_KEY") ? 503 : message.includes("malformed") || message.includes("returned") ? 502 : 500;
    console.error("Fabric Intelligence Agent failure", { category: message === "UNAUTHENTICATED" ? "auth" : "provider_or_validation", status, message, latencyMs: Date.now() - startedAt });
    return NextResponse.json({ error: status === 503 ? "Fabric analysis is not configured on the server yet." : status === 502 ? "AI returned invalid structured fabric output. Please try again." : "Fabric analysis could not be completed." }, { status });
  }
}
