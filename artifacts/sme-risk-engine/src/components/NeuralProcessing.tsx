import React, { useEffect, useState } from "react";

/**
 * Neural Processing Visualization Component
 * Shows the machine "thinking" with animated dots and waves
 */

interface NeuralProcessingProps {
  isProcessing: boolean;
  stage?: "analyzing" | "deliberating" | "finalizing";
  progress?: number;
}

export const NeuralProcessing: React.FC<NeuralProcessingProps> = ({
  isProcessing,
  stage = "analyzing",
  progress = 0,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setDisplayProgress((prev) => {
          const next = prev + Math.random() * 15;
          return next > 100 ? 100 : next;
        });
      }, 300);

      return () => clearInterval(interval);
    } else {
      setDisplayProgress(0);
    }
  }, [isProcessing]);

  const stageMessages = {
    analyzing: "Analyzing medical conditions and occupational factors...",
    deliberating: "Three-judge panel deliberating...",
    finalizing: "Finalizing risk assessment...",
  };

  return (
    <div className="glass-container-elevated" style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
        <div className="neural-processor">
          <div className="neural-dot"></div>
          <div className="neural-dot"></div>
          <div className="neural-dot"></div>
        </div>
        <div>
          <h3 className="text-glow-blue" style={{ margin: "0 0 4px 0" }}>
            Neural Processing Engine
          </h3>
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.7 }}>
            {stageMessages[stage]}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "16px" }}>
        <div
          className="glow-bar"
          style={{
            height: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${displayProgress}%`,
              background: "linear-gradient(90deg, rgba(0, 208, 132, 0.6), rgba(0, 132, 255, 0.6))",
              borderRadius: "4px",
              transition: "width 0.3s ease-out",
              boxShadow: "0 0 15px rgba(0, 208, 132, 0.5)",
            }}
          ></div>
        </div>
        <p style={{ fontSize: "12px", marginTop: "8px", opacity: 0.6 }}>
          {Math.round(displayProgress)}% Complete
        </p>
      </div>

      {/* Neural Wave Visualization */}
      <NeuralWave />
    </div>
  );
};

/**
 * Neural Wave SVG Animation
 */
const NeuralWave: React.FC = () => {
  return (
    <div className="neural-wave">
      <svg viewBox="0 0 400 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 132, 255, 0.8)" />
            <stop offset="100%" stopColor="rgba(0, 132, 255, 0.2)" />
          </linearGradient>
        </defs>
        <path
          d="M 0,30 Q 50,10 100,30 T 200,30 T 300,30 T 400,30 L 400,60 L 0,60 Z"
          fill="url(#waveGradient)"
          style={{
            animation: "wave 3s linear infinite",
          }}
        />
        <style>{`
          @keyframes wave {
            0% {
              d: path('M 0,30 Q 50,10 100,30 T 200,30 T 300,30 T 400,30 L 400,60 L 0,60 Z');
            }
            25% {
              d: path('M 0,25 Q 50,15 100,25 T 200,25 T 300,25 T 400,25 L 400,60 L 0,60 Z');
            }
            50% {
              d: path('M 0,30 Q 50,50 100,30 T 200,30 T 300,30 T 400,30 L 400,60 L 0,60 Z');
            }
            75% {
              d: path('M 0,35 Q 50,45 100,35 T 200,35 T 300,35 T 400,35 L 400,60 L 0,60 Z');
            }
            100% {
              d: path('M 0,30 Q 50,10 100,30 T 200,30 T 300,30 T 400,30 L 400,60 L 0,60 Z');
            }
          }
        `}</style>
      </svg>
    </div>
  );
};

export default NeuralProcessing;
