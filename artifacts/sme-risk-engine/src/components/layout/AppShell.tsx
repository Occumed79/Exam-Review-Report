import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import AnimatedBackground from "./AnimatedBackground";
import { SMECase } from "@/lib/types";

interface AppShellProps {
  children: ReactNode;
  cases: SMECase[];
}

export default function AppShell({ children, cases }: AppShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--app-bg)",
        color: "var(--app-fg)",
        position: "relative",
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
            maxWidth: "calc(100vw - 240px)",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
