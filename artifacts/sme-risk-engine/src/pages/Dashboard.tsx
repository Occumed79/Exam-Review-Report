import { useLocation } from "wouter";
import {
  BookOpen,
  Briefcase,
  Calculator,
  Database,
  FileSearch,
  Globe,
  Grid3x3,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const TOOL_GROUPS = [
  {
    label: "Review the case",
    description: "Fast tools for questions that come up while reading an exam packet.",
    tools: [
      {
        href: "/document-assistant",
        title: "Document Review Assistant",
        icon: FileSearch,
        question: "What useful facts are buried in this packet?",
        description: "Extract review facts, objective values, medications, duties, and documentation gaps from a PDF or image without creating a case or report.",
      },
      {
        href: "/drugs",
        title: "Drug Checker",
        icon: Pill,
        question: "Does this medication matter for the job?",
        description: "Normalize medications and quickly investigate drug class, interactions, and occupational relevance.",
      },
      {
        href: "/calculator",
        title: "Clinical Calculators",
        icon: Calculator,
        question: "Can I calculate this instead of eyeballing it?",
        description: "Run common clinical calculations independently using only the values you have in front of you.",
      },
      {
        href: "/guidelines",
        title: "Guideline Library",
        icon: BookOpen,
        question: "What guidance applies to this condition?",
        description: "Look up condition-specific review considerations and supporting sources without opening or saving a case.",
      },
    ],
  },
  {
    label: "Understand the job and environment",
    description: "Put the medical finding in the context that actually determines whether it matters.",
    tools: [
      {
        href: "/job-intelligence",
        title: "Job Intelligence",
        icon: Briefcase,
        question: "What does this job actually require?",
        description: "Look up physical, cognitive, safety-sensitive, and environmental demands using O*NET-oriented job intelligence.",
      },
      {
        href: "/matrix",
        title: "Standards Matrix",
        icon: Grid3x3,
        question: "Which review lenses should I compare?",
        description: "Compare common occupational review frameworks side-by-side as a reference matrix rather than a case clearance dashboard.",
      },
      {
        href: "/aor",
        title: "AOR / Deployment",
        icon: Globe,
        question: "Does the location change the risk?",
        description: "Review climate, medical access, disease, pharmacy, security, and evacuation context for deployment locations.",
      },
    ],
  },
  {
    label: "Verify and document your reasoning",
    description: "Find the source behind the conclusion instead of relying on a black-box score.",
    tools: [
      {
        href: "/citations",
        title: "Citation Finder",
        icon: Search,
        question: "What source supports this?",
        description: "Find and organize citations that support a reviewer decision or follow-up question.",
      },
      {
        href: "/sources",
        title: "Source Library",
        icon: Database,
        question: "Where did this rule or guidance come from?",
        description: "Maintain useful source links and reference material for repeated reviewer use.",
      },
      {
        href: "/guideline-editor",
        title: "Guideline Editor",
        icon: ShieldCheck,
        question: "Can we save our reviewed internal guidance?",
        description: "Build and maintain reviewer guidance entries independently from any individual examinee or case.",
      },
    ],
  },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto" }} data-testid="reviewer-tool-hub">
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ maxWidth: 790 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", color: "#b4d7d0", fontSize: "0.7rem", fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
            <Sparkles size={14} />
            Exam Reviewer Toolkit
          </div>
          <h1 style={{ margin: 0, fontSize: "2rem", lineHeight: 1.12, color: "#fff", fontWeight: 850, letterSpacing: "-0.03em" }}>
            Use the tool you need. Skip the ones you don’t.
          </h1>
          <p style={{ margin: "0.8rem 0 0", color: "rgba(255,255,255,0.5)", fontSize: "0.93rem", lineHeight: 1.65, maxWidth: 760 }}>
            This workspace is a collection of independent decision-support tools for exam reviewers. There is no required case sequence, no master risk score, and no report you have to build before another tool becomes useful.
          </p>
        </div>

        <div className="glass-card" style={{ padding: "0.9rem 1rem", minWidth: 250, maxWidth: 310 }}>
          <div style={{ fontSize: "0.67rem", fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "0.45rem" }}>
            Reviewer principle
          </div>
          <div style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "rgba(255,255,255,0.68)" }}>
            Each tool should answer one useful question using only the information that tool actually needs.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {TOOL_GROUPS.map((group) => (
          <section key={group.label}>
            <div style={{ marginBottom: "0.85rem" }}>
              <h2 style={{ margin: 0, color: "#f4efdc", fontSize: "1rem", fontWeight: 800 }}>{group.label}</h2>
              <p style={{ margin: "0.25rem 0 0", color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>{group.description}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(285px, 1fr))", gap: "0.9rem" }}>
              {group.tools.map(({ href, title, icon: Icon, question, description }) => (
                <button
                  key={href}
                  onClick={() => setLocation(href)}
                  className="glass-card"
                  style={{
                    textAlign: "left",
                    padding: "1.1rem",
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.032)",
                    color: "inherit",
                    minHeight: 190,
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid rgba(255,255,255,0.075)",
                  }}
                  data-testid={`tool-card-${href.replace(/\//g, "") || "home"}`}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(180,215,208,0.08)", border: "1px solid rgba(180,215,208,0.14)", marginBottom: "0.9rem" }}>
                    <Icon size={19} style={{ color: "#b4d7d0" }} />
                  </div>
                  <div style={{ color: "#fff", fontSize: "0.96rem", fontWeight: 800, marginBottom: "0.35rem" }}>{title}</div>
                  <div style={{ color: "#b4d7d0", fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.55rem" }}>{question}</div>
                  <div style={{ color: "rgba(255,255,255,0.46)", fontSize: "0.77rem", lineHeight: 1.55 }}>{description}</div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
