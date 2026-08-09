import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import AnimatedBackground from "./AnimatedBackground";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--app-bg)",
        color: "var(--app-fg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AnimatedBackground />
      <Sidebar />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          marginLeft: "248px",
          width: "calc(100vw - 248px)",
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "2rem 2.25rem 3rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}
