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
    short: "Occupation injury patterns, body regions, mechanisms, and finding-to-job context.",
    icon: Activity,
    keywords: "injury history occupation body part mechanism prevalence job finding shoulder back knee",
    tier: "intelligence",
  },
  {
    href: "/job-intelligence",
    title: "Job Intelligence",
    short: "Physical, cognitive, safety-sensitive, and environmental job demands.",
    icon: Briefcase,
    keywords: "job occupation onet duties essential functions physical cognitive safety demand",
    tier: "intelligence",
  },
  {
    href: "/drugs",
    title: "Drug Checker",
    short: "Medication class, interactions, and occupational relevance.",
    icon: Pill,
    keywords: "drug medication rx sedating interactions pharmacy occupational",
    tier: "review",
  },
  {
    href: "/calculator",
    title: "Clinical Calculators",
    short: "Run focused calculations using only the values required.",
    icon: Calculator,
    keywords: "calculator bmi blood pressure cardiac clinical value",
    tier: "review",
  },
  {
    href: "/guidelines",
    title: "Guideline Library",
    short: "Condition-focused reviewer guidance and supporting sources.",
    icon: BookOpen,
    keywords: "guideline condition medical guidance standard rule",
    tier: "review",
  },
  {
    href: "/matrix",
    title: "Standards Matrix",
    short: "Compare occupational review frameworks without declaring clearance.",
    icon: Grid3x3,
    keywords: "standard matrix nfpa dot faa deployment compare",
    tier: "review",
  },
  {
    href: "/aor",
    title: "AOR / Deployment",
    short: "Country, climate, medical access, pharmacy, security, and evacuation context.",
    icon: Globe,
    keywords: "country deployment aor travel climate disease pharmacy evacuation medical access",
    tier: "review",
  },
  {
    href: "/citations",
    title: "Citation Finder",
    short: "Find support for the review question you are already working through.",
    icon: BookMarked,
    keywords: "citation evidence source literature research support",
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
    short: "Maintain reviewed internal guidance independent of any examinee.",
    icon: ShieldCheck,
    keywords: "editor internal guideline save guidance",
    tier: "evidence",
  },
];

type IntelligenceStatus = {
  onet?: { configured?: boolean };
  bls?: { configured?: boolean; authMode?: string };
  osha?: { importEnabled?: boolean; dataDirConfigured?: boolean };
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
        if (!cancelled && data) setStatus(data as IntelligenceStatus);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
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
          <h1>Decision support without the data-entry tax.</h1>
          <p>
            Start with the question in front of you. The toolkit supplies occupational, clinical,
            deployment, and evidence context without creating a second case record.
          </p>
        </div>

        <div className="source-status" aria-label="Connected intelligence sources">
          <div className="source-status-label">SOURCE STATUS</div>
          <div className="source-status-items">
            <span><StatusDot active={Boolean(status?.onet?.configured)} /> O*NET</span>
            <span><StatusDot active={Boolean(status?.bls?.configured)} /> BLS</span>
            <span><StatusDot active={Boolean(status?.osha?.importEnabled || status?.osha?.dataDirConfigured)} /> OSHA</span>
          </div>
        </div>
      </header>

      <section className="command-panel">
        <div className="command-label">FIND A TOOL</div>
        <div className="command-input-wrap">
          <Search size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches.length === 1) setLocation(matches[0].href);
            }}
            placeholder="Try: medication, firefighter, deployment, blood pressure, citation…"
            aria-label="Find a reviewer tool"
          />
          <span className="command-hint">search by the question you have</span>
        </div>

        {matches.length > 0 && (
          <div className="command-results">
            {matches.map((tool) => {
              const Icon = tool.icon;
              return (
                <button key={tool.href} onClick={() => setLocation(tool.href)}>
                  <span className="command-result-icon"><Icon size={16} /></span>
                  <span>
                    <strong>{tool.title}</strong>
                    <small>{tool.short}</small>
                  </span>
                  <ArrowRight size={15} />
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="workbench-section">
        <div className="section-heading-row">
          <div>
            <div className="section-eyebrow">PRIMARY INTELLIGENCE</div>
            <h2>Understand the work before judging the finding.</h2>
          </div>
          <div className="section-note">1 input → occupational context</div>
        </div>

        <div className="intelligence-grid">
          {intelligence.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.href}
                className={`intelligence-lane ${index === 0 ? "primary" : ""}`}
                onClick={() => setLocation(tool.href)}
              >
                <div className="lane-icon"><Icon size={21} /></div>
                <div className="lane-copy">
                  <div className="lane-number">0{index + 1}</div>
                  <h3>{tool.title}</h3>
                  <p>{tool.short}</p>
                </div>
                <ArrowRight className="lane-arrow" size={20} />
              </button>
            );
          })}
        </div>
      </section>

      <div className="workbench-columns">
        <section className="workbench-section compact-section">
          <div className="section-heading-row compact">
            <div>
              <div className="section-eyebrow">REVIEW UTILITIES</div>
              <h2>Answer the immediate question.</h2>
            </div>
          </div>

          <div className="tool-list">
            {reviewTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button key={tool.href} className="tool-row" onClick={() => setLocation(tool.href)}>
                  <span className="tool-row-icon"><Icon size={16} /></span>
                  <span className="tool-row-copy">
                    <strong>{tool.title}</strong>
                    <small>{tool.short}</small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              );
            })}
          </div>
        </section>

        <section className="workbench-section compact-section">
          <div className="section-heading-row compact">
            <div>
              <div className="section-eyebrow">EVIDENCE & KNOWLEDGE</div>
              <h2>Verify what supports the reasoning.</h2>
            </div>
          </div>

          <div className="tool-list">
            {evidenceTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button key={tool.href} className="tool-row" onClick={() => setLocation(tool.href)}>
                  <span className="tool-row-icon"><Icon size={16} /></span>
                  <span className="tool-row-copy">
                    <strong>{tool.title}</strong>
                    <small>{tool.short}</small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              );
            })}
          </div>

          <div className="workbench-rule">
            <span>PRODUCT RULE</span>
            <p>No case creation. No packet upload. No duplicated demographics. No required sequence.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
