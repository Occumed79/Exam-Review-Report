import React, { useEffect } from "react";

const LIQUID_SURFACE_SELECTOR = [
  ".liquid-glass",
  ".glow-btn",
  ".command-panel",
  ".source-status",
  ".injury-source-stack",
  ".injury-search-panel",
  ".job-source-status",
  ".job-tabs",
  ".job-search-panel",
  ".drug-status",
  ".drug-search-panel",
  ".clinical-nav",
  ".condition-search",
  ".standards-search",
  ".deployment-search",
  ".citation-search-panel",
  ".hologram-view-toggle",
  ".liquid-toolbar",
].join(",");

/**
 * Graphite environment plus a restrained light model for functional glass.
 * Pointer position is localized to the active control so highlights read as
 * material feedback instead of a full-screen cursor effect.
 */
export const TahoeGlassBackground: React.FC = () => {
  useEffect(() => {
    const root = document.documentElement;
    let animationFrame = 0;

    const handlePointerMove = (event: PointerEvent) => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        root.style.setProperty("--pointer-x", `${(event.clientX / window.innerWidth) * 100}%`);
        root.style.setProperty("--pointer-y", `${(event.clientY / window.innerHeight) * 100}%`);

        const element = event.target instanceof Element
          ? event.target.closest<HTMLElement>(LIQUID_SURFACE_SELECTOR)
          : null;
        if (!element) return;

        const bounds = element.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
        const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
        element.style.setProperty("--glass-light-x", `${x}%`);
        element.style.setProperty("--glass-light-y", `${y}%`);
      });
    };

    const setWindowActive = (active: boolean) => root.classList.toggle("window-inactive", !active);
    const handleFocus = () => setWindowActive(true);
    const handleBlur = () => setWindowActive(false);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return <div className="tahoe-environment" aria-hidden="true" />;
};

export default TahoeGlassBackground;
