import type { Metadata } from "next";
import { DashboardShell } from "./_components/dashboard-shell";
import "../dashboard.css";
import { AuthGuard } from "../auth-guard";

export const metadata: Metadata = { title: "Workspace | StyleSense AI", description: "StyleSense AI product development workspace." };

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthGuard><DashboardShell title="Dashboard">{children}</DashboardShell></AuthGuard>;
}