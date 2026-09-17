"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileText, Sparkles } from "lucide-react";
import { PageIntro, StatusBadge } from "../../_components/dashboard-shell";
import { useAuth } from "../../../../lib/auth-context";
import { getProject } from "../../../../lib/firestore";
import type { Project } from "../../../../lib/firestore-types";

function statusLabel(status: Project["status"]) { return status.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()); }
const detailFields: Array<[keyof Project, string]> = [["garmentType", "Garment type"], ["targetGender", "Target gender"], ["targetCountry", "Target country"], ["season", "Season"], ["style", "Style"], ["fit", "Fit"], ["color", "Color"], ["preferredFabric", "Preferred fabric"], ["texture", "Texture"]];

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { if (!currentUser || !projectId) return; getProject(projectId, currentUser.uid).then(result => { if (!result) setError("Project not found or you do not have access to it."); else setProject(result); }).catch(() => setError("This project could not be loaded. Check your connection and Firestore rules.")).finally(() => setLoading(false)); }, [currentUser, projectId]);
  if (loading) return <div className="dashboard-empty">Loading project...</div>;
  if (!project) return <div className="dashboard-empty"><p>{error || "Project not found."}</p><Link className="inline-link" href="/dashboard/projects"><ArrowLeft size={14} /> Back to projects</Link></div>;
  return <div className="project-detail-page"><PageIntro eyebrow="Workspace / Project detail" title={project.name} description="Your saved requirements and the next development stages for this project." action={<Link className="quiet-back-link" href="/dashboard/projects"><ArrowLeft size={15} /> Back to projects</Link>} /><div className="project-detail-grid"><section className="detail-panel"><div className="detail-heading"><div><span className="dashboard-eyebrow">Current status</span><h3>{statusLabel(project.status)}</h3></div><StatusBadge tone={project.status === "techpack_generated" ? "ready" : "accent"}>{statusLabel(project.status)}</StatusBadge></div><div className="detail-pipeline"><div className="detail-stage is-complete"><span><Check size={13} /></span><strong>Requirements</strong></div><div className={`detail-stage ${project.status !== "draft" ? "is-current" : ""}`}><span><Sparkles size={13} /></span><strong>AI design</strong></div><div className="detail-stage"><span><FileText size={13} /></span><strong>Tech-pack</strong></div></div><div className="detail-actions"><Link className="dashboard-primary-button" href={`/dashboard/projects/${project.projectId}/design`}>Open design workspace <ArrowRight size={15} /></Link><button className="outline-button" disabled>Create tech-pack</button></div></section><section className="detail-panel"><div className="section-row-heading"><div><span className="dashboard-eyebrow">Project requirements</span><h3>Design direction</h3></div></div><div className="detail-fields">{detailFields.map(([key, label]) => <div key={label}><span>{label}</span><strong>{project[key] as string || "Not specified"}</strong></div>)}</div>{project.requirements && <div className="requirements-copy"><span>Additional requirements</span><p>{project.requirements}</p></div>}</section></div></div>;
}
