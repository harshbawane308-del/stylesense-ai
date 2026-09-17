import { NextRequest, NextResponse } from "next/server";
import { analyzeProjectRequirements, requirementHash } from "../../../../lib/ai/requirement-server";
import { getOwnedProjectFromServer, updateProjectAnalysisOnServer, verifyFirebaseIdToken } from "../../../../lib/ai/server-firebase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let projectId: string | undefined;

  try {
    const authorization = request.headers.get("authorization");
    const payload = await request.json() as { projectId?: string };
    projectId = payload.projectId;

    console.info("Requirement Agent boundary", { stage: "request-received", projectId, hasAuthorization: Boolean(authorization) });

    if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    if (!projectId) return NextResponse.json({ error: "projectId is required." }, { status: 400 });

    const idToken = authorization.slice(7);
    console.info("Requirement Agent boundary", { stage: "firebase-auth-verify", projectId });
    const user = await verifyFirebaseIdToken(idToken);
    console.info("Requirement Agent boundary", { stage: "firebase-auth-verified", projectId, uid: user.uid });

    console.info("Requirement Agent boundary", { stage: "project-ownership-check", projectId, uid: user.uid });
    const project = await getOwnedProjectFromServer(projectId, idToken, user.uid);
    if (!project) return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });

    const existing = project.requirementAnalysis;
    const hash = requirementHash(project);
    console.info("Requirement Agent boundary", { stage: "project-ownership-passed", projectId, hasExistingAnalysis: Boolean(existing), hashMatchesExisting: existing?.requirementsHash === hash });
    if (existing?.requirementsHash === hash) return NextResponse.json({ analysis: existing, reused: true });

    console.info("Requirement Agent boundary", { stage: "requirement-agent-run", projectId, projectName: project.name });
    const analysis = await analyzeProjectRequirements(project);
    console.info("Requirement Agent boundary", { stage: "requirement-agent-complete", projectId, analysisVersion: analysis.analysisVersion });

    console.info("Requirement Agent boundary", { stage: "firestore-update", projectId });
    await updateProjectAnalysisOnServer(projectId, idToken, analysis);
    console.info("Requirement Agent success", { projectId, latencyMs: Date.now() - startedAt });
    return NextResponse.json({ analysis, reused: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "PERMISSION_DENIED" ? 403 : message.includes("GEMINI_API_KEY") ? 503 : message.includes("malformed") || message.includes("returned") ? 502 : 500;
    console.error("Requirement Agent failure", { category: message === "UNAUTHENTICATED" ? "auth" : "provider_or_validation", status, message, projectId, latencyMs: Date.now() - startedAt });
    return NextResponse.json({ error: status === 503 ? "AI analysis is not configured on the server yet." : status === 502 ? "AI returned invalid structured requirements. Please try again." : "Requirement analysis could not be completed." }, { status });
  }
}