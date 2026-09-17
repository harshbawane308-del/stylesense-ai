"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, FileText, FolderKanban, ImagePlus, Plus, Sparkles } from "lucide-react";
import { PageIntro, StatCard } from "./_components/dashboard-shell";
import { useAuth } from "../../lib/auth-context";
import { getUserProjects } from "../../lib/firestore";
import type { Project } from "../../lib/firestore-types";

const quickActions = [
  { title: "Create New Design", copy: "Start from a garment idea and generate AI-powered concepts.", href: "/dashboard/projects/new", icon: Sparkles, tone: "rust" },
  { title: "Upload Existing Design", copy: "Analyze an existing fashion design and prepare it for development.", href: "/dashboard/projects/new", icon: ImagePlus, tone: "sage" },
  { title: "Create Tech-Pack", copy: "Turn an approved design into a production-ready technical package.", href: "/dashboard/tech-packs", icon: ClipboardList, tone: "lime" },
];
const pipeline = ["Requirements", "AI Design", "Refine", "Approved", "Tech-Pack"];

function formatDate(value: Project["updatedAt"]) { return value?.toDate ? value.toDate().toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recently"; }
function statusLabel(status: Project["status"]) { return status.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()); }

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { if (!currentUser) return; getUserProjects(currentUser.uid).then(setProjects).catch(() => setError("Projects could not be loaded. Check your connection and Firestore rules.")).finally(() => setLoading(false)); }, [currentUser]);
  const currentProject = projects[0];
  const pipelineIndex = currentProject ? Math.max(0, ["requirements_complete", "design_generated", "design_generated", "approved", "techpack_generated"].indexOf(currentProject.status)) : 0;
  return <div className="dashboard-home"><PageIntro eyebrow="Your workspace" title="Good morning, let's build something." description="Turn your fashion ideas into production-ready products." action={<Link className="dashboard-primary-button" href="/dashboard/projects/new"><Plus size={17} /> Create new project</Link>} />
    <section className="dashboard-section quick-section"><div className="section-row-heading"><div><span className="dashboard-eyebrow">Get started</span><h3>What are you working on?</h3></div><span className="example-note">Live workspace</span></div><div className="quick-actions">{quickActions.map(({ title, copy, href, icon: Icon, tone }) => <Link href={href} className={`quick-card quick-${tone}`} key={title}><span className="quick-icon"><Icon size={20} strokeWidth={1.6} /></span><span><strong>{title}</strong><small>{copy}</small></span><ArrowRight size={16} /></Link>)}</div></section>
    {error && <p className="form-error">{error}</p>}<div className="dashboard-columns"><section className="dashboard-section project-section"><div className="section-row-heading"><div><span className="dashboard-eyebrow">Your workspace</span><h3>Recent projects</h3></div><Link className="inline-link" href="/dashboard/projects">View all <ArrowRight size={14} /></Link></div><div className="project-table"><div className="project-table-head"><span>Project</span><span>Status</span><span>Last updated</span><span /></div>{loading ? <p className="dashboard-empty">Loading your projects...</p> : projects.length ? projects.slice(0, 5).map(project => <Link href={`/dashboard/projects/${project.projectId}`} className="project-row" key={project.projectId}><span className="project-thumb">{project.name.slice(0, 2).toUpperCase()}</span><span className="project-name"><strong>{project.name}</strong><small>{project.garmentType} / {project.season}</small></span><span className={`dashboard-status status-${project.status === "techpack_generated" ? "ready" : project.status === "draft" ? "neutral" : "accent"}`}><span />{statusLabel(project.status)}</span><span className="project-updated">{formatDate(project.updatedAt)}</span><span className="project-arrow">↗</span></Link>) : <p className="dashboard-empty">No projects yet. Create your first product brief.</p>}</div></section><section className="dashboard-section pipeline-card"><div className="section-row-heading"><div><span className="dashboard-eyebrow">Product development</span><h3>Project status</h3></div><span className="status-live">● Live</span></div><div className="status-pipeline">{pipeline.map((item, index) => <div className={`pipeline-step ${index < pipelineIndex ? "is-complete" : index === pipelineIndex ? "is-current" : ""}`} key={item}><span>{index < pipelineIndex ? "✓" : String(index + 1).padStart(2, "0")}</span><strong>{item}</strong>{index < pipeline.length - 1 && <i />}</div>)}</div><p className="pipeline-caption">{currentProject ? <>Selected project: <strong>{currentProject.name}</strong>.</> : "Create a project to see its development status."}</p></section></div>
    <section className="dashboard-section stats-section"><div className="section-row-heading"><div><span className="dashboard-eyebrow">At a glance</span><h3>Product development statistics</h3></div></div><div className="stats-grid"><StatCard label="Total projects" value={String(projects.length).padStart(2, "0")} detail="Your projects only" icon={FolderKanban} /><StatCard label="Designs generated" value="00" detail="AI integration pending" icon={Sparkles} /><StatCard label="Approved designs" value="00" detail="No approvals yet" icon={ImagePlus} /><StatCard label="Tech-packs created" value="00" detail="Generation pending" icon={FileText} /></div></section>
    <section className="getting-started"><div className="getting-mark"><Sparkles size={22} /></div><div><span className="dashboard-eyebrow">A fresh canvas</span><h3>Your next product starts here.</h3><p>Start with a garment idea, a reference, or just a direction. You can refine the rest as you go.</p></div><Link className="dashboard-secondary-button" href="/dashboard/projects/new">Create your first design <ArrowRight size={15} /></Link></section>
  </div>;
}
