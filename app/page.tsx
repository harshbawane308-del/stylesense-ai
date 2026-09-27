"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronRight,
  CircleDashed,
  ClipboardList,
  Cloud,
  FileText,
  Layers3,
  LineChart,
  Menu,
  MoveUpRight,
  ArrowUpRight,
  PenLine,
  Ruler,
  Scissors,
  Sparkles,
  SquareDashedMousePointer,
  SwatchBook,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

const capabilities = [
  [Sparkles, "AI design generation", "Move from a brief to a considered design concept."],
  [LineChart, "Trend intelligence", "Ground every direction in relevant market signals."],
  [Layers3, "Front / back / side", "Inspect the full silhouette before you commit."],
  [Zap, "Design regeneration", "Explore new directions without losing your brief."],
  [PenLine, "Prompt-based editing", "Refine fit, detail and mood with natural language."],
  [SwatchBook, "Fabric intelligence", "Make material choices part of the design logic."],
  [CircleDashed, "Texture representation", "Bring surface, handfeel and finish into focus."],
  [Scissors, "Pattern intelligence", "Keep construction thinking close to the creative work."],
  [Ruler, "Country-specific measurements", "Design with regional sizing and measurement logic."],
  [ClipboardList, "Production-ready tech-pack", "Turn the approved concept into a clear handoff."],
] as const;

const steps = [
  ["01", "Define", "Enter garment type, style, fit, country, season and additional requirements."],
  ["02", "Generate", "AI reads the brief, trends and constraints to create a design concept."],
  ["03", "Refine", "Review views, regenerate directions or edit the design with prompts."],
  ["04", "Develop", "Approve the direction and generate a production-oriented tech-pack."],
] as const;

const pipeline = ["Idea", "Requirements", "AI Analysis", "Trend Intelligence", "Design Generation", "Front / Back / Side", "Refine", "Approve", "Tech-Pack", "Manufacturing"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label"><span />{children}</p>;
}

function ArrowButton({ children, dark = false, href = "/dashboard/projects/new" }: { children: React.ReactNode; dark?: boolean; href?: string }) {
  return <Link href={href} className={`button-arrow ${dark ? "button-arrow-dark" : ""}`}>{children}<ArrowRight size={16} /></Link>;
}

function WorkflowVisual() {
  return (
    <div className="workflow-visual" aria-label="StyleSense design development workflow illustration">
      <div className="visual-topline"><span>DESIGN DEVELOPMENT / 001</span><span>STYLE / SYSTEM</span></div>
      <div className="visual-grid">
        <div className="garment-figure" aria-hidden="true"><div className="figure-shadow" /><div className="figure-body"><div className="figure-neck" /><div className="figure-sleeve left" /><div className="figure-sleeve right" /><div className="figure-seam" /><div className="figure-pocket" /></div></div>
        <div className="visual-notes"><span className="note-line" /><span>DRAPED<br />UTILITY / 04</span><span className="note-line short" /><span className="note-copy">A considered system<br />for the next garment.</span></div>
      </div>
      <div className="visual-flow">
        {[["01", "Requirement"], ["02", "AI Design"], ["03", "F / B / S"], ["04", "Approved"], ["05", "Tech-Pack"]].map(([number, label], index) => <div className="flow-node" key={label}><span>{number}</span><strong>{label}</strong>{index < 4 && <ArrowRight size={13} />}</div>)}
      </div>
    </div>
  );
}

function TechPackPreview() {
  return <div className="tech-preview">
    <div className="paper-header"><span>STYLESENSE / TECHNICAL DEVELOPMENT</span><span>SS / 001 — 2025</span></div>
    <div className="paper-title"><div><span className="paper-kicker">TECH-PACK PREVIEW</span><h3>Modern Utility<br /><em>Overshirt</em></h3></div><span className="status-pill"><CircleDashed size={11} /> IN DEVELOPMENT</span></div>
    <div className="paper-sketches"><div className="paper-sketch main-sketch"><div className="mini-garment" /><span>TECHNICAL SKETCH</span></div><div className="paper-sketch"><div className="mini-garment back" /><span>FRONT / BACK / SIDE</span></div><div className="paper-data"><span>FABRIC</span><strong>Cotton twill / 280 GSM</strong><span>COLORWAY</span><strong>Mineral / 01</strong><span>POM</span><strong>06 MEASUREMENTS</strong></div></div>
    <div className="paper-footer"><span><Ruler size={13} /> MEASUREMENTS / POM</span><span><Layers3 size={13} /> CONSTRUCTION DETAILS</span><span><ClipboardList size={13} /> BOM / CARE</span></div>
  </div>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <main>
    <nav className="site-nav"><a href="#top" className="brand"><span className="brand-mark"><span /><span /></span><span>StyleSense <b>AI</b></span></a><div className={`nav-links ${menuOpen ? "is-open" : ""}`}><a href="#workflow" onClick={() => setMenuOpen(false)}>How it works</a><a href="#capabilities" onClick={() => setMenuOpen(false)}>Capabilities</a><a href="#difference" onClick={() => setMenuOpen(false)}>The difference</a><a href="#tech-pack" onClick={() => setMenuOpen(false)}>Tech-pack</a></div><div className="nav-actions"><a className="nav-login" href="/sign-in">Sign in</a><a className="nav-start" href="/dashboard/projects/new">Start creating <ArrowUpRight size={14} /></a></div><button className="menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></nav>

    <section className="hero" id="top"><div className="hero-copy"><motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}><SectionLabel>THE INTELLIGENT FASHION WORKFLOW</SectionLabel><h1>From fashion idea<br /><i>to production-ready</i><br />tech-pack.</h1><p className="hero-description">Design smarter with AI. Turn your fashion requirements into manufacturable designs, then transform approved concepts into detailed technical packages.</p><div className="hero-actions"><ArrowButton dark>Start creating</ArrowButton><a className="text-link" href="#workflow">Explore how it works <ArrowDown size={15} /></a></div></motion.div><div className="hero-meta"><span><span className="signal-dot" /> Built for the entire product journey</span><span>01 / 06</span></div></div><motion.div className="hero-art" initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 1, scale: 1 }}><WorkflowVisual /></motion.div></section>

    <section className="marquee" aria-label="Product principle"><div>DESIGN WITH INTENT <span>✳</span> DEVELOP WITH PRECISION <span>✳</span> BUILD WITH CONFIDENCE <span>✳</span> DESIGN WITH INTENT <span>✳</span></div></section>

    <section className="section process" id="workflow"><div className="section-heading"><div><SectionLabel>A BETTER WAY TO BUILD</SectionLabel><h2>The creative brief is<br /><i>just the beginning.</i></h2></div><p>StyleSense connects creative decisions to the production thinking behind them, so every iteration moves the garment forward.</p></div><div className="step-grid">{steps.map(([number, title, copy], index) => <motion.article className="step" key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ delay: index * .08 }}><span className="step-number">{number}</span><div className="step-icon">{index === 0 ? <Target /> : index === 1 ? <Sparkles /> : index === 2 ? <SquareDashedMousePointer /> : <FileText />}</div><h3>{title}</h3><p>{copy}</p><a href="#start" aria-label={`Learn more about ${title}`}><ChevronRight size={17} /></a></motion.article>)}</div></section>

    <section className="section capabilities" id="capabilities"><div className="section-heading compact"><div><SectionLabel>THE TOOLKIT</SectionLabel><h2>Everything your<br /><i>idea needs next.</i></h2></div><p>One intelligent foundation for concept development, visual exploration and the technical decisions that make a garment real.</p></div><div className="cap-grid">{capabilities.map(([Icon, title, copy]) => <article className="capability" key={title}><Icon size={19} strokeWidth={1.5} /><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></section>

    <section className="difference" id="difference"><div className="difference-intro"><SectionLabel>THE DIFFERENCE</SectionLabel><h2>Good design<br /><i>knows what comes next.</i></h2><p>Appearance matters. But a garment only becomes valuable when the thinking behind it can make it to the factory floor.</p></div><div className="comparison"><div className="comparison-side old"><span className="comparison-label">TRADITIONAL AI FASHION GENERATOR</span><h3>Looks good<br /><i>on screen.</i></h3>{["Focuses primarily on appearance", "Can generate unrealistic materials", "Limited manufacturing awareness", "Pattern details may be inaccurate", "Technical documentation requires manual work"].map(point => <p key={point}><X size={15} />{point}</p>)}</div><div className="comparison-side new"><span className="comparison-label">STYLESENSE AI / THE NEW STANDARD</span><h3>Looks good.<br /><i>Works hard.</i></h3>{["Design + manufacturing considered together", "Fabric-aware design development", "Texture-aware visualization", "Pattern and construction intelligence", "Country-specific measurement logic", "Automated technical documentation"].map(point => <p key={point}><Check size={15} />{point}</p>)}</div></div></section>

    <section className="section pipeline-section"><div className="section-heading compact"><div><SectionLabel>ONE CONNECTED SYSTEM</SectionLabel><h2>From a first thought<br /><i>to a finished handoff.</i></h2></div><p>No disconnected tools. No creative work getting lost in translation. Just a clear path from intent to execution.</p></div><div className="pipeline">{pipeline.map((item, index) => <div className="pipeline-item" key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong>{index < pipeline.length - 1 && <ArrowRight size={14} />}</div>)}</div></section>

    <section className="section tech-section" id="tech-pack"><div className="tech-copy"><SectionLabel>THE HANDOFF</SectionLabel><h2>Clarity is the<br /><i>final creative act.</i></h2><p>The tech-pack preview shows how an approved direction can gather the details a production partner needs in one considered document.</p><div className="preview-list"><span><Cloud size={17} /> Structured for collaboration</span><span><FileText size={17} /> Ready for the next stage</span></div><ArrowButton>Explore the workflow</ArrowButton></div><TechPackPreview /></section>

    <section className="section audience" id="start"><div className="audience-heading"><SectionLabel>BUILT FOR THE NEXT GENERATION</SectionLabel><h2>For people who<br /><i>make things real.</i></h2></div><div className="audience-grid">{["Fashion entrepreneurs", "Fashion designers", "Clothing brands", "Product development teams", "Manufacturers", "Fashion students"].map((item, index) => <a href="#top" className="audience-card" key={item}><span>0{index + 1}</span><strong>{item}</strong><MoveUpRight size={18} /></a>)}</div></section>

    <section className="final-cta"><div><SectionLabel>A MORE INTELLIGENT WAY FORWARD</SectionLabel><h2>Build your next<br /><i>garment with intelligence.</i></h2><p>Go from an idea to a refined fashion concept and technical package with one intelligent workflow.</p><ArrowButton dark>Start creating</ArrowButton></div><div className="cta-orbit"><div className="orbit-center">SS<span>AI</span></div><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span className="orbit-label top">IDEA</span><span className="orbit-label right">DESIGN</span><span className="orbit-label bottom">BUILD</span></div></section>

    <footer id="footer"><div className="footer-top"><a href="#top" className="brand"><span className="brand-mark"><span /><span /></span><span>StyleSense <b>AI</b></span></a><p>AI-powered fashion<br />product development.</p><div className="footer-links"><a href="#capabilities">Product</a><a href="#workflow">How it works</a><a href="#difference">Technology</a><a href="#start">About</a><a href="mailto:hello@stylesense.ai">Contact</a></div></div><div className="footer-bottom"><span>© 2025 StyleSense AI</span><span>Designed for the future of fashion <Sparkles size={13} /></span><span>Privacy / Terms</span></div></footer>
  </main>;
}
