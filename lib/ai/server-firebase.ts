import type { Project } from "../firestore-types";


function requireConfig() { const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY; const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID; if (!apiKey || !projectId) throw new Error("Firebase server configuration is missing."); return { apiKey, projectId }; }

export async function verifyFirebaseIdToken(idToken: string) {
  const { apiKey } = requireConfig();
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken }) });
  if (!response.ok) throw new Error("UNAUTHENTICATED");
  const body = await response.json() as { users?: Array<{ localId: string; email?: string; displayName?: string; photoUrl?: string }> };
  const user = body.users?.[0];
  if (!user) throw new Error("UNAUTHENTICATED");
  return { uid: user.localId, email: user.email || null, displayName: user.displayName || null, photoURL: user.photoUrl || null };
}

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return { integerValue: Number.isInteger(value) ? String(value) : undefined, doubleValue: Number.isInteger(value) ? undefined : value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toFirestoreValue(item)])) } };
}

function fromFirestoreValue(value: Record<string, unknown>): unknown { if ("nullValue" in value) return null; if ("stringValue" in value) return value.stringValue; if ("integerValue" in value) return Number(value.integerValue); if ("doubleValue" in value) return value.doubleValue; if ("booleanValue" in value) return value.booleanValue; if ("timestampValue" in value) return value.timestampValue; if ("arrayValue" in value && typeof value.arrayValue === "object" && value.arrayValue !== null && !Array.isArray(value.arrayValue)) { const values = (value.arrayValue as { values?: Array<Record<string, unknown>> }).values || []; return values.map(item => fromFirestoreValue(item)); } if ("mapValue" in value && typeof value.mapValue === "object" && value.mapValue !== null && !Array.isArray(value.mapValue)) { const fields = (value.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields || {}; return Object.fromEntries(Object.entries(fields).map(([key, item]) => [key, fromFirestoreValue(item)])); } return null; }
export function firestoreDocumentToProject(document: { name: string; fields?: Record<string, Record<string, unknown>> }) { const fields = Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)])); return { ...fields, projectId: String(fields.projectId || document.name.split("/").pop()) } as Project; }

export async function getOwnedProjectFromServer(projectId: string, idToken: string, uid: string) {
  const { projectId: firebaseProjectId } = requireConfig();
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/projects/${encodeURIComponent(projectId)}`, { headers: { Authorization: `Bearer ${idToken}` } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(response.status === 403 ? "PERMISSION_DENIED" : "FIRESTORE_ERROR");
  const project = firestoreDocumentToProject(await response.json());
  return project.userId === uid ? project : null;
}

export async function updateProjectAnalysisOnServer(projectId: string, idToken: string, analysis: unknown) {
  const { projectId: firebaseProjectId } = requireConfig();
  const body = { fields: { requirementAnalysis: toFirestoreValue(analysis), updatedAt: { timestampValue: new Date().toISOString() } } };
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/projects/${encodeURIComponent(projectId)}?updateMask.fieldPaths=requirementAnalysis&updateMask.fieldPaths=updatedAt`, { method: "PATCH", headers: { Authorization: `Bearer ${idToken}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(response.status === 403 ? "PERMISSION_DENIED" : "FIRESTORE_ERROR");
}