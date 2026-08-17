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
  Radar,
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
      { href: "/external-factors", label: "External Factors", icon: Globe },
      { href: "/aor", label: "AOR Intelligence", icon: Radar },
    ],
  },
  {
    label: "Clinical Review",
    items: [
      { href: "/drugs", label: "Drug Checker", icon: Pill },
      { href: "/calculator", label: "Clinical Calculators", icon: Calculator },
      { href: "/guidelines", label: "Condition Reference", icon: BookOpen },
      { href: "/matrix", label: "Standards Matrix", icon: Grid3x3 },
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
    label: "Administration",
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
        <div className="sidebar-brand-mark" aria-hidden="true">OM</div>
        <div className="sidebar-brand-copy">
          <div className="sidebar-brand-overline">OCCU-MED</div>
          <div className="sidebar-brand-title">Exam Reviewer</div>
          <div className="sidebar-brand-subtitle">Occupational health intelligence</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Exam Reviewer tools">
        {NAV_GROUPS.map((group) => (
          <section className="sidebar-group" key={group.label} aria-label={group.label}>
            <div className="sidebar-group-label">{group.label}</div>
            <div className="sidebar-group-items">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = location === href || (href === "/injury-intelligence" && location === "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`nav-item${active ? " active" : ""}`}
                    data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="nav-item-icon" aria-hidden="true"><Icon size={17} /></span>
                    <span className="nav-item-label">{label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>Reviewer workspace</span>
        <small>Decision support · not autonomous clearance</small>
      </div>
    </aside>
  );
}
