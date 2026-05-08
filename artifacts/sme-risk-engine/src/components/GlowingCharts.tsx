import React from "react";

/**
 * Glowing Charts & Data Visualization Components
 * Luminous, animated charts with glassmorphism
 */

interface GlowingBarChartProps {
  data: Array<{ label: string; value: number; color?: "blue" | "green" | "warning" | "danger" }>;
  title?: string;
  maxValue?: number;
}

export const GlowingBarChart: React.FC<GlowingBarChartProps> = ({
  data,
  title,
  maxValue = 100,
}) => {
  const getColorClass = (color?: string) => {
    switch (color) {
      case "green":
        return "glow-bar-success";
      case "warning":
        return "glow-bar-warning";
      case "danger":
        return "glow-bar-danger";
      default:
        return "glow-bar";
    }
  };

  return (
    <div className="glass-container">
      {title && <h3 className="text-glow-blue" style={{ marginTop: 0 }}>{title}</h3>}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {data.map((item, index) => (
          <div key={index}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: "500" }}>{item.label}</span>
              <span className="text-glow-blue" style={{ fontSize: "14px", fontWeight: "600" }}>
                {item.value}%
              </span>
            </div>
            <div
              className={getColorClass(item.color)}
              style={{
                height: "24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(item.value / maxValue) * 100}%`,
                  background: "inherit",
                  borderRadius: "12px",
                  animation: `grow-up 0.8s ease-out forwards`,
                  animationDelay: `${index * 0.1}s`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface GlowingRadialProps {
  value: number;
  maxValue?: number;
  label?: string;
  color?: "blue" | "green" | "warning" | "danger";
}

export const GlowingRadial: React.FC<GlowingRadialProps> = ({
  value,
  maxValue = 100,
  label,
  color = "blue",
}) => {
  const percentage = (value / (maxValue || 100)) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    blue: { stroke: "rgba(0, 132, 255, 0.8)", glow: "rgba(0, 132, 255, 0.5)" },
    green: { stroke: "rgba(0, 208, 132, 0.8)", glow: "rgba(0, 208, 132, 0.5)" },
    warning: { stroke: "rgba(255, 165, 0, 0.8)", glow: "rgba(255, 165, 0, 0.5)" },
    danger: { stroke: "rgba(236, 72, 153, 0.8)", glow: "rgba(236, 72, 153, 0.5)" },
  };

  const colors = colorMap[color];

  return (
    <div className="glass-card" style={{ textAlign: "center", padding: "24px" }}>
      <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 16px" }}>
        <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
          {/* Background circle */}
          <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />

          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.8s ease-out",
              filter: `drop-shadow(0 0 10px ${colors.glow})`,
            }}
          />
        </svg>

        {/* Center text */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: "bold", color: colors.stroke }}>
            {Math.round(percentage)}%
          </div>
          {label && <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>{label}</div>}
        </div>
      </div>
    </div>
  );
};

interface GlowingMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: "blue" | "green" | "warning" | "danger";
}

export const GlowingMetric: React.FC<GlowingMetricProps> = ({
  label,
  value,
  unit,
  color = "blue",
}) => {
  const colorClass = {
    blue: "text-glow-blue",
    green: "text-glow-green",
    warning: "text-glow-purple",
    danger: "text-glow-purple",
  }[color];

  return (
    <div className="glass-card">
      <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "8px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <span className={colorClass} style={{ fontSize: "24px", fontWeight: "bold" }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: "14px", opacity: 0.7 }}>{unit}</span>}
      </div>
    </div>
  );
};

interface RiskScoreDisplayProps {
  score: number;
  title?: string;
}

export const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({
  score,
  title = "Overall Risk Score",
}) => {
  let color: "blue" | "green" | "warning" | "danger" = "blue";
  if (score < 30) color = "green";
  else if (score < 60) color = "warning";
  else color = "danger";

  return (
    <div className="glass-container-elevated" style={{ padding: "32px", textAlign: "center" }}>
      <h2 className="text-luminous" style={{ marginTop: 0 }}>
        {title}
      </h2>
      <div style={{ marginBottom: "24px" }}>
        <GlowingRadial value={score} maxValue={100} color={color} label="Risk Level" />
      </div>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <div className="glass-card">
          <div style={{ fontSize: "12px", opacity: 0.7 }}>Status</div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color:
                color === "green"
                  ? "var(--luminous-green)"
                  : color === "warning"
                    ? "var(--luminous-blue)"
                    : "var(--luminous-pink)",
            }}
          >
            {score < 30 ? "LOW RISK" : score < 60 ? "MODERATE RISK" : "HIGH RISK"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  GlowingBarChart,
  GlowingRadial,
  GlowingMetric,
  RiskScoreDisplay,
};
