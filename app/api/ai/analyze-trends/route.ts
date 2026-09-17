import { NextRequest, NextResponse } from "next/server";
import { trendAgent } from "../../../../lib/ai/agents/trend-agent";
import { getOwnedProjectFromServer, verifyFirebaseIdToken } from "../../../../lib/ai/server-firebase";
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
      return NextResponse.json({ error: "Requirement analysis is required before trend analysis." }, { status: 400 });
    }

    if (!project.fashionDesignConcept) {
      return NextResponse.json({ error: "Fashion Design Concept is required before trend analysis." }, { status: 400 });
    }

    const result = await trendAgent.run({
      project: project as Project,
      requirementAnalysis: project.requirementAnalysis,
      fashionDesignConcept: project.fashionDesignConcept,
    });

    if (result.status !== "completed" || !result.trendIntelligence) {
      return NextResponse.json({ error: result.message || "Trend analysis failed." }, { status: 500 });
    }

    const enrichedProject: Partial<Project> = {
      trendIntelligence: {
        version: 1,
        result: result.trendIntelligence,
        generatedAt: new Date().toISOString(),
        model: process.env.GEMINI_REQUIREMENT_MODEL || "gemini-3.6-flash",
        promptVersion: "trend-v1",
        sourceRequirementAnalysisVersion: project.requirementAnalysis.analysisVersion,
        sourceDesignConceptVersion: project.fashionDesignConcept.version,
        status: "generated",
      },
    };

    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents/projects/${encodeURIComponent(projectId)}?updateMask.fieldPaths=trendIntelligence&updateMask.fieldPaths=updatedAt`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          trendIntelligence: {
            mapValue: {
              fields: Object.fromEntries(Object.entries(enrichedProject.trendIntelligence || {}).map(([key, value]) => [key, typeof value === "string" ? { stringValue: value } : typeof value === "number" ? { doubleValue: value } : typeof value === "boolean" ? { booleanValue: value } : Array.isArray(value) ? { arrayValue: { values: value.map(item => typeof item === "string" ? { stringValue: item } : { stringValue: String(item) }) } } : { stringValue: String(value) }]))
            }
          },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    });

    if (!response.ok) {
      throw new Error("FIRESTORE_ERROR");
    }

    console.info("Trend Intelligence Agent success", { projectId, latencyMs: Date.now() - startedAt });
    return NextResponse.json({ trendIntelligence: result.trendIntelligence, saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "PERMISSION_DENIED" ? 403 : message.includes("GEMINI_API_KEY") ? 503 : message.includes("malformed") || message.includes("returned") ? 502 : 500;
    console.error("Trend Intelligence Agent failure", { category: message === "UNAUTHENTICATED" ? "auth" : "provider_or_validation", status, message, latencyMs: Date.now() - startedAt });
    return NextResponse.json({ error: status === 503 ? "Trend analysis is not configured on the server yet." : status === 502 ? "AI returned invalid structured trend output. Please try again." : "Trend analysis could not be completed." }, { status });
  }
}
