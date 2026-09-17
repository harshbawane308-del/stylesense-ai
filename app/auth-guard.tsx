"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";

export function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !currentUser) router.replace("/sign-in"); }, [currentUser, loading, router]);
  if (loading || !currentUser) return <AuthLoadingScreen />;
  return children;
}

export function AuthLoadingScreen() {
  return <main className="auth-loading"><span className="auth-loading-mark"><span /><span /></span><strong>StyleSense <b>AI</b></strong><span className="auth-loading-line" /></main>;
}
