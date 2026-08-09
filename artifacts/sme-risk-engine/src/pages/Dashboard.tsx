import { useLocation } from "wouter";
import {
  Activity,
  BookOpen,
  Briefcase,
  Calculator,
  Database,
  Globe,
  Grid3x3,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const TOOL_GROUPS = [
  {
    label: "Answer the question in front of you",
    description: "Fast tools that ask for only the minimum fact needed to be useful.",
    tools: [
      {
        href: "/drugs",
        title: "Drug Checker",
        icon: Pill,
        question: "Does this medication matter for the job?",
        description: "Type a medication name and investigate drug class, interactions, and occupational relevance. No case record required.",
      },
      {
        href: "/calculator",
        title: "Clinical Calculators",
        icon: Calculator,
        question: "Can I calculate this instead of eyeballing it?",
        description: "Enter only the values needed for the calculation you are using. No packet transcription or duplicate case entry.",
      },
      {
        href: "/guidelines",
        title: "Guideline Library",
        icon: BookOpen,
        question: "What guidance applies to this condition?",
        description: "Search by condition or topic and jump straight to relevant review considerations and sources.",
      },
    ],
  },
  {
    label: "Understand the job and environment",
    description: "One small input should return a disproportionate amount of occupational context.",
    tools: [
      {
        href: "/injury-intelligence",
        title: "Injury Intelligence",
        icon: Activity,
        question: "What tends to go wrong in this job?",
        description: "Type a job title to surface injury patterns, prominent body regions, mechanisms, severe-injury context, and optional finding-to-job review questions.",
      },
      {
        href: "/job-intelligence",
        title: "Job Intelligence",
        icon: Briefcase,
        question: "What does this job actually require?",
        description: "Type a job title and look up physical, cognitive, safety-sensitive, and environmental demands.",
      },
      {
        href: "/matrix",
        title: "Standards Matrix",
        icon: Grid3x3,
        question: "Which review lenses should I compare?",
        description: "Compare common occupational review frameworks side-by-side without calculating a case score or clearance outcome.",
      },
      {
        href: "/aor",
        title: "AOR / Deployment",
        icon: Globe,
        question: "Does the location change the concern?",
        description: "Choose a country or location to review climate, medical access, disease, pharmacy, security, and evacuation context.",
      },
    ],
  },
  {
    label: "Verify your reasoning",
    description: "Find the source behind a decision without generating a report.",
    tools: [
      {
        href: "/citations",
        title: "Citation Finder",
        icon: Search,
        question: "What source supports this?",
        description: "Search for supporting references using the condition, standard, or question you are already reviewing.",
      },
      {
        href: "/sources",
        title: "Source Library",
        icon: Database,
        question: "Where did this rule or guidance come from?",
        description: "Keep reusable source links and references available to reviewers without attaching them to an examinee.",
      },
      {
        href: "/guideline-editor",
        title: "Guideline Editor",
        icon: ShieldCheck,
        question: "Can we save reviewed internal guidance?",
        description: "Maintain reusable reviewer guidance independently from any person's case or medical record.",
      },
    ],
  },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto" }} data-testid="reviewer-tool-hub">
      <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ maxWidth: 790 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", color: "#b4d7d0", fontSize: "0.7rem", fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
            <Sparkles size={14} />
            Exam Reviewer Toolkit
          </div>
          <h1 style={{ margin: 0, fontSize: "2rem", lineHeight: 1.12, color: "#fff", fontWeight: 850, letterSpacing: "-0.03em" }}>
            Use the tool you need. Enter almost nothing.
          </h1>
          <p style={{ margin: "0.8rem 0 0", color: "rgba(255,255,255,0.5)", fontSize: "0.93rem", lineHeight: 1.65, maxWidth: 760 }}>
            These are independent decision-support tools for reviewers working through a case in their normal system. There is no case setup, no required document upload, no master risk score, and no report workflow.
          </p>
        </div>

        <div className="glass-card" style={{ padding: "0.9rem 1rem", minWidth: 270, maxWidth: 330 }}>
          <div style={{ fontSize: "0.67rem", fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "0.45rem" }}>
            Hard rule
          </div>
          <div style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "rgba(255,255,255,0.68)" }}>
            If a reviewer has to re-enter the case to use a tool, the tool is designed wrong. Ask only for the smallest input needed to answer that one question.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {["No document upload", "No case creation", "No duplicated demographics", "No required tool order", "No report generation"].map((rule) => (
          <span key={rule} style={{ padding: "0.32rem 0.55rem", borderRadius: 6, background: "rgba(180,215,208,0.055)", border: "1px solid rgba(180,215,208,0.12)", color: "rgba(255,255,255,0.58)", fontSize: "0.7rem", fontWeight: 650 }}>
            {rule}
          </span>
        ))}
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
