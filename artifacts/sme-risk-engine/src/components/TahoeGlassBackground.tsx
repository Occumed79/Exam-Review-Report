import React, { useEffect, useRef } from "react";
import "../styles/tahoe-glass.css";

/**
 * Full-screen luminous environment for the reviewer workstation.
 * Keeps all effects decorative/pointer-transparent while exposing the mouse
 * position to CSS for refractive highlight movement.
 */
export const TahoeGlassBackground: React.FC = () => {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const x = `${event.clientX}px`;
      const y = `${event.clientY}px`;
      document.documentElement.style.setProperty("--glass-pointer-x", x);
      document.documentElement.style.setProperty("--glass-pointer-y", y);
      if (fieldRef.current) {
        fieldRef.current.style.setProperty("--local-pointer-x", x);
        fieldRef.current.style.setProperty("--local-pointer-y", y);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div ref={fieldRef} className="tahoe-light-field" aria-hidden="true">
      <div className="tahoe-aurora tahoe-aurora-a" />
      <div className="tahoe-aurora tahoe-aurora-b" />
      <div className="tahoe-aurora tahoe-aurora-c" />
      <div className="tahoe-caustic tahoe-caustic-a" />
      <div className="tahoe-caustic tahoe-caustic-b" />
      <div className="tahoe-prism-orb tahoe-prism-orb-a" />
      <div className="tahoe-prism-orb tahoe-prism-orb-b" />
      <div className="tahoe-prism-orb tahoe-prism-orb-c" />
      <div className="tahoe-pointer-light" />
      <div className="tahoe-vignette" />
      <div className="tahoe-grain" />
    </div>
  );
};

export default TahoeGlassBackground;
