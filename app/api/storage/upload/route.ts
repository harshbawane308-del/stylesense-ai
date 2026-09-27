import { NextRequest, NextResponse } from "next/server";
import { getOwnedProjectFromServer, verifyFirebaseIdToken } from "../../../../lib/ai/server-firebase";

export const runtime = "nodejs";

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) throw new Error("Only base64 image data URLs can be stored.");
  return { contentType: match[1], data: Buffer.from(match[2], "base64") };
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

    const body = (await request.json()) as { projectId?: string; path?: string; dataUrl?: string };
    if (!body.projectId || !body.path || !body.dataUrl) return NextResponse.json({ error: "projectId, path, and dataUrl are required." }, { status: 400 });

    const idToken = authorization.slice(7);
    const user = await verifyFirebaseIdToken(idToken);
    const project = await getOwnedProjectFromServer(body.projectId, idToken, user.uid);
    if (!project) return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    if (!body.path.startsWith(`projects/${user.uid}/${body.projectId}/`)) return NextResponse.json({ error: "Invalid storage path." }, { status: 400 });

    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucket) throw new Error("Firebase Storage configuration is missing.");
    const image = decodeDataUrl(body.dataUrl);
    const response = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(body.path)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": image.contentType,
        "Content-Length": String(image.data.byteLength),
      },
      body: image.data,
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Firebase Storage upload failed", { status: response.status, detail: detail.slice(0, 500) });
      return NextResponse.json({ error: response.status === 403 ? "Firebase Storage denied this upload." : "Firebase Storage upload failed." }, { status: response.status });
    }

    const metadata = (await response.json()) as { name?: string; downloadTokens?: string };
    const token = metadata.downloadTokens?.split(",")[0];
    if (!metadata.name || !token) throw new Error("Firebase Storage did not return a downloadable image URL.");

    return NextResponse.json({ url: `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(metadata.name)}?alt=media&token=${encodeURIComponent(token)}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage upload failed.";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "PERMISSION_DENIED" ? 403 : 500;
    console.error("Storage upload failed", { message, status });
    return NextResponse.json({ error: status === 500 ? "Image storage is not available." : message }, { status });
  }
}
