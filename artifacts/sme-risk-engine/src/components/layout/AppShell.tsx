import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TahoeGlassBackground from "../TahoeGlassBackground";
import RouteInstrumentLayer from "../RouteInstrumentLayer";
import InstrumentAnchorAliases from "../InstrumentAnchorAliases";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="reviewer-app-shell">
      <TahoeGlassBackground />
      <Sidebar />

      <main className="reviewer-main-stage">
        <div className="reviewer-scroll-edge" aria-hidden="true" />
        <div className="reviewer-stage-content">{children}</div>
        <InstrumentAnchorAliases />
        <RouteInstrumentLayer />
      </main>
    </div>
  );
}
