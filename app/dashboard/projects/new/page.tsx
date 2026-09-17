"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileImage, ImagePlus, Upload, X } from "lucide-react";
import { PageIntro } from "../../_components/dashboard-shell";
import { useAuth } from "../../../../lib/auth-context";
import { createProject } from "../../../../lib/firestore";
import type { DesignRequirements, ProjectStatus } from "../../../../lib/firestore-types";

const steps = ["Garment basics", "Design direction", "Design requirements", "Reference images", "Review requirements"];
const garmentTypes = ["T-Shirt", "Shirt", "Overshirt", "Jacket", "Hoodie", "Sweatshirt", "Pants", "Jeans", "Cargo Pants", "Shorts", "Other"];
const genders = ["Men", "Women", "Unisex"];
const countries = ["India", "United States", "South Korea", "United Kingdom", "Japan", "Canada", "Australia", "Other"];
const seasons = ["Spring", "Summer", "Autumn", "Winter", "All Season"];
const styles = ["Korean", "Minimal", "Streetwear", "Casual", "Formal", "Utility", "Contemporary"];
const fits = ["Slim", "Regular", "Relaxed", "Oversized", "Cropped"];
const promptExample = "Create a relaxed Korean-style textured overshirt for men for winter. Use a structured but comfortable silhouette, minimal detailing, muted charcoal tone and a fabric that is practical for production in India.";

type FormState = Record<string, string>;
type LocalReference = { id: string; name: string; size: number; type: string; url: string };

function firestoreMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code.includes("permission-denied")) return "Firestore denied this request. Confirm your published rules allow your signed-in account.";
  if (code.includes("network")) return "Network error. Check your connection and try again.";
  return "We could not save this project yet. Please try again.";
}

function Field({ label, value, onChange, options, placeholder, custom = true }: { label: string; value: string; onChange: (value: string) => void; options?: string[]; placeholder?: string; custom?: boolean }) {
  const [customOpen, setCustomOpen] = useState(false);
  if (!options) return <label className="form-field"><span>{label}</span><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>;
  return <label className="form-field"><span>{label}</span><select value={customOpen ? "Custom" : value} onChange={event => { const next = event.target.value; setCustomOpen(next === "Custom"); onChange(next === "Custom" ? "" : next); }}><option value="">Select {label.toLowerCase()}</option>{options.map(option => <option key={option}>{option}</option>)}{custom && <option value="Custom">Custom</option>}</select>{customOpen && <input value={value} onChange={event => onChange(event.target.value)} placeholder={`Enter custom ${label.toLowerCase()}`} />}</label>;
}

export default function NewProjectPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({});
  const [references, setReferences] = useState<LocalReference[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const update = (key: string, value: string) => { setAnalysis(null); setForm(current => ({ ...current, [key]: value })); };
  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter(file => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
    setReferences(current => [...current, ...files.map(file => ({ id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) }))]);
    event.target.value = "";
  };
  const removeReference = (id: string) => setReferences(current => { const reference = current.find(item => item.id === id); if (reference) URL.revokeObjectURL(reference.url); return current.filter(item => item.id !== id); });
  const validateStep = () => step === 0 ? ["Project Name", "Garment Type", "Target Gender", "Target Country", "Season"].every(field => form[field]?.trim()) : step === 2 ? Boolean(form.Prompt?.trim()) : true;
  const next = () => { setError(""); if (!validateStep()) return setError(step === 0 ? "Complete the garment basics before continuing." : "Describe the design you want before continuing."); setStep(current => Math.min(4, current + 1)); };
  const submit = async () => {
    setError("");
    if (!currentUser) return setError("Your session has expired. Sign in again to create a project.");
    if (!validateStep()) return setError("Describe the design you want before continuing.");
    if (analysis && createdProjectId) return router.push(`/dashboard/projects/${createdProjectId}/design`);
    setSaving(true);
    try {
      const requirements: DesignRequirements = { prompt: form.Prompt || "", silhouette: form.Silhouette || "", length: form.Length || "", sleeveType: form["Sleeve Type"] || "", collarNeck: form["Collar / Neck Type"] || "", closure: form.Closure || "", pocketPreference: form["Pocket Preference"] || "", mustHaveDetails: form["Must-have details"] || "", detailsToAvoid: form["Details to avoid"] || "", intendedUse: form["Intended use"] || "", pricePositioning: form["Price positioning"] || "", targetCustomer: form["Target customer"] || "", references: references.map(({ name, size, type }) => ({ name, size, type })) };
      const projectId = await createProject(currentUser.uid, { name: form["Project Name"], garmentType: form["Garment Type"], targetGender: form["Target Gender"], targetCountry: form["Target Country"], season: form.Season, style: form.Style || "", fit: form.Fit || "", color: form.Color || "", preferredFabric: form["Fabric Preference"] || "", texture: form["Texture Preference"] || "", requirements: requirements.prompt, designRequirements: requirements, status: "requirements_complete" as ProjectStatus });
      setCreatedProjectId(projectId);
      setAnalysisLoading(true);
      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/ai/analyze-requirements", { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ projectId }) });
      const result = await response.json() as { analysis?: { normalizedRequirements: Record<string, unknown> }; error?: string };
      if (!response.ok || !result.analysis) throw new Error(result.error || "Requirement analysis failed.");
      setAnalysis(result.analysis.normalizedRequirements);
      setAnalysisLoading(false);
    } catch (saveError) { setAnalysisLoading(false); setError(saveError instanceof Error ? saveError.message : firestoreMessage(saveError)); } finally { setSaving(false); }
  };
  const basics = <div className="form-grid"><Field label="Project Name" value={form["Project Name"] || ""} onChange={value => update("Project Name", value)} placeholder="e.g. Resort utility overshirt" custom={false} /><Field label="Garment Type" value={form["Garment Type"] || ""} onChange={value => update("Garment Type", value)} options={garmentTypes} /><Field label="Target Gender" value={form["Target Gender"] || ""} onChange={value => update("Target Gender", value)} options={genders} custom={false} /><Field label="Target Country" value={form["Target Country"] || ""} onChange={value => update("Target Country", value)} options={countries} /><Field label="Season" value={form.Season || ""} onChange={value => update("Season", value)} options={seasons} custom={false} /></div>;
  const direction = <div className="form-grid"><Field label="Style" value={form.Style || ""} onChange={value => update("Style", value)} options={styles} /><Field label="Fit" value={form.Fit || ""} onChange={value => update("Fit", value)} options={fits} /><Field label="Silhouette" value={form.Silhouette || ""} onChange={value => update("Silhouette", value)} placeholder="e.g. Structured A-line" /><Field label="Color" value={form.Color || ""} onChange={value => update("Color", value)} placeholder="e.g. Muted charcoal" /><Field label="Fabric Preference" value={form["Fabric Preference"] || ""} onChange={value => update("Fabric Preference", value)} placeholder="e.g. Heavy cotton twill" /><Field label="Texture Preference" value={form["Texture Preference"] || ""} onChange={value => update("Texture Preference", value)} placeholder="e.g. Dry and tactile" /><Field label="Length" value={form.Length || ""} onChange={value => update("Length", value)} placeholder="e.g. Hip length" /><Field label="Sleeve Type" value={form["Sleeve Type"] || ""} onChange={value => update("Sleeve Type", value)} placeholder="e.g. Dropped shoulder" /><Field label="Collar / Neck Type" value={form["Collar / Neck Type"] || ""} onChange={value => update("Collar / Neck Type", value)} placeholder="e.g. Point collar" /><Field label="Closure" value={form.Closure || ""} onChange={value => update("Closure", value)} placeholder="e.g. Concealed zip" /><Field label="Pocket Preference" value={form["Pocket Preference"] || ""} onChange={value => update("Pocket Preference", value)} placeholder="e.g. Two utility pockets" /></div>;
  const requirements = <div className="requirements-form"><label className="form-field form-field-full"><span>Describe the design you want</span><textarea value={form.Prompt || ""} onChange={event => update("Prompt", event.target.value)} placeholder={promptExample} rows={7} /><small>Describe the garment, aesthetic, functionality, details, fit, fabric, texture, color and any specific requirements.</small></label><div className="form-grid"><Field label="Must-have details" value={form["Must-have details"] || ""} onChange={value => update("Must-have details", value)} placeholder="e.g. Reinforced elbow panels" /><Field label="Details to avoid" value={form["Details to avoid"] || ""} onChange={value => update("Details to avoid", value)} placeholder="e.g. Excessive branding" /><Field label="Intended use" value={form["Intended use"] || ""} onChange={value => update("Intended use", value)} placeholder="e.g. Everyday city wear" /><Field label="Price positioning" value={form["Price positioning"] || ""} onChange={value => update("Price positioning", value)} placeholder="e.g. Premium accessible" /><Field label="Target customer" value={form["Target customer"] || ""} onChange={value => update("Target customer", value)} placeholder="e.g. Design-conscious professionals" /></div></div>;
  const referencesContent = <div className="reference-area"><div className="upload-dropzone"><div className="upload-icon"><Upload size={19} /></div><strong>Select reference images</strong><p>Local preview only. Files are not uploaded or stored yet.</p><label className="outline-button" htmlFor="reference-images"><ImagePlus size={15} /> Choose files</label><input id="reference-images" className="visually-hidden" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple onChange={handleFiles} /><small>JPG, JPEG, PNG or WEBP / Up to 10MB each</small></div>{references.length > 0 && <div className="reference-preview-grid">{references.map(reference => <div className="reference-preview" key={reference.id}><img src={reference.url} alt={reference.name} /><button type="button" onClick={() => removeReference(reference.id)} aria-label={`Remove ${reference.name}`}><X size={14} /></button><span><FileImage size={12} />{reference.name}<small>{(reference.size / 1024 / 1024).toFixed(2)} MB</small></span></div>)}</div>}</div>;
  const review = <div className="review-summary"><div className="review-note"><span className="status-pulse" /> Review your requirements before opening the design workspace.</div><div className="review-section"><span>Garment</span><div className="summary-grid">{["Garment Type", "Target Gender", "Target Country", "Season"].map(key => <div key={key}><b>{key}</b><strong>{form[key] || "Not specified"}</strong></div>)}</div></div><div className="review-section"><span>Design</span><div className="summary-grid">{["Style", "Fit", "Silhouette", "Color", "Fabric Preference", "Texture Preference", "Must-have details"].map(key => <div key={key}><b>{key}</b><strong>{form[key] || "Not specified"}</strong></div>)}</div></div><div className="review-section"><span>User requirements</span><div className="review-long"><b>Prompt</b><p>{form.Prompt || "Not specified"}</p>{["Details to avoid", "Intended use", "Target customer"].map(key => <p key={key}><b>{key}:</b> {form[key] || "Not specified"}</p>)}</div></div><div className="review-section"><span>References</span><div className="review-reference-row">{references.length ? references.map(reference => <img src={reference.url} key={reference.id} alt={reference.name} />) : <small>No reference images selected.</small>}</div></div></div>;
  const content = [basics, direction, requirements, referencesContent, review][step];
  const editRequirements = step === 4 ? <button className="outline-button review-edit-button" type="button" onClick={() => { setStep(1); setAnalysis(null); }}>Edit requirements</button> : null;
  const analysisPanel = analysis && <div className="normalized-analysis"><div className="review-note"><span className="status-pulse" /> AI analysis complete. Review it before continuing.</div>{Object.entries(analysis).map(([group, value]) => <div className="analysis-group" key={group}><span>{group.replace(/([A-Z])/g, " $1")}</span><div>{typeof value === "object" && value !== null ? Object.entries(value as Record<string, unknown>).map(([key, item]) => <p key={key}><b>{key.replace(/([A-Z])/g, " $1")}:</b> {Array.isArray(item) ? item.join(", ") || "Not specified" : item === null || item === "" ? "Not specified" : String(item)}</p>) : <p>{String(value)}</p>}</div></div>)}</div>;
  return <div className="form-page design-create-page"><PageIntro eyebrow="Projects / Create design" title="Build the brief behind the garment." description="A considered design starts with requirements that can make it all the way to production." action={<Link className="quiet-back-link" href="/dashboard"><ArrowLeft size={15} /> Back to dashboard</Link>} /><div className="form-layout"><aside className="step-sidebar"><span className="dashboard-eyebrow">Design workflow</span><div className="form-step-list">{steps.map((item, index) => <button className={`form-step ${step === index ? "is-active" : ""} ${step > index ? "is-done" : ""}`} key={item} onClick={() => setStep(index)}><span>{step > index ? <Check size={13} /> : String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></button>)}</div><p>References stay local in this phase. Firebase Storage will be connected later without changing this workflow.</p></aside><section className="form-panel"><div className="form-panel-heading"><span className="dashboard-eyebrow">Step {String(step + 1).padStart(2, "0")} / 05</span><h3>{steps[step]}</h3><p>{step === 0 ? "Start with the garment and market context." : step === 1 ? "Shape the silhouette, material and construction direction." : step === 2 ? "Give the future design system a natural-language brief." : step === 3 ? "Add visual references without uploading them yet." : "Review every requirement before entering the design workspace."}</p></div>{content}{step === 4 && analysisPanel}{editRequirements}{error && <p className="form-error">{error}</p>}<div className="form-footer"><button className="quiet-button" type="button" disabled={step === 0 || saving || analysisLoading} onClick={() => setStep(current => current - 1)}><ArrowLeft size={15} /> Previous</button>{step < 4 ? <button className="dashboard-primary-button" type="button" onClick={next}>Continue <ArrowRight size={15} /></button> : <button className="dashboard-primary-button" type="button" disabled={saving || analysisLoading} onClick={submit}>{analysisLoading ? "Analyzing requirements..." : analysis ? "Confirm & continue" : "Analyze with StyleSense AI"}<ArrowRight size={15} /></button>}</div></section></div></div>;
}
