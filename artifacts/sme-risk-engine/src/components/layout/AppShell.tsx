import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { IntelligenceSidebar } from "../IntelligenceSidebar";
import AnimatedBackground from "./AnimatedBackground";
import { SMECase } from "@/lib/types";

interface AppShellProps {
  children: ReactNode;
  cases: SMECase[];
  activeCase?: SMECase;
}

export default function AppShell({ children, cases, activeCase }: AppShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--app-bg)",
        color: "var(--app-fg)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <AnimatedBackground />

      <div style={{ display: "flex", position: "relative", zIndex: 1 }}>
        <Sidebar cases={cases} />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "2rem",
            marginLeft: "240px",
            marginRight: "320px", // Space for IntelligenceSidebar
            maxWidth: "calc(100vw - 560px)",
            height: "100vh",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>

        <IntelligenceSidebar activeCase={activeCase} />
      </div>
    </div>
  );
}
