"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects/new", icon: FolderKanban },
  { label: "Create Design", href: "/dashboard/design", icon: Sparkles },
  { label: "Tech-Packs", href: "/dashboard/tech-packs", icon: FileText },
];

export function Brand() {
  return <span className="dashboard-brand"><span className="dashboard-brand-mark"><span /><span /></span><span>StyleSense <b>AI</b></span></span>;
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, signOut } = useAuth();
  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "StyleSense member";
  const initials = displayName.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const handleSignOut = async () => { await signOut(); router.replace("/sign-in"); };
  return <>
    <button className={`sidebar-overlay ${open ? "is-visible" : ""}`} aria-label="Close navigation" onClick={onClose} />
    <aside className={`dashboard-sidebar ${open ? "is-open" : ""}`}>
      <div className="sidebar-inner">
        <Link href="/" className="sidebar-brand" onClick={onClose}><Brand /></Link>
        <div className="sidebar-nav-group"><span className="sidebar-label">Workspace</span>{navItems.map(({ label, href, icon: Icon }) => { const active = label === "Dashboard" ? pathname === "/dashboard" : pathname.startsWith(href); return <Link className={`sidebar-link ${active ? "is-active" : ""}`} href={href} key={label} onClick={onClose}><Icon size={17} strokeWidth={1.7} /><span>{label}</span>{label === "Projects" && <Plus className="sidebar-link-plus" size={14} />}</Link>; })}</div>
        <div className="sidebar-nav-group sidebar-secondary"><span className="sidebar-label">Account</span><Link className={`sidebar-link ${pathname.startsWith("/dashboard/settings") ? "is-active" : ""}`} href="/dashboard/settings" onClick={onClose}><Settings size={17} strokeWidth={1.7} /><span>Settings</span></Link><Link className="sidebar-link" href="#help"><CircleHelp size={17} strokeWidth={1.7} /><span>Help & support</span></Link></div>
        <div className="sidebar-bottom"><div className="sidebar-status"><span className="status-pulse" /><div><strong>Workspace plan</strong><span>Founding studio</span></div><ChevronDown size={14} /></div><div className="sidebar-profile"><span className="avatar avatar-dark">{currentUser?.photoURL ? <span className="avatar-photo" style={{ backgroundImage: `url(${currentUser.photoURL})` }} /> : initials}</span><div><strong>{displayName}</strong><span>{currentUser?.email}</span></div><button className="signout-button" onClick={handleSignOut}>Sign out</button></div></div>
      </div>
    </aside>
  </>;
}

export function DashboardHeader({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { currentUser } = useAuth();
  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Member";
  const initials = displayName.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
  return <header className="dashboard-header"><div className="mobile-header-brand"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => window.dispatchEvent(new CustomEvent("stylesense:open-sidebar"))}><Menu size={20} /></button><Link href="/"><Brand /></Link></div><div className="header-title"><span>{eyebrow || "Workspace"}</span><h1>{title}</h1></div><div className="header-tools"><div className={`header-search ${searchOpen ? "is-open" : ""}`}><Search size={16} /><input aria-label="Search workspace" placeholder="Search workspace" /><button aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={15} /></button></div><button className="header-icon-button search-toggle" aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={18} /></button><button className="header-icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span /></button><span className="avatar avatar-light">{currentUser?.photoURL ? <span className="avatar-photo" style={{ backgroundImage: `url(${currentUser.photoURL})` }} /> : initials}</span></div></header>;
}

export function DashboardShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { const open = () => setSidebarOpen(true); window.addEventListener("stylesense:open-sidebar", open); return () => window.removeEventListener("stylesense:open-sidebar", open); }, []);
  const pageTitle = pathname === "/dashboard" ? title : pathname.includes("projects/new") ? "New project" : pathname.includes("/design") ? "Create design" : pathname.includes("tech-packs") ? "Tech-packs" : "Workspace";
  return <div className="dashboard-app"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="dashboard-main"><DashboardHeader title={pageTitle} eyebrow={eyebrow} /><div className="dashboard-content">{children}</div></div></div>;
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="page-intro"><div><span className="dashboard-eyebrow">{eyebrow || "Overview"}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

export function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof LayoutDashboard }) {
  return <div className="stat-card"><div className="stat-card-top"><span>{label}</span><Icon size={17} /></div><strong>{value}</strong><small>{detail}</small></div>;
}

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "ready" }) { return <span className={`dashboard-status status-${tone}`}><span />{children}</span>; }

export const exampleProjects = [
  { name: "Oversized Textured Overshirt", type: "Outerwear / SS25", status: "Design Generated", tone: "accent" as const, updated: "Today", initials: "OT" },
  { name: "Korean Relaxed Cargo Pants", type: "Bottoms / AW25", status: "Draft", tone: "neutral" as const, updated: "Yesterday", initials: "KC" },
  { name: "Minimal Utility Jacket", type: "Outerwear / SS25", status: "Tech-Pack Ready", tone: "ready" as const, updated: "3 days ago", initials: "MU" },
];

export function ProjectRow({ project }: { project: (typeof exampleProjects)[number] }) { return <Link href="/dashboard/design" className="project-row"><span className="project-thumb">{project.initials}</span><span className="project-name"><strong>{project.name}</strong><small>{project.type}</small></span><StatusBadge tone={project.tone}>{project.status}</StatusBadge><span className="project-updated">{project.updated}</span><span className="project-arrow">↗</span></Link>; }
