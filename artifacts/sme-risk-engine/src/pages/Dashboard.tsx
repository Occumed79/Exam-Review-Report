import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Briefcase,
  Calculator,
  Database,
  Globe,
  Grid3x3,
  Pill,
  Search,
  ShieldCheck,
  BookMarked,
} from "lucide-react";

type Tool = {
  href: string;
  title: string;
  short: string;
  icon: typeof Activity;
  keywords: string;
  tier: "intelligence" | "review" | "evidence";
};

const TOOLS: Tool[] = [
  {
    href: "/injury-intelligence",
    title: "Injury Intelligence",
    short: "Measured BLS injury surveillance, OSHA severe-injury context, occupation demands, and finding-to-job context.",
    icon: Activity,
    keywords: "injury history occupation body part mechanism prevalence incidence bls osha job finding shoulder back knee",
    tier: "intelligence",
  },
  {
    href: "/job-intelligence",
    title: "Job Intelligence",
    short: "Live O*NET occupation lookup, functions, physical demands, and work context.",
    icon: Briefcase,
    keywords: "job occupation onet duties essential functions physical cognitive safety demand",
    tier: "intelligence",
  },
  {
    href: "/drugs",
    title: "Drug Checker",
    short: "Medication identity and reviewed occupational flags.",
    icon: Pill,
    keywords: "drug medication rx sedating pharmacy occupational rxnorm",
    tier: "review",
  },
  {
    href: "/calculator",
    title: "Clinical Calculators",
    short: "BMI, eGFR, MAP, pack-years, walking METs, plus the current official AHA PREVENT launch point.",
    icon: Calculator,
    keywords: "calculator bmi egfr map pack years mets prevent cardiovascular clinical value",
    tier: "review",
  },
  {
    href: "/guidelines",
    title: "Condition Reference",
    short: "Condition triggers, reviewer questions, internal guidance, and live PubMed results.",
    icon: BookOpen,
    keywords: "guideline condition medical guidance trigger questions pubmed standard rule",
    tier: "review",
  },
  {
    href: "/matrix",
    title: "Standards Matrix",
    short: "Current source starting points for common occupational review frameworks.",
    icon: Grid3x3,
    keywords: "standard matrix nfpa 1580 fmcsa faa deployment compare",
    tier: "review",
  },
  {
    href: "/aor",
    title: "AOR / Deployment",
    short: "Country, climate, medical access, pharmacy, security, and evacuation reference context.",
    icon: Globe,
    keywords: "country deployment aor travel climate disease pharmacy evacuation medical access",
    tier: "review",
  },
  {
    href: "/citations",
    title: "Citation Finder",
    short: "Find supporting literature and source material for a review question.",
    icon: BookMarked,
    keywords: "citation evidence source literature research support pubmed",
    tier: "evidence",
  },
  {
    href: "/sources",
    title: "Source Library",
    short: "Reusable source links and reference material.",
    icon: Database,
    keywords: "source library reference link evidence",
    tier: "evidence",
  },
  {
    href: "/guideline-editor",
    title: "Guideline Editor",
    short: "Maintain reviewed internal guidance independently from an examinee.",
    icon: ShieldCheck,
    keywords: "editor internal guideline save guidance",
    tier: "evidence",
  },
];

type IntelligenceStatus = {
  onet?: { configured?: boolean };
  bls?: { configured?: boolean; measuredTables?: boolean };
  osha?: { publicSevereInjuryData?: boolean };
};

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: active ? "#9fc7bd" : "rgba(255,255,255,0.2)",
        boxShadow: active ? "0 0 8px rgba(159,199,189,0.45)" : "none",
        flexShrink: 0,
      }}
    />
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<IntelligenceStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/intelligence/status")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data === "object") setStatus(data as IntelligenceStatus);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return TOOLS.filter((tool) => `${tool.title} ${tool.short} ${tool.keywords}`.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const intelligence = TOOLS.filter((tool) => tool.tier === "intelligence");
  const reviewTools = TOOLS.filter((tool) => tool.tier === "review");
  const evidenceTools = TOOLS.filter((tool) => tool.tier === "evidence");

  return (
    <div className="workbench" data-testid="reviewer-tool-hub">
      <header className="workbench-header">
        <div>
          <div className="workbench-kicker">EXAM REVIEWER / WORKBENCH</div>
          <h1>Exam Reviewer Workbench</h1>
          <p>Independent occupational, clinical, deployment, and evidence tools. Open the one you need; no case setup or required sequence.</p>
        </div>

        <div className="source-status liquid-glass" aria-label="Intelligence source availability">
          <div className="source-status-label">SOURCE STATUS</div>
          <div className="source-status-items">
            <span><StatusDot active={Boolean(status?.onet?.configured)} /> O*NET</span>
            <span><StatusDot active={Boolean(status?.bls?.measuredTables || status?.bls?.configured)} /> BLS</span>
            <span><StatusDot active={Boolean(status?.osha?.publicSevereInjuryData)} /> OSHA</span>
          </div>
        </div>
      </header>

      <section className="command-panel liquid-glass">
        <div className="command-label">FIND A TOOL</div>
        <div className="command-input-wrap">
          <Search size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && matches.length === 1) setLocation(matches[0].href); }}
            placeholder="Medication, occupation, injury, deployment, calculator, citation…"
            aria-label="Find a reviewer tool"
          />
          <span className="command-hint">tool / topic search</span>
        </div>

        {matches.length > 0 && (
          <div className="command-results">
            {matches.map((tool) => {
              const Icon = tool.icon;
              return (
                <button key={tool.href} onClick={() => setLocation(tool.href)}>
                  <span className="command-result-icon"><Icon size={16} /></span>
                  <span><strong>{tool.title}</strong><small>{tool.short}</small></span>
                  <ArrowRight size={15} />
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="workbench-section">
        <div className="section-heading-row">
          <div><div className="section-eyebrow">OCCUPATIONAL INTELLIGENCE</div><h2>Occupation and injury data</h2></div>
          <div className="section-note">job title → occupational context</div>
        </div>

        <div className="intelligence-grid">
          {intelligence.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <button key={tool.href} className={`intelligence-lane ${index === 0 ? "primary" : ""}`} onClick={() => setLocation(tool.href)}>
                <div className="lane-icon"><Icon size={21} /></div>
                <div className="lane-copy"><div className="lane-number">0{index + 1}</div><h3>{tool.title}</h3><p>{tool.short}</p></div>
                <ArrowRight className="lane-arrow" size={20} />
              </button>
            );
          })}
        </div>
      </section>

      <div className="workbench-columns">
        <section className="workbench-section compact-section">
          <div className="section-heading-row compact"><div><div className="section-eyebrow">REVIEW UTILITIES</div><h2>Clinical and operational tools</h2></div></div>
          <div className="tool-list">
            {reviewTools.map((tool) => {
              const Icon = tool.icon;
              return <button key={tool.href} className="tool-row" onClick={() => setLocation(tool.href)}><span className="tool-row-icon"><Icon size={16} /></span><span className="tool-row-copy"><strong>{tool.title}</strong><small>{tool.short}</small></span><ArrowRight size={14} /></button>;
            })}
          </div>
        </section>

        <section className="workbench-section compact-section">
          <div className="section-heading-row compact"><div><div className="section-eyebrow">EVIDENCE & KNOWLEDGE</div><h2>Sources and internal guidance</h2></div></div>
          <div className="tool-list">
            {evidenceTools.map((tool) => {
              const Icon = tool.icon;
              return <button key={tool.href} className="tool-row" onClick={() => setLocation(tool.href)}><span className="tool-row-icon"><Icon size={16} /></span><span className="tool-row-copy"><strong>{tool.title}</strong><small>{tool.short}</small></span><ArrowRight size={14} /></button>;
            })}
          </div>
          <div className="workbench-rule"><span>WORKFLOW</span><p>No case creation · no packet upload · no duplicated demographics · no required sequence</p></div>
        </section>
      </div>
    </div>
  );
}
