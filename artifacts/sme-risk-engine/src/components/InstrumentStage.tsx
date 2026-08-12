import type { CSSProperties, PointerEvent } from "react";

export type InstrumentVariant =
  | "drug"
  | "calculator"
  | "condition"
  | "evidence"
  | "vault"
  | "job"
  | "injury"
  | "aor"
  | "environment"
  | "standards"
  | "guidance";

type InstrumentStageProps = {
  variant: InstrumentVariant;
  eyebrow: string;
  title: string;
  primary?: string;
  secondary?: string;
  result?: string;
  nodes?: string[];
  count?: number;
  countLabel?: string;
  status?: string;
  compact?: boolean;
};

const nodePositions = [
  [50, 8],
  [78, 18],
  [91, 42],
  [82, 75],
  [56, 89],
  [27, 82],
  [8, 61],
  [12, 29],
  [34, 15],
  [71, 55],
  [43, 70],
  [28, 48],
];

const constellation = [
  [10, 18], [18, 63], [27, 33], [35, 76], [43, 20], [50, 52], [57, 82],
  [64, 28], [71, 63], [78, 14], [84, 46], [91, 72], [95, 30], [39, 48],
];

function nodeStyle(index: number): CSSProperties {
  const [x, y] = nodePositions[index % nodePositions.length];
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
          <stop offset="0" stopColor="#dcfbff" stopOpacity="1" />
          <stop offset=".55" stopColor="#65dff1" stopOpacity=".78" />
          <stop offset="1" stopColor="#7d91ff" stopOpacity=".46" />
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

function DrugInstrument() {
  return (
    <div className="drug-reactor" aria-hidden="true">
      <div className="drug-spectrum" />
      <div className="drug-orbit orbit-one"><i /><i /></div>
      <div className="drug-orbit orbit-two"><i /><i /></div>
      <div className="drug-orbit orbit-three"><i /></div>
      <div className="drug-capsule"><span>Rx</span><b /></div>
      <div className="drug-pulse p1" />
      <div className="drug-pulse p2" />
      <div className="drug-pulse p3" />
    </div>
  );
}

function ConditionInstrument() {
  return (
    <div className="condition-network-shell" aria-hidden="true">
      <svg className="condition-network" viewBox="0 0 520 210" preserveAspectRatio="none">
        <g className="condition-links">
          <path d="M260 105 L105 38" />
          <path d="M260 105 L78 104" />
          <path d="M260 105 L118 176" />
          <path d="M260 105 L402 34" />
          <path d="M260 105 L445 104" />
          <path d="M260 105 L397 177" />
        </g>
        <g className="condition-points">
          <circle cx="105" cy="38" r="5" /><circle cx="78" cy="104" r="5" />
          <circle cx="118" cy="176" r="5" /><circle cx="402" cy="34" r="5" />
          <circle cx="445" cy="104" r="5" /><circle cx="397" cy="177" r="5" />
        </g>
      </svg>
      <div className="condition-core"><span>Dx</span><i /><b /></div>
    </div>
  );
}

function EvidenceInstrument() {
  return (
    <div className="evidence-observatory" aria-hidden="true">
      <svg className="evidence-links" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M10 18 L27 33 L43 20 L64 28 L78 14 L95 30 L84 46 L71 63 L91 72 L57 82 L35 76 L18 63 L39 48 L50 52" />
        <path d="M27 33 L39 48 L64 28 M50 52 L71 63 M35 76 L50 52" />
      </svg>
      {constellation.map(([x, y], index) => (
        <i key={`${x}-${y}`} className="evidence-star" style={{ left: `${x}%`, top: `${y}%`, "--star-delay": `${index * -0.31}s` } as CSSProperties} />
      ))}
      <div className="evidence-reticle"><span>Σ</span></div>
      <div className="evidence-sweep" />
    </div>
  );
}

function VaultInstrument() {
  return (
    <div className="vault-machine" aria-hidden="true">
      <div className="vault-door">
        <div className="vault-ring outer" />
        <div className="vault-ring middle" />
        <div className="vault-ring inner" />
        <div className="vault-spokes"><i /><i /><i /><i /><i /><i /></div>
        <div className="vault-lock"><span>V</span></div>
      </div>
      <div className="vault-slots"><i /><i /><i /><i /></div>
    </div>
  );
}

function StandardsInstrument() {
  return (
    <div className="standards-lens" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => (
        <div key={index} className={`standard-disc disc-${index + 1}`}><i /><b /></div>
      ))}
      <div className="standard-beam" />
      <div className="standard-readout">§</div>
    </div>
  );
}

function GuidanceInstrument() {
  return (
    <div className="guidance-stack" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className={`guidance-sheet sheet-${index + 1}`}>
          <i /><i /><i /><span />
        </div>
      ))}
      <div className="guidance-scan" />
    </div>
  );
}

function EnvironmentInstrument() {
  return (
    <div className="environment-chamber" aria-hidden="true">
      <div className="environment-sun" />
      <div className="environment-planet" />
      <div className="environment-band band-hot" />
      <div className="environment-band band-cold" />
      <div className="environment-atmosphere a1" />
      <div className="environment-atmosphere a2" />
      <div className="environment-marker m1" /><div className="environment-marker m2" />
    </div>
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
            <stop offset=".45" stopColor="#d9fbff" stopOpacity="1" />
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

function pointerMove(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  event.currentTarget.style.setProperty("--pointer-x", `${Math.round(x * 100)}%`);
  event.currentTarget.style.setProperty("--pointer-y", `${Math.round(y * 100)}%`);
  event.currentTarget.style.setProperty("--tilt-y", `${((x - 0.5) * 5).toFixed(2)}deg`);
  event.currentTarget.style.setProperty("--tilt-x", `${((0.5 - y) * 4).toFixed(2)}deg`);
}

function pointerLeave(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--pointer-x", "73%");
  event.currentTarget.style.setProperty("--pointer-y", "50%");
  event.currentTarget.style.setProperty("--tilt-y", "0deg");
  event.currentTarget.style.setProperty("--tilt-x", "0deg");
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
  countLabel = "signals",
  status,
  compact = false,
}: InstrumentStageProps) {
  const trimmedNodes = nodes.filter(Boolean).slice(0, 12);
  const showNodes = !["calculator", "standards", "guidance"].includes(variant);

  return (
    <section
      className={`instrument-stage instrument-${variant}${compact ? " compact" : ""}`}
      aria-label={`${title} interactive visualization`}
      onPointerMove={pointerMove}
      onPointerLeave={pointerLeave}
    >
      <div className="instrument-grid" aria-hidden="true" />
      <div className="instrument-scan" aria-hidden="true" />
      <div className="instrument-noise" aria-hidden="true" />

      <div className="instrument-copy">
        <span className="instrument-eyebrow">{eyebrow}</span>
        <strong>{title}</strong>
        {primary && <p>{primary}</p>}
        <div className="instrument-meta">
          {status && <span><i className="instrument-status-dot" />{status}</span>}
          {typeof count === "number" && <span>{count} {countLabel}</span>}
          {secondary && <span>{secondary}</span>}
        </div>
      </div>

      <div className="instrument-visual">
        {variant === "drug" && <DrugInstrument />}
        {variant === "calculator" && <CalculatorInstrument result={result} title={title} />}
        {variant === "condition" && <ConditionInstrument />}
        {variant === "evidence" && <EvidenceInstrument />}
        {variant === "vault" && <VaultInstrument />}
        {variant === "standards" && <StandardsInstrument />}
        {variant === "guidance" && <GuidanceInstrument />}
        {variant === "environment" && <EnvironmentInstrument />}
        {variant === "job" && (
          <div className="instrument-person-shell"><div className="instrument-person-halo" /><HoloPerson /></div>
        )}
        {variant === "injury" && (
          <div className="instrument-person-shell"><div className="instrument-person-halo injury" /><HoloPerson injury /></div>
        )}
        {variant === "aor" && <GlobeInstrument />}

        {showNodes && trimmedNodes.map((node, index) => (
          <div className={`instrument-node node-${variant}`} key={`${node}-${index}`} style={nodeStyle(index)}>
            <i /><span>{node}</span>
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
