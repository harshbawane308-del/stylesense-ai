"use client";

import Link from "next/link";
import { ArrowUpRight, Download, FileText, Plus } from "lucide-react";
import { PageIntro, StatusBadge } from "../_components/dashboard-shell";

const techPacks = [
  ["TP-2025-004", "Minimal Utility Jacket", "v1.0", "Ready for review", "04 Sep 2025", "ready"],
  ["TP-2025-003", "Relaxed Cargo Pants", "v2.1", "In development", "28 Aug 2025", "accent"],
  ["TP-2025-002", "Textured Overshirt", "v1.2", "Ready for review", "19 Aug 2025", "ready"],
  ["TP-2025-001", "Everyday Box Tee", "v1.0", "Draft", "08 Aug 2025", "neutral"],
] as const;

export default function TechPacksPage() {
  return <div className="tech-packs-page"><PageIntro eyebrow="Workspace / Technical development" title="Tech-packs." description="A clear production handoff for every approved design direction." action={<Link className="dashboard-primary-button" href="/dashboard/design"><Plus size={16} /> New tech-pack</Link>} /><div className="tech-pack-toolbar"><div className="tech-pack-tabs"><button className="is-active">All tech-packs <span>04</span></button><button>In development <span>01</span></button><button>Ready for review <span>02</span></button></div><span className="example-note"><FileText size={14} /> Example data for UI preview</span></div><div className="tech-pack-table"><div className="tech-pack-head"><span>Tech-pack</span><span>Garment</span><span>Version</span><span>Status</span><span>Created</span><span /></div>{techPacks.map(([number, garment, version, status, date, tone]) => <Link className="tech-pack-row" href="/dashboard/design" key={number}><span className="tech-pack-number"><FileText size={17} />{number}</span><strong>{garment}</strong><span>{version}</span><StatusBadge tone={tone}>{status}</StatusBadge><span>{date}</span><span className="tech-row-action"><ArrowUpRight size={15} /> View</span></Link>)}</div><div className="tech-pack-note"><Download size={17} /><div><strong>Technical documentation is on the way.</strong><p>Once connected, approved concepts will become structured production packages with measurements, construction, materials, BOM and care details.</p></div></div></div>;
}