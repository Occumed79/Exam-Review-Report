import type { CSSProperties } from "react";

export type InstrumentVariant =
  | "drug"
  | "calculator"
  | "condition"
  | "evidence"
  | "vault"
  | "job"
  | "injury"
  | "aor";

type InstrumentStageProps = {
  variant: InstrumentVariant;
  eyebrow: string;
  title: string;
  primary?: string;
  secondary?: string;
  result?: string;
  nodes?: string[];
  count?: number;
  status?: string;
  compact?: boolean;
};

const positions = [
  [50, 7],
  [76, 18],
  [91, 43],
  [83, 73],
  [57, 88],
  [28, 83],
  [8, 60],
  [12, 29],
  [34, 14],
  [69, 55],
  [44, 69],
  [28, 48],
];

function nodeStyle(index: number): CSSProperties {
  const [x, y] = positions[index % positions.length];
  return {
    "--node-x": `${x}%`,
    "--node-y": `${y}%`,
    "--node-delay": `${(index % 6) * -0.7}s`,
  } as CSSProperties;
}

function HoloPerson({ injury = false }: { injury?: boolean }) {
  return (
    <svg className="instrument-person" viewBox="0 0 180 330" aria-hidden="true">
      <defs>
        <linearGradient id={`person-glow-${injury ? "injury" : "job"}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c8f7ff" stopOpacity=".95" />
          <stop offset=".55" stopColor="#61d6ef" stopOpacity=".68" />
          <stop offset="1" stopColor="#7d91ff" stopOpacity=".42" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#person-glow-${injury ? "injury" : "job"})`} strokeWidth="2">
        <circle cx="90" cy="35" r="24" />
        <path d="M73 63 L107 63 L124 112 L112 176 L106 206 L128 302" />
        <path d="M107 63 L143 92 L157 169 L140 178 L126 116" />
        <path d="M73 63 L37 92 L23 169 L40 178 L54 116" />
        <path d="M73 63 L56 112 L68 176 L74 206 L52 302" />
        <path d="M68 176 L90 193 L112 176" />
        <path d="M74 206 L90 219 L106 206" />
        <path d="M90 59 L90 219" strokeDasharray="5 6" strokeOpacity=".55" />
        <path d="M58 112 L122 112" strokeDasharray="4 7" strokeOpacity=".38" />
      </g>
      {[{ x: 55, y: 112 }, { x: 125, y: 112 }, { x: 68, y: 205 }, { x: 112, y: 205 }, { x: 62, y: 260 }, { x: 118, y: 260 }].map((point, index) => (
        <g key={`${point.x}-${point.y}`} className={injury ? "instrument-hotspot injury" : "instrument-hotspot"} style={{ "--hotspot-delay": `${index * -0.55}s` } as CSSProperties}>
          <circle cx={point.x} cy={point.y} r="7" />
          <circle cx={point.x} cy={point.y} r="2" />
        </g>
      ))}
    </svg>
  );
}

function GlobeInstrument() {
  return (
    <div className="instrument-globe" aria-hidden="true">
      <div className="instrument-globe-core" />
      <div className="instrument-globe-ring r1" />
      <div className="instrument-globe-ring r2" />
      <div className="instrument-globe-ring r3" />
      <span className="instrument-beacon b1" />
      <span className="instrument-beacon b2" />
      <span className="instrument-beacon b3" />
      <span className="instrument-beacon b4" />
    </div>
  );
}

function CalculatorInstrument({ result, title }: { result?: string; title: string }) {
  const isThermal = /heat|wind/i.test(title);
  const isCardiac = /heart|QT|MAP/i.test(title);
  return (
    <div className={`instrument-calculator-visual${isThermal ? " thermal" : ""}${isCardiac ? " cardiac" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 600 180" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#72dce9" stopOpacity=".1" />
            <stop offset=".45" stopColor="#c8f7ff" stopOpacity="1" />
            <stop offset="1" stopColor="#83a8ff" stopOpacity=".15" />
          </linearGradient>
        </defs>
        <path className="instrument-wave instrument-wave-ghost" d="M0 92 C40 90 52 90 68 92 L93 92 L105 52 L116 132 L126 18 L139 122 L149 92 L202 92 C236 92 246 88 260 92 L286 92 L297 61 L307 120 L319 24 L331 116 L343 92 L398 92 C430 92 444 87 457 92 L480 92 L492 58 L503 126 L516 28 L528 115 L540 92 L600 92" />
        <path className="instrument-wave" d="M0 92 C40 90 52 90 68 92 L93 92 L105 52 L116 132 L126 18 L139 122 L149 92 L202 92 C236 92 246 88 260 92 L286 92 L297 61 L307 120 L319 24 L331 116 L343 92 L398 92 C430 92 444 87 457 92 L480 92 L492 58 L503 126 L516 28 L528 115 L540 92 L600 92" />
      </svg>
      <div className="instrument-calculator-reticle"><i /><i /><i /></div>
      {result && <div className="instrument-floating-result">{result}</div>}
    </div>
  );
}

export default function InstrumentStage({
  variant,
  eyebrow,
  title,
  primary,
  secondary,
  result,
  nodes = [],
  count,
  status,
  compact = false,
}: InstrumentStageProps) {
  const trimmedNodes = nodes.filter(Boolean).slice(0, 12);
  return (
    <section className={`instrument-stage instrument-${variant}${compact ? " compact" : ""}`} aria-label={`${title} interactive visualization`}>
      <div className="instrument-grid" aria-hidden="true" />
      <div className="instrument-scan" aria-hidden="true" />
      <div className="instrument-noise" aria-hidden="true" />

      <div className="instrument-copy">
        <span className="instrument-eyebrow">{eyebrow}</span>
        <strong>{title}</strong>
        {primary && <p>{primary}</p>}
        <div className="instrument-meta">
          {status && <span><i className="instrument-status-dot" />{status}</span>}
          {typeof count === "number" && <span>{count} active signal{count === 1 ? "" : "s"}</span>}
          {secondary && <span>{secondary}</span>}
        </div>
      </div>

      <div className="instrument-visual">
        {variant === "calculator" && <CalculatorInstrument result={result} title={title} />}

        {variant === "job" && (
          <div className="instrument-person-shell">
            <div className="instrument-person-halo" />
            <HoloPerson />
          </div>
        )}

        {variant === "injury" && (
          <div className="instrument-person-shell">
            <div className="instrument-person-halo injury" />
            <HoloPerson injury />
          </div>
        )}

        {variant === "aor" && <GlobeInstrument />}

        {(variant === "drug" || variant === "condition" || variant === "evidence" || variant === "vault") && (
          <div className={`instrument-core-shell ${variant}`}>
            <div className="instrument-core-orbit orbit-a" />
            <div className="instrument-core-orbit orbit-b" />
            <div className="instrument-core-orbit orbit-c" />
            <div className="instrument-core">
              <span>{variant === "drug" ? "Rx" : variant === "condition" ? "Dx" : variant === "evidence" ? "Σ" : "V"}</span>
            </div>
          </div>
        )}

        {variant !== "calculator" && trimmedNodes.map((node, index) => (
          <div className={`instrument-node node-${variant}`} key={`${node}-${index}`} style={nodeStyle(index)}>
            <i />
            <span>{node}</span>
          </div>
        ))}
      </div>

      <div className="instrument-corner tl" aria-hidden="true" />
      <div className="instrument-corner tr" aria-hidden="true" />
      <div className="instrument-corner bl" aria-hidden="true" />
      <div className="instrument-corner br" aria-hidden="true" />
    </section>
  );
}
