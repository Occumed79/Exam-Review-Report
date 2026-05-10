export default function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <div
        className="orb-1 absolute rounded-full blur-[120px] opacity-40"
        style={{
          width: "800px",
          height: "800px",
          background: "radial-gradient(circle, #00d4ff 0%, #0055ff 50%, transparent 100%)",
          top: "-200px",
          left: "-200px",
        }}
      />
      <div
        className="orb-2 absolute rounded-full blur-[100px] opacity-30"
        style={{
          width: "700px",
          height: "700px",
          background: "radial-gradient(circle, #ff00d4 0%, #ff0055 50%, transparent 100%)",
          top: "20%",
          right: "-150px",
        }}
      />
      <div
        className="orb-3 absolute rounded-full blur-[110px] opacity-25"
        style={{
          width: "650px",
          height: "650px",
          background: "radial-gradient(circle, #00ffaa 0%, #00aa55 50%, transparent 100%)",
          bottom: "5%",
          left: "15%",
        }}
      />
      <div
        className="orb-4 absolute rounded-full blur-[90px] opacity-20"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, #ffaa00 0%, #ff5500 50%, transparent 100%)",
          top: "50%",
          right: "20%",
        }}
      />
      <div
        className="orb-5 absolute rounded-full blur-[80px] opacity-20"
        style={{
          width: "550px",
          height: "550px",
          background: "radial-gradient(circle, #7700ff 0%, #4400ff 50%, transparent 100%)",
          bottom: "-100px",
          right: "-100px",
        }}
      />
    </div>
  );
}
