import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Design, Generation, Project, TechPack, UserProfile } from "./firestore-types";

function requireDb() {
  if (!db) throw new Error("Firestore is not configured. Check the NEXT_PUBLIC_FIREBASE_* values in .env.local.");
  return db;
}

function withId<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snapshot.id, ...snapshot.data() } as T;
}

export async function createUserProfile(profile: Omit<UserProfile, "createdAt" | "updatedAt">) {
  const reference = doc(requireDb(), "users", profile.uid);
  const existing = await getDoc(reference);
  await setDoc(reference, { ...profile, ...(existing.exists() ? {} : { createdAt: serverTimestamp() }), updatedAt: serverTimestamp() }, { merge: true });
  return profile.uid;
}

export async function getUserProfile(userId: string) {
  const snapshot = await getDoc(doc(requireDb(), "users", userId));
  return snapshot.exists() ? snapshot.data() as UserProfile : null;
}

export type CreateProjectInput = Omit<Project, "projectId" | "userId" | "createdAt" | "updatedAt">;
export async function createProject(userId: string, input: CreateProjectInput) {
  const reference = await addDoc(collection(requireDb(), "projects"), { ...input, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await updateDoc(reference, { projectId: reference.id });
  return reference.id;
}

export async function getUserProjects(userId: string) {
  const snapshot = await getDocs(query(collection(requireDb(), "projects"), where("userId", "==", userId)));
  return snapshot.docs.map(snapshotItem => withId<Project>(snapshotItem)).sort((left, right) => right.updatedAt.toMillis() - left.updatedAt.toMillis());
}

export async function getProject(projectId: string, userId: string) {
  const snapshot = await getDoc(doc(requireDb(), "projects", projectId));
  if (!snapshot.exists() || snapshot.data().userId !== userId) return null;
  return { projectId: snapshot.id, ...snapshot.data() } as Project;
}

export async function updateProject(projectId: string, userId: string, updates: Partial<Omit<Project, "projectId" | "userId" | "createdAt" | "updatedAt">>) {
  const reference = doc(requireDb(), "projects", projectId);
  const current = await getDoc(reference);
  if (!current.exists() || current.data().userId !== userId) throw new Error("Project not found or access denied.");
  await updateDoc(reference, { ...updates, updatedAt: serverTimestamp() });
}

export async function createDesign(userId: string, input: Omit<Design, "designId" | "userId" | "createdAt" | "updatedAt">) {
  const reference = await addDoc(collection(requireDb(), "designs"), { ...input, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await updateDoc(reference, { designId: reference.id });
  return reference.id;
}

export async function getProjectDesigns(projectId: string, userId: string) {
  const snapshot = await getDocs(query(collection(requireDb(), "designs"), where("projectId", "==", projectId), where("userId", "==", userId)));
  return snapshot.docs.map(snapshotItem => withId<Design>(snapshotItem)).sort((left, right) => right.createdAt.toMillis() - left.createdAt.toMillis());
}

export async function createGeneration(userId: string, input: Omit<Generation, "generationId" | "userId" | "createdAt">) {
  const reference = await addDoc(collection(requireDb(), "generations"), { ...input, userId, createdAt: serverTimestamp() });
  await updateDoc(reference, { generationId: reference.id });
  return reference.id;
}

export async function createTechPack(userId: string, input: Omit<TechPack, "techPackId" | "userId" | "createdAt" | "updatedAt">) {
  const reference = await addDoc(collection(requireDb(), "techPacks"), { ...input, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await updateDoc(reference, { techPackId: reference.id });
  return reference.id;
}

export async function getProjectTechPacks(projectId: string, userId: string) {
  const snapshot = await getDocs(query(collection(requireDb(), "techPacks"), where("projectId", "==", projectId), where("userId", "==", userId), limit(50)));
  return snapshot.docs.map(snapshotItem => withId<TechPack>(snapshotItem)).sort((left, right) => right.createdAt.toMillis() - left.createdAt.toMillis());
}