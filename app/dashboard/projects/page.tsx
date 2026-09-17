"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { PageIntro, StatusBadge } from "../_components/dashboard-shell";
import { useAuth } from "../../../lib/auth-context";
import { getUserProjects } from "../../../lib/firestore";
import type { Project } from "../../../lib/firestore-types";

function statusLabel(status: Project["status"]) { return status.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()); }
function formatDate(value: Project["updatedAt"]) { return value?.toDate ? value.toDate().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Recently"; }

export default function ProjectsPage() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { if (!currentUser) return; getUserProjects(currentUser.uid).then(setProjects).catch(() => setError("Projects could not be loaded. Check your connection and Firestore rules.")).finally(() => setLoading(false)); }, [currentUser]);
  return <div className="projects-page"><PageIntro eyebrow="Workspace / Projects" title="Your projects." description="Every garment brief, in one place." action={<Link className="dashboard-primary-button" href="/dashboard/projects/new"><Plus size={16} /> New project</Link>} />{error && <p className="form-error">{error}</p>}<div className="project-list-panel"><div className="project-list-head"><span>Project</span><span>Status</span><span>Last updated</span><span /></div>{loading ? <p className="dashboard-empty">Loading your projects...</p> : projects.length ? projects.map(project => <Link className="project-list-row" href={`/dashboard/projects/${project.projectId}`} key={project.projectId}><span className="project-thumb">{project.name.slice(0, 2).toUpperCase()}</span><span className="project-name"><strong>{project.name}</strong><small>{project.garmentType} / {project.season} / {project.targetCountry}</small></span><StatusBadge tone={project.status === "techpack_generated" ? "ready" : project.status === "draft" ? "neutral" : "accent"}>{statusLabel(project.status)}</StatusBadge><span className="project-updated">{formatDate(project.updatedAt)}</span><ArrowRight size={15} /></Link>) : <div className="dashboard-empty"><p>No projects yet.</p><Link className="inline-link" href="/dashboard/projects/new">Create your first project <ArrowRight size={14} /></Link></div>}</div></div>;
}
