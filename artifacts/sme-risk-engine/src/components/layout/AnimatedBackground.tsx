export default function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <div
        className="orb-1 absolute rounded-full blur-3xl opacity-22"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, #b4d7d0 0%, transparent 70%)",
          top: "-100px",
          left: "-150px",
        }}
      />
      <div
        className="orb-2 absolute rounded-full blur-3xl opacity-16"
        style={{
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, #f4efdc 0%, transparent 70%)",
          top: "30%",
          right: "-100px",
        }}
      />
      <div
        className="orb-3 absolute rounded-full blur-3xl opacity-14"
        style={{
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, #a7c7be 0%, transparent 70%)",
          bottom: "10%",
          left: "20%",
        }}
      />
      <div
        className="orb-4 absolute rounded-full blur-3xl opacity-12"
        style={{
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, #d6c8aa 0%, transparent 70%)",
          top: "60%",
          right: "25%",
        }}
      />
      <div
        className="orb-5 absolute rounded-full blur-3xl opacity-12"
        style={{
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, #7f9d96 0%, transparent 70%)",
          bottom: "-80px",
          right: "-80px",
        }}
      />
    </div>
  );
}
