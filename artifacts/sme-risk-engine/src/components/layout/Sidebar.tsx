import { Link, useLocation } from "wouter";
import {
  Activity,
  Briefcase,
  Calculator,
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
      { href: "/injuries-medical-conditions", label: "Injuries & Medical Conditions", icon: Activity },
      { href: "/job-intelligence", label: "Job Intelligence", icon: Briefcase },
      { href: "/aor-factors", label: "AOR Factors", icon: Radar },
    ],
  },
  {
    label: "Clinical Review",
    items: [
      { href: "/drugs", label: "Drug Checker", icon: Pill },
      { href: "/calculator", label: "Clinical Calculators", icon: Calculator },
      { href: "/matrix", label: "Standards Intelligence", icon: Grid3x3 },
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

function isActive(location: string, href: string) {
  if (location === href) return true;
  if (href === "/injuries-medical-conditions") {
    return ["/", "/injury-intelligence", "/guidelines"].includes(location);
  }
  if (href === "/aor-factors") {
    return ["/aor", "/external-factors"].includes(location);
  }
  return false;
}

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
                const active = isActive(location, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`nav-item${active ? " active" : ""}`}
                    data-testid={`nav-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
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