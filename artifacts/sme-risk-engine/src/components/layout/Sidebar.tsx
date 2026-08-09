import { Link, useLocation } from "wouter";
import {
  LayoutGrid, BookOpen, Database, Settings, Globe, Grid3x3, Pill,
  Calculator, BookMarked, Briefcase, FileSearch, ShieldCheck
} from "lucide-react";

const NAV_MAIN = [
  { href: "/", label: "Reviewer Tools", icon: LayoutGrid },
  { href: "/job-intelligence", label: "Job Intelligence", icon: Briefcase },
  { href: "/guidelines", label: "Guideline Library", icon: BookOpen },
  { href: "/matrix", label: "Clearance Matrix", icon: Grid3x3 },
  { href: "/drugs", label: "Drug Checker", icon: Pill },
  { href: "/calculator", label: "Clinical Calculators", icon: Calculator },
  { href: "/aor", label: "AOR / Deployment", icon: Globe },
  { href: "/citations", label: "Citation Finder", icon: BookMarked },
  { href: "/sources", label: "Source Library", icon: Database },
  { href: "/guideline-editor", label: "Guideline Editor", icon: FileSearch },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside
      style={{
        width: "248px",
        minWidth: "248px",
        background: "rgba(10,15,30,0.78)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ padding: "1.25rem 1rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              background: "linear-gradient(135deg, #b4d7d0, #7f9d96)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={19} style={{ color: "#0a0f1e" }} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#f4efdc", letterSpacing: "0.045em", lineHeight: 1.2 }}>
              EXAM REVIEWER
            </div>
            <div style={{ fontSize: "0.69rem", color: "rgba(255,255,255,0.46)", fontWeight: 500 }}>
              Decision-support toolkit
            </div>
          </div>
        </div>
      </div>

      <nav style={{ padding: "0.85rem 0.625rem", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", padding: "0 0.5rem", marginBottom: "0.5rem" }}>
          Independent Tools
        </div>
        {NAV_MAIN.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item${location === href ? " active" : ""}`}
            data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div style={{ padding: "0.8rem 1rem", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "0.65rem", color: "rgba(255,255,255,0.28)", lineHeight: 1.5 }}>
        <div>Use any tool in any order.</div>
        <div>No report workflow required.</div>
      </div>
    </aside>
  );
}
