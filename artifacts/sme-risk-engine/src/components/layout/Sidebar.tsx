import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, BookOpen, Database, Settings, ChevronRight,
  Shield, FileText, Globe, Grid3x3, Pill,
  Calculator, BookMarked
} from "lucide-react";
import { SMECase } from "@/lib/types";

interface SidebarProps {
  cases: SMECase[];
}

const NAV_MAIN = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/aor", label: "AOR Monitor", icon: Globe },
  { href: "/matrix", label: "Clearance Matrix", icon: Grid3x3 },
  { href: "/drugs", label: "Drug Checker", icon: Pill },
  { href: "/calculator", label: "Clinical Calculators", icon: Calculator },
  { href: "/citations", label: "Citations", icon: BookMarked },
  { href: "/guidelines", label: "Guideline Library", icon: BookOpen },
  { href: "/sources", label: "Source Library", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ cases }: SidebarProps) {
  const [location] = useLocation();
  const recentCases = cases.slice(-5).reverse();

  return (
    <aside
      style={{
        width: "240px",
        minWidth: "240px",
        background: "rgba(10,15,30,0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "1.25rem 1rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #b4d7d0, #7f9d96)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 14px rgba(180,215,208,0.28)",
            }}
          >
            <Shield size={18} style={{ color: "#0a0f1e" }} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f4efdc", letterSpacing: "0.03em", lineHeight: 1.2 }}>
              SME RISK
            </div>
            <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.45)", fontWeight: 500, letterSpacing: "0.02em" }}>
              Intelligence Engine
            </div>
          </div>
        </div>
      </div>

      <nav style={{ padding: "0.75rem 0.625rem", flex: 1, overflowY: "auto" }}>
        <div style={{ marginBottom: "0.25rem" }}>
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
        </div>

        {recentCases.length > 0 && (
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", padding: "0 0.5rem", marginBottom: "0.5rem" }}>
              Recent Cases
            </div>
            {recentCases.map((c) => {
              const isActive = location.startsWith(`/case/${c.id}`);
              return (
                <Link
                  key={c.id}
                  href={`/case/${c.id}`}
                  className={`nav-item${isActive ? " active" : ""}`}
                  data-testid={`nav-case-${c.id}`}
                  style={{ paddingLeft: "0.5rem" }}
                >
                  <FileText size={13} style={{ flexShrink: 0, opacity: 0.7, color: "#b4d7d0" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.caseId}</div>
                    <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.examineeName} · {c.jobTitle}
                    </div>
                  </div>
                  <ChevronRight size={12} style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.4 }} />
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "0.625rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
        <div>v1.0 · For internal SME use</div>
        <div>Reference workspace</div>
      </div>
    </aside>
  );
}
