"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Edit3, FileText, Info, RefreshCw, Sparkles } from "lucide-react";
import { PageIntro } from "../../../_components/dashboard-shell";
import { useAuth } from "../../../../../lib/auth-context";
import { getProject, updateProject } from "../../../../../lib/firestore";
import type { Project } from "../../../../../lib/firestore-types";

const pipelineSteps = [
  "Preparing brief",
  "Analyzing design requirements",
  "Studying fashion direction",
  "Selecting fabric direction",
  "Developing design",
  "Generating visual",
  "Finalizing",
];

const versions = ["Version 1", "Version 2", "Version 3", "Version 4"];

function errorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  return code.includes("permission-denied") ? "Firestore denied this update. Check your published rules." : "The project could not be updated. Try again.";
}

async function persistGeneratedImages(projectId: string, userId: string, idToken: string, version: number, design: NonNullable<Project["generatedDesign"]> & { frontImageUrl: string; backImageUrl: string; sideImageUrl: string }) {
  const images = [
    ["front", design.frontImageUrl],
    ["back", design.backImageUrl],
    ["side", design.sideImageUrl],
  ] as const;
  const urls = await Promise.all(images.map(async ([view, dataUrl]) => {
    const response = await fetch("/api/storage/upload", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ projectId, path: `projects/${userId}/${projectId}/design-v${version}/${view}.jpg`, dataUrl }),
    });
    const result = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "Image storage failed.");
    return [view, result.url] as const;
  }));

  return Object.fromEntries(urls) as { front: string; back: string; side: string };
}

export default function ProjectDesignWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [version, setVersion] = useState("Version 1");
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationProgress, setGenerationProgress] = useState<string[]>(pipelineSteps);
  const [generatedDesign, setGeneratedDesign] = useState<{
    conceptName?: string;
    designSummary?: string;
    designStory?: string;
    silhouette?: string;
    primaryColor?: string;
    fabricDirection?: string;
    frontImageUrl: string | null;
    backImageUrl: string | null;
    sideImageUrl: string | null;
  } | null>(null);

  useEffect(() => {
    if (!currentUser || !projectId) return;

    getProject(projectId, currentUser.uid)
      .then((result) => {
        setProject(result);
        setApproved(result?.status === "approved");
        if (result?.generatedDesign?.frontImageUrl && result.generatedDesign.backImageUrl && result.generatedDesign.sideImageUrl) {
          setGeneratedDesign(result.generatedDesign);
        }
      })
      .catch(() => {
        setError("This project could not be loaded. Check your connection and Firestore rules.");
      })
      .finally(() => setLoading(false));
  }, [currentUser, projectId]);

  const intelligence = useMemo(
    () => [
      { label: "Design direction", value: project?.style || "To be reasoned from brief" },
      { label: "Fabric", value: project?.fabricIntelligence?.result?.recommendedFabrics[0]?.fabricName || project?.preferredFabric || "To be selected" },
      { label: "Texture", value: project?.texture || "To be validated" },
      { label: "Construction", value: project?.designRequirements?.pocketPreference || "Construction details pending" },
      { label: "Color", value: project?.color || "To be developed" },
      { label: "Fit", value: project?.fit || "To be developed" },
      { label: "Manufacturing notes", value: "Feasibility review pending" },
    ],
    [project],
  );

  const handleGenerateDesign = async (mode: "initial" | "regenerate" = "initial") => {
    if (!project || !currentUser) {
      const message = "Project data is not available yet. Refresh and try again.";
      setGenerationError(message);
      console.error("Generate design blocked: missing project or user", {
        project: !!project,
        user: !!currentUser,
        projectId: project?.projectId,
      });
      return;
    }

    setIsGenerating(true);
    setGenerationError("");
    setGenerationProgress(pipelineSteps.map((step, index) => (index === 0 ? step : "Waiting...")));

    try {
      const response = await fetch("/api/ai/generate-design", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${await currentUser.getIdToken()}`,
        },
        body: JSON.stringify({
          projectId: project.projectId,
          editPrompt: editPrompt.trim() || undefined,
          mode,
        }),
      });

      const result = (await response.json()) as {
        design?: {
          conceptName?: string;
          designSummary?: string;
          designStory?: string;
          silhouette?: string;
          primaryColor?: string;
          fabricDirection?: string;
          frontImageUrl?: string | null;
          backImageUrl?: string | null;
          sideImageUrl?: string | null;
        };
        pipeline?: Array<{ label: string; status: string; message?: string }>;
        error?: string;
      };

      if (!response.ok) throw new Error(result.error || "Design generation failed.");
      if (!result.design) throw new Error("The backend returned no design payload.");

      const generatedDesignRecord = {
        conceptName: result.design.conceptName,
        designSummary: result.design.designSummary,
        designStory: result.design.designStory,
        silhouette: result.design.silhouette,
        primaryColor: result.design.primaryColor,
        fabricDirection: result.design.fabricDirection,
        frontImageUrl: result.design.frontImageUrl ?? null,
        backImageUrl: result.design.backImageUrl ?? null,
        sideImageUrl: result.design.sideImageUrl ?? null,
      };

      if (!generatedDesignRecord.frontImageUrl || !generatedDesignRecord.backImageUrl || !generatedDesignRecord.sideImageUrl) {
        throw new Error("The image generation response did not contain all three generated images.");
      }

      const storedImageUrls = await persistGeneratedImages(project.projectId, currentUser.uid, await currentUser.getIdToken(), mode === "regenerate" ? (project.generatedDesign?.version ?? 0) + 1 : 1, generatedDesignRecord as NonNullable<Project["generatedDesign"]> & { frontImageUrl: string; backImageUrl: string; sideImageUrl: string });
      const persistedDesign = { ...generatedDesignRecord, conceptName: generatedDesignRecord.conceptName || project.name, designSummary: generatedDesignRecord.designSummary || "Design concept generated from the project brief.", designStory: generatedDesignRecord.designStory || "Design story generated from the project brief.", silhouette: generatedDesignRecord.silhouette || project.style || "Modern silhouette", primaryColor: generatedDesignRecord.primaryColor || project.color || "Not specified", fabricDirection: generatedDesignRecord.fabricDirection || project.preferredFabric || "To be selected", frontImageUrl: storedImageUrls.front, backImageUrl: storedImageUrls.back, sideImageUrl: storedImageUrls.side, version: mode === "regenerate" ? (project.generatedDesign?.version ?? 0) + 1 : 1, generatedAt: new Date().toISOString(), blueprint: {} };
      await updateProject(project.projectId, currentUser.uid, { generatedDesign: persistedDesign, designVersion: persistedDesign.version, status: "design_generated" });
      setProject(current => current ? { ...current, generatedDesign: persistedDesign, status: "design_generated" } : current);
      setGeneratedDesign(persistedDesign);

      setGenerationProgress(result.pipeline?.map((item) => item.label) ?? pipelineSteps);
      setEditPrompt("");
      setEditing(false);
    } catch (workerError) {
      const message = workerError instanceof Error ? workerError.message : "Design generation failed.";
      setGenerationError(message);
      console.error("Generate Design request failed", { projectId: project.projectId, error: workerError });
    } finally {
      setIsGenerating(false);
    }
  };

  const approve = async () => {
    if (!project || !currentUser) return;

    setBusy(true);
    setError("");

    try {
      await updateProject(project.projectId, currentUser.uid, { status: "approved" });
      setProject({ ...project, status: "approved" });
      setApproved(true);
    } catch (approvalError) {
      setError(errorMessage(approvalError));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="design-loading">
        <Sparkles size={20} />
        <span>Loading design workspace...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="dashboard-empty">
        <p>{error || "Project not found."}</p>
        <Link className="inline-link" href="/dashboard/projects">
          <ArrowLeft size={14} /> Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="project-workspace-page">
      <PageIntro
        eyebrow={`Project / ${project.name}`}
        title="Design workspace."
        description="Create and review a design direction from the project brief."
        action={
          <Link className="quiet-back-link" href={`/dashboard/projects/${project.projectId}`}>
            <ArrowLeft size={15} /> Project overview
          </Link>
        }
      />

      <div className="workspace-layout">
        <aside className="workspace-requirements">
          <div className="workspace-panel-heading">
            <span className="dashboard-eyebrow">Design requirements</span>
            <Link href={`/dashboard/projects/${project.projectId}`} aria-label="Edit requirements">
              <Edit3 size={15} />
            </Link>
          </div>

          <h3>{project.name}</h3>

          <div className="workspace-facts">
            {[
              ["Garment", project.garmentType],
              ["Style", project.style],
              ["Fit", project.fit],
              ["Color", project.color],
              ["Fabric", project.preferredFabric],
              ["Texture", project.texture],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <span>{String(label)}</span>
                <strong>{String(value || "Not specified")}</strong>
              </div>
            ))}
          </div>

          <div className="workspace-prompt">
            <span>User prompt</span>
            <p>{project.requirements || "No natural-language prompt entered."}</p>
          </div>
        </aside>

        <section className="design-preview-panel">
          <div className="workspace-section-heading">
            <div>
              <span className="dashboard-eyebrow">Design preview</span>
              <h3>{generatedDesign?.conceptName || "Front, back and side views"}</h3>
            </div>

            <label className="version-control">
              <ChevronDown size={14} />
              <select value={version} onChange={(event) => setVersion(event.target.value)}>
                {versions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="view-panels">
            {[
              { label: "Front view", image: generatedDesign?.frontImageUrl ?? null },
              { label: "Back view", image: generatedDesign?.backImageUrl ?? null },
              { label: "Side view", image: generatedDesign?.sideImageUrl ?? null },
            ].map((view, index) => (
              <div className={`empty-design-view view-${index}`} key={view.label}>
                {view.image ? (
                  <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 16, overflow: "hidden" }}>
                    <Image src={view.image} alt={view.label} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                  </div>
                ) : (
                  <div className="empty-garment">
                    <span />
                    <i />
                    <b />
                  </div>
                )}
                <div>
                  <strong>{view.label}</strong>
                  <small>{generatedDesign?.designSummary || "Your design will appear here"}</small>
                </div>
                {!view.image && <span className="empty-view-label">PREVIEW AREA</span>}
              </div>
            ))}
          </div>

          <div className="generation-state">
            <div className="generation-state-heading">
              <div>
                <Sparkles size={16} />
                <strong>{isGenerating ? "Generating design..." : generatedDesign ? "Design ready" : "Single action workflow"}</strong>
              </div>
              <span>{isGenerating ? "Processing" : generatedDesign ? "Ready for review" : "Awaiting brief"}</span>
            </div>

            <div className="design-stage-list">
              {generationProgress.map((step, index) => (
                <div key={`${step}-${index}`} className={`design-stage-item ${index === generationProgress.length - 1 ? "is-complete" : "is-active"}`}>
                  <span className="stage-dot" />
                  <div>
                    <strong>{step}</strong>
                    <small>{index === generationProgress.length - 1 ? "Current stage" : "Completed"}</small>
                  </div>
                </div>
              ))}
            </div>

            {generationError && <p className="form-error">{generationError}</p>}
          </div>

          <div className="workspace-actions-bar">
            <button className="primary-button" type="button" onClick={() => handleGenerateDesign("initial")} disabled={isGenerating || !currentUser || !project}>
              {isGenerating ? "Generating..." : "Generate Design"}
            </button>
            <button className="outline-button" type="button" onClick={() => handleGenerateDesign("regenerate")} disabled={isGenerating || !currentUser || !project}>
              <RefreshCw size={15} /> Regenerate
            </button>
            <button className="outline-button" type="button" onClick={() => setEditing((value) => !value)} disabled={isGenerating || !currentUser || !project}>
              <Edit3 size={15} /> {editing ? "Close edit" : "Edit Design"}
            </button>
            <button className="outline-button" type="button" onClick={approve} disabled={busy || approved || !currentUser || !project}>
              <Check size={15} /> {approved ? "Approved" : "Approve Design"}
            </button>
            {approved && (
              <Link className="outline-button" href={`/dashboard/tech-packs?projectId=${project.projectId}`}>
                <FileText size={15} /> Create Tech Pack
              </Link>
            )}
          </div>

          {editing && (
            <div className="edit-form-panel">
              <label className="form-field form-field-full">
                <span>Edit design prompt</span>
                <textarea value={editPrompt} onChange={(event) => setEditPrompt(event.target.value)} placeholder="Refine the concept with a new instruction" rows={4} />
                <button className="primary-button" type="button" onClick={() => handleGenerateDesign("regenerate")} disabled={isGenerating || !editPrompt.trim()}>
                  {isGenerating ? "Applying edit..." : "Apply edit and regenerate"}
                </button>
              </label>
            </div>
          )}

          <div className="design-intelligence-grid">
            <div className="intelligence-item">
              <span>Concept summary</span>
              <strong>{generatedDesign?.designSummary || "Generate a design to create a concept summary."}</strong>
            </div>
            <div className="intelligence-item">
              <span>Design story</span>
              <strong>{generatedDesign?.designStory || "The design story will appear after the backend flow finishes."}</strong>
            </div>
          </div>
        </section>

        <aside className="intelligence-panel">
          <div className="workspace-panel-heading">
            <span className="dashboard-eyebrow">Design intelligence</span>
            <Info size={15} />
          </div>

          <div className="design-intelligence-grid">
            {intelligence.map((item) => (
              <div key={item.label} className="intelligence-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          {generatedDesign && (
            <div className="trend-panel">
              <span className="dashboard-eyebrow">Generated design</span>
              <p className="trend-summary">
                <strong>{generatedDesign.conceptName || project.name}</strong>
                <br />
                {generatedDesign.designSummary || "Design concept ready for review."}
              </p>

              <div className="trend-block">
                <h4>Key decisions</h4>
                <ul>
                  {generatedDesign.silhouette && <li>Silhouette: {generatedDesign.silhouette}</li>}
                  {generatedDesign.primaryColor && <li>Primary color: {generatedDesign.primaryColor}</li>}
                  {generatedDesign.fabricDirection && <li>Fabric direction: {generatedDesign.fabricDirection}</li>}
                </ul>
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
        </aside>
      </div>
    </div>
  );
}
