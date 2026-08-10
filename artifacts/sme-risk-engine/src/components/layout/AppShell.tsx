import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--app-bg)",
        color: "var(--app-fg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Sidebar />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          marginLeft: "220px",
          width: "calc(100vw - 220px)",
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "2rem 2.5rem 3rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}
