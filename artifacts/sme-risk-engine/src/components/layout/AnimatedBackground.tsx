export default function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Deep teal ambient — top-left */}
      <div className="absolute rounded-full"
        style={{
          width: "700px", height: "700px",
          background: "radial-gradient(circle, rgba(180,215,208,0.14) 0%, rgba(127,157,150,0.08) 40%, transparent 70%)",
          filter: "blur(80px)",
          top: "-200px", left: "-200px",
          animation: "orb-drift-1 28s ease-in-out infinite",
        }}
      />
      {/* Midnight navy — right */}
      <div className="absolute rounded-full"
        style={{
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(30,58,95,0.35) 0%, rgba(10,15,30,0.15) 50%, transparent 70%)",
          filter: "blur(90px)",
          top: "15%", right: "-150px",
          animation: "orb-drift-2 34s ease-in-out infinite",
        }}
      />
      {/* Warm sand — bottom */}
      <div className="absolute rounded-full"
        style={{
          width: "550px", height: "550px",
          background: "radial-gradient(circle, rgba(214,200,170,0.09) 0%, transparent 65%)",
          filter: "blur(70px)",
          bottom: "-80px", left: "20%",
          animation: "orb-drift-3 22s ease-in-out infinite",
        }}
      />
      {/* Subtle teal accent — center-right */}
      <div className="absolute rounded-full"
        style={{
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(127,157,150,0.10) 0%, transparent 65%)",
          filter: "blur(60px)",
          top: "50%", right: "18%",
          animation: "orb-drift-4 38s ease-in-out infinite",
        }}
      />
    </div>
  );
}
