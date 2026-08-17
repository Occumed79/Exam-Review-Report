import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="reviewer-app-shell">
      <Sidebar />

      <main className="reviewer-main-stage">
        <header className="reviewer-topbar" aria-label="Exam Reviewer workspace">
          <div className="reviewer-topbar-copy">
            <span className="reviewer-topbar-eyebrow">OCCU-MED</span>
            <strong>Clinical Review Workspace</strong>
          </div>
          <div className="reviewer-topbar-context">
            <span className="reviewer-topbar-dot" aria-hidden="true" />
            Evidence-guided occupational health review
          </div>
        </header>

        <div className="reviewer-stage-content">{children}</div>
      </main>
    </div>
  );
}
