import React, { useEffect, useRef, useState } from "react";
import "../styles/tahoe-glass.css";

/**
 * Tahoe Glass Background Component
 * Renders floating orbs and cursor glow effect
 */
export const TahoeGlassBackground: React.FC = () => {
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Update cursor glow position
      if (cursorGlowRef.current) {
        cursorGlowRef.current.style.left = `${e.clientX}px`;
        cursorGlowRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Floating Orbs Background */}
      <div className="tahoe-background">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>

      {/* Cursor Glow Effect */}
      <div
        ref={cursorGlowRef}
        className="cursor-glow active"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
        }}
      ></div>
    </>
  );
};

export default TahoeGlassBackground;
