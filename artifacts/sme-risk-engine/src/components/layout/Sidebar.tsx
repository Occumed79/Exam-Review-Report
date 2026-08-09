import { Link, useLocation } from "wouter";
import {
  Activity,
  BookMarked,
  BookOpen,
  Briefcase,
  Calculator,
  Database,
  Globe,
  Grid3x3,
  LayoutDashboard,
  Pill,
  Settings,
  ShieldCheck,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Activity;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Intelligence",
    items: [
      { href: "/injury-intelligence", label: "Injury Intelligence", icon: Activity },
      { href: "/job-intelligence", label: "Job Intelligence", icon: Briefcase },
    ],
  },
  {
    label: "Review",
    items: [
      { href: "/drugs", label: "Drug Checker", icon: Pill },
      { href: "/calculator", label: "Clinical Calculators", icon: Calculator },
      { href: "/guidelines", label: "Condition Reference", icon: BookOpen },
      { href: "/matrix", label: "Standards Matrix", icon: Grid3x3 },
      { href: "/aor", label: "AOR / Deployment", icon: Globe },
    ],
  },
  {
    label: "Evidence",
    items: [
      { href: "/citations", label: "Citation Finder", icon: BookMarked },
      { href: "/sources", label: "Source Library", icon: Database },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/guideline-editor", label: "Guideline Editor", icon: ShieldCheck },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="reviewer-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">ER</div>
        <div>
          <div className="sidebar-brand-title">EXAM REVIEWER</div>
          <div className="sidebar-brand-subtitle">Decision Workbench</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link href="/" className={`sidebar-home${location === "/" ? " active" : ""}`}>
          <LayoutDashboard size={16} />
          <span>Workbench</span>
        </Link>

        {NAV_GROUPS.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <div className="sidebar-group-label">{group.label}</div>
            {group.items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-item${location === href ? " active" : ""}`}
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-rule">MINIMUM INPUT</div>
        <div>Use only the fact needed for the question.</div>
      </div>
    </aside>
  );
}
