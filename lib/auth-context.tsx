"use client";

import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "./firebase";
import { createUserProfile } from "./firestore";

export type NewUserProfile = { uid: string; fullName: string; email: string | null; photoURL: string | null; createdAt: string };

type AuthContextValue = {
  currentUser: User | null;
  loading: boolean;
  signUp: (fullName: string, email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function requireAuth() {
  if (!auth) throw new Error("Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* values to .env.local.");
  return auth;
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(auth));
  useEffect(() => { if (!auth) return; return onAuthStateChanged(auth, user => { setCurrentUser(user); setLoading(false); }); }, []);

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    loading,
    signUp: async (fullName, email, password) => { const credential = await createUserWithEmailAndPassword(requireAuth(), email, password); await updateProfile(credential.user, { displayName: fullName }); await createUserProfile({ uid: credential.user.uid, displayName: fullName, email: credential.user.email || email, photoURL: credential.user.photoURL }); return credential.user; },
    signIn: async (email, password) => (await signInWithEmailAndPassword(requireAuth(), email, password)).user,
    signInWithGoogle: async () => { const user = (await signInWithPopup(requireAuth(), new GoogleAuthProvider())).user; await createUserProfile({ uid: user.uid, displayName: user.displayName || "", email: user.email || "", photoURL: user.photoURL }); return user; },
    resetPassword: email => sendPasswordResetEmail(requireAuth(), email),
    signOut: () => firebaseSignOut(requireAuth()),
  }), [currentUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function getUserProfileData(user: User, fullName = user.displayName || "") : NewUserProfile {
  return { uid: user.uid, fullName, email: user.email, photoURL: user.photoURL, createdAt: new Date().toISOString() };
}
