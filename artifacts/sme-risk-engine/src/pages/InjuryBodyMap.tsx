import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Activity, Database, RotateCcw, Search, Sparkles } from 'lucide-react';
import type { OccupationalInjuryProfile } from '@/lib/occupationalInjuryIntelligence';
import type { InjuryMetric, OccupationInjuryEvidence } from '@/lib/liveOccupationalApi';
import './injury-anatomy.css';
import './injury-anatomy-v2.css';
import './injury-anatomy-v3.css';

type RegionKey =
  | 'head'
  | 'neck'
  | 'shoulder'
  | 'chest'
  | 'lowBack'
  | 'upperExtremity'
  | 'hand'
  | 'hip'
  | 'knee'
  | 'lowerExtremity'
  | 'foot'
  | 'wholeBody';

type RegionSignal = {
  key: RegionKey;
  label: string;
  score: number;
  source: 'BLS measured' | 'Derived context';
  value?: number;
  detail: string[];
};

const REGION_LABELS: Record<RegionKey, string> = {
  head: 'Head',
  neck: 'Neck',
  shoulder: 'Shoulder',
  chest: 'Chest / torso',
  lowBack: 'Low back',
  upperExtremity: 'Upper extremity',
  hand: 'Hand / wrist',
  hip: 'Hip / pelvis',
  knee: 'Knee',
  lowerExtremity: 'Lower extremity',
  foot: 'Foot / ankle',
  wholeBody: 'Whole body / multiple',
};

function metricRegion(label: string): RegionKey[] {
  const value = label.toLowerCase();
  const keys: RegionKey[] = [];
  if (/head|brain|face|skull|cran/.test(value)) keys.push('head');
  if (/neck|cervical/.test(value)) keys.push('neck');
  if (/shoulder/.test(value)) keys.push('shoulder');
  if (/chest|thorax|torso|trunk/.test(value)) keys.push('chest');
  if (/back|lumbar|spine/.test(value)) keys.push('lowBack');
  if (/arm|upper extrem|elbow|forearm/.test(value)) keys.push('upperExtremity');
  if (/hand|wrist|finger/.test(value)) keys.push('hand');
  if (/hip|pelvis|groin/.test(value)) keys.push('hip');
  if (/knee/.test(value)) keys.push('knee');
  if (/leg|lower extrem|calf|shin/.test(value)) keys.push('lowerExtremity');
  if (/foot|feet|ankle|toe/.test(value)) keys.push('foot');
  if (/multiple|body systems|whole body|systemic/.test(value)) keys.push('wholeBody');
  return [...new Set(keys)];
}

function derivedRegion(label: string): RegionKey[] {
  const value = label.toLowerCase();
  const keys = metricRegion(value);
  if (/cardiopulmonary|cardiovascular|respiratory/.test(value)) keys.push('chest');
  if (/hearing|vision|vestibular|neurolog/.test(value)) keys.push('head');
  if (/upper back/.test(value)) keys.push('chest');
  return [...new Set(keys)];
}

function scoreColor(score: number): string {
  const clamped = Math.max(0, Math.min(1, score));
  const hue = 185 - clamped * 155;
  return `hsla(${hue}, 96%, 64%, ${0.3 + clamped * 0.68})`;
}

function glowColor(score: number): string {
  const clamped = Math.max(0, Math.min(1, score));
  const hue = 185 - clamped * 155;
  return `hsla(${hue}, 100%, 66%, ${0.44 + clamped * 0.46})`;
}

function buildRegionSignals(measured: OccupationInjuryEvidence | null, profile: OccupationalInjuryProfile | null): RegionSignal[] {
  if (!profile) return [];
  const measuredBody = measured?.datasets.find((dataset) => dataset.dimension === 'body-part' && dataset.status === 'available');
  const measuredMap = new Map<RegionKey, { value: number; details: string[] }>();

  if (measuredBody?.top.length) {
    measuredBody.top.forEach((metric: InjuryMetric) => {
      metricRegion(metric.label).forEach((key) => {
        const current = measuredMap.get(key) ?? { value: 0, details: [] };
        current.value += metric.value;
        current.details.push(`${metric.label}: ${metric.value.toLocaleString('en-US')}`);
        measuredMap.set(key, current);
      });
    });
  }

  const maxMeasured = Math.max(0, ...[...measuredMap.values()].map((item) => item.value));
  const derivedMap = new Map<RegionKey, string[]>();
  profile.injurySignals.forEach((signal) => {
    signal.bodyRegions.forEach((bodyRegion) => {
      derivedRegion(bodyRegion).forEach((key) => {
        const current = derivedMap.get(key) ?? [];
        current.push(signal.label);
        derivedMap.set(key, current);
      });
    });
  });

  const keys = new Set<RegionKey>([...measuredMap.keys(), ...derivedMap.keys()]);
  if (!keys.size) profile.dominantBodyRegions.forEach((label) => derivedRegion(label).forEach((key) => keys.add(key)));

  return [...keys]
    .map((key) => {
      const measuredEntry = measuredMap.get(key);
      const derived = derivedMap.get(key) ?? [];
      if (measuredEntry && maxMeasured > 0) {
        return {
          key,
          label: REGION_LABELS[key],
          score: Math.max(0.18, measuredEntry.value / maxMeasured),
          source: 'BLS measured' as const,
          value: measuredEntry.value,
          detail: measuredEntry.details.slice(0, 4),
        };
      }
      return {
        key,
        label: REGION_LABELS[key],
        score: Math.min(0.78, 0.34 + derived.length * 0.11),
        source: 'Derived context' as const,
        detail: derived.slice(0, 4),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function regionStyle(signal?: RegionSignal): CSSProperties {
  const score = signal?.score ?? 0.06;
  return {
    '--region-fill': scoreColor(score),
    '--region-glow': glowColor(score),
    '--region-opacity': signal ? 1 : 0.08,
  } as CSSProperties;
}

const BODY_OUTLINE = 'M130 24 C108 24 96 41 98 62 C99 79 105 91 114 99 L113 119 C94 124 76 132 62 145 C50 156 44 174 41 196 L27 306 C25 323 29 331 37 334 C47 337 54 329 57 316 L72 223 C75 210 79 202 84 196 L88 305 C88 331 84 356 82 378 L74 520 C73 538 79 548 90 550 C101 551 108 542 110 526 L126 389 L134 389 L150 526 C152 542 159 551 170 550 C181 548 187 538 186 520 L178 378 C176 356 172 331 172 305 L176 196 C181 202 185 210 188 223 L203 316 C206 329 213 337 223 334 C231 331 235 323 233 306 L219 196 C216 174 210 156 198 145 C184 132 166 124 147 119 L146 99 C155 91 161 79 162 62 C164 41 152 24 130 24 Z';

function Hotspot({
  region,
  signal,
  active,
  idle,
  onSelect,
  children,
}: {
  region: RegionKey;
  signal?: RegionSignal;
  active: boolean;
  idle: boolean;
  onSelect: (key: RegionKey) => void;
  children: ReactNode;
}) {
  return (
    <g
      className={`holo-hotspot${active ? ' active' : ''}${signal ? ' signaled' : ''}${idle ? ' idle' : ''}`}
      style={regionStyle(signal)}
      onMouseEnter={() => !idle && onSelect(region)}
      onFocus={() => !idle && onSelect(region)}
      onClick={() => !idle && onSelect(region)}
      role="button"
      tabIndex={idle ? -1 : 0}
      aria-label={REGION_LABELS[region]}
    >
      {children}
    </g>
  );
}

function InternalAnatomy({ view }: { view: 'front' | 'back' }) {
  if (view === 'back') {
    return (
      <g className="holo-internals back">
        <path className="holo-spine" d="M130 101 C127 130 132 157 129 187 C126 218 133 248 130 281 C127 314 132 344 130 376" />
        {[116, 131, 146, 161, 176, 191, 206, 221, 236, 251, 266, 281, 296, 311, 326, 341].map((y) => <ellipse key={y} cx="130" cy={y} rx="4.5" ry="2.8" />)}
        <path className="holo-bone" d="M88 145 Q105 132 123 145 Q108 174 88 191 Q80 168 88 145 Z" />
        <path className="holo-bone" d="M172 145 Q155 132 137 145 Q152 174 172 191 Q180 168 172 145 Z" />
        <path className="holo-pelvis" d="M92 300 Q130 319 168 300 Q162 340 145 351 Q130 360 115 351 Q98 340 92 300 Z" />
        <path className="holo-bone limb" d="M87 168 L53 316" />
        <path className="holo-bone limb" d="M173 168 L207 316" />
        <path className="holo-bone limb" d="M113 355 L91 526" />
        <path className="holo-bone limb" d="M147 355 L169 526" />
      </g>
    );
  }

  return (
    <g className="holo-internals front">
      <path className="holo-trachea" d="M130 100 L130 150" />
      <path className="holo-lung left" d="M121 145 C103 139 91 151 89 176 C87 207 98 232 121 241 C126 217 126 174 121 145 Z" />
      <path className="holo-lung right" d="M139 145 C157 139 169 151 171 176 C173 207 162 232 139 241 C134 217 134 174 139 145 Z" />
      <path className="holo-heart" d="M130 195 C119 181 102 188 105 204 C108 222 130 235 130 235 C130 235 152 222 155 204 C158 188 141 181 130 195 Z" />
      <path className="holo-organ liver" d="M109 244 C126 235 151 239 164 251 C152 267 131 271 107 263 Z" />
      <path className="holo-organ stomach" d="M146 263 C158 267 160 282 151 294 C142 306 126 301 127 286 C128 274 136 266 146 263 Z" />
      <path className="holo-organ bowel" d="M105 283 C97 306 101 329 117 342 C133 355 157 344 161 325 C165 306 158 286 143 279 C128 273 113 275 105 283 Z" />
      <path className="holo-pelvis" d="M92 300 Q130 319 168 300 Q162 340 145 351 Q130 360 115 351 Q98 340 92 300 Z" />
      <g className="holo-ribs">
        {[151, 163, 175, 187, 199, 211, 223].map((y, i) => (
          <path key={y} d={`M130 ${y} C${106 - i} ${y - 9} ${89 - i} ${y + 1} ${87 - i} ${y + 11} M130 ${y} C${154 + i} ${y - 9} ${171 + i} ${y + 1} ${173 + i} ${y + 11}`} />
        ))}
      </g>
      <path className="holo-sternum" d="M130 145 L130 229" />
      <path className="holo-bone limb" d="M87 168 L53 316" />
      <path className="holo-bone limb" d="M173 168 L207 316" />
      <path className="holo-bone limb" d="M113 355 L91 526" />
      <path className="holo-bone limb" d="M147 355 L169 526" />
    </g>
  );
}

function HologramFigure({
  view,
  signals,
  active,
  idle,
  onSelect,
}: {
  view: 'front' | 'back';
  signals: Map<RegionKey, RegionSignal>;
  active: RegionKey | null;
  idle: boolean;
  onSelect: (key: RegionKey) => void;
}) {
  return (
    <div className="hologram-figure-wrap">
      <svg className="hologram-figure" viewBox="0 0 260 590" aria-label={`${view} projected anatomical hologram`}>
        <defs>
          <linearGradient id={`bodyFill-${view}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#9dfff0" stopOpacity=".26" />
            <stop offset=".46" stopColor="#4fe8d4" stopOpacity=".10" />
            <stop offset="1" stopColor="#4fb8ff" stopOpacity=".08" />
          </linearGradient>
          <linearGradient id={`bodyStroke-${view}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#d4fff7" />
            <stop offset=".45" stopColor="#6ff5df" />
            <stop offset="1" stopColor="#4ac9e7" />
          </linearGradient>
          <radialGradient id={`coreGlow-${view}`}>
            <stop offset="0" stopColor="#78ffe8" stopOpacity=".22" />
            <stop offset="1" stopColor="#78ffe8" stopOpacity="0" />
          </radialGradient>
          <pattern id={`mesh-${view}`} width="11" height="11" patternUnits="userSpaceOnUse">
            <path d="M0 0 L11 0 M0 0 L0 11" stroke="#6ff4df" strokeOpacity=".18" strokeWidth=".55" />
            <path d="M0 11 L11 0" stroke="#6ff4df" strokeOpacity=".06" strokeWidth=".45" />
          </pattern>
          <clipPath id={`bodyClip-${view}`}><path d={BODY_OUTLINE} /></clipPath>
          <filter id={`bodyBloom-${view}`} x="-70%" y="-30%" width="240%" height="180%">
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`hotBloom-${view}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <ellipse className="holo-core" cx="130" cy="290" rx="118" ry="250" fill={`url(#coreGlow-${view})`} />
        <path className="holo-body-glow" d={BODY_OUTLINE} />
        <path className="holo-body" d={BODY_OUTLINE} fill={`url(#bodyFill-${view})`} stroke={`url(#bodyStroke-${view})`} filter={`url(#bodyBloom-${view})`} />
        <g clipPath={`url(#bodyClip-${view})`} className="holo-mesh">
          <rect x="18" y="18" width="224" height="548" fill={`url(#mesh-${view})`} />
          {[75, 112, 149, 186, 223, 260, 297, 334, 371, 408, 445, 482, 519].map((y) => <path key={y} d={`M35 ${y} Q130 ${y + 15} 225 ${y}`} />)}
          {[65, 90, 115, 140, 165, 190].map((x) => <path key={x} d={`M${x} 40 Q${130 + (x - 130) * .45} 290 ${x} 548`} />)}
        </g>

        <g className="holo-head-detail">
          <ellipse cx="130" cy="59" rx="29" ry="35" />
          <path d="M111 61 Q130 78 149 61" />
          <path d="M118 52 Q123 48 127 52 M133 52 Q137 48 142 52" />
          <path d="M122 73 Q130 78 138 73" />
        </g>

        <InternalAnatomy view={view} />

        <g className="holo-hotspots" filter={`url(#hotBloom-${view})`}>
          <Hotspot region="head" signal={signals.get('head')} active={active === 'head'} idle={idle} onSelect={onSelect}><ellipse cx="130" cy="58" rx="32" ry="38" /></Hotspot>
          <Hotspot region="neck" signal={signals.get('neck')} active={active === 'neck'} idle={idle} onSelect={onSelect}><path d="M114 95 Q130 105 146 95 L147 121 Q130 128 113 121 Z" /></Hotspot>
          <Hotspot region="shoulder" signal={signals.get('shoulder')} active={active === 'shoulder'} idle={idle} onSelect={onSelect}><path d="M78 143 Q103 123 122 132 L116 163 Q94 154 76 170 Z M182 143 Q157 123 138 132 L144 163 Q166 154 184 170 Z" /></Hotspot>
          <Hotspot region="chest" signal={signals.get('chest')} active={active === 'chest'} idle={idle} onSelect={onSelect}><path d="M93 142 Q130 127 167 142 L174 248 Q130 270 86 248 Z" /></Hotspot>
          {view === 'back' && <Hotspot region="lowBack" signal={signals.get('lowBack')} active={active === 'lowBack'} idle={idle} onSelect={onSelect}><path d="M92 240 Q130 255 168 240 L169 310 Q130 326 91 310 Z" /></Hotspot>}
          {view === 'front' && <Hotspot region="hip" signal={signals.get('hip')} active={active === 'hip'} idle={idle} onSelect={onSelect}><path d="M91 287 Q130 307 169 287 L171 347 Q130 369 89 347 Z" /></Hotspot>}
          <Hotspot region="upperExtremity" signal={signals.get('upperExtremity')} active={active === 'upperExtremity'} idle={idle} onSelect={onSelect}><path className="limb-hot" d="M77 158 Q55 185 51 218 L35 306 M183 158 Q205 185 209 218 L225 306" /></Hotspot>
          <Hotspot region="hand" signal={signals.get('hand')} active={active === 'hand'} idle={idle} onSelect={onSelect}><ellipse cx="35" cy="321" rx="14" ry="18" /><ellipse cx="225" cy="321" rx="14" ry="18" /></Hotspot>
          <Hotspot region="knee" signal={signals.get('knee')} active={active === 'knee'} idle={idle} onSelect={onSelect}><ellipse cx="98" cy="402" rx="15" ry="19" /><ellipse cx="162" cy="402" rx="15" ry="19" /></Hotspot>
          <Hotspot region="lowerExtremity" signal={signals.get('lowerExtremity')} active={active === 'lowerExtremity'} idle={idle} onSelect={onSelect}><path className="limb-hot" d="M105 348 Q99 397 96 442 L89 523 M155 348 Q161 397 164 442 L171 523" /></Hotspot>
          <Hotspot region="foot" signal={signals.get('foot')} active={active === 'foot'} idle={idle} onSelect={onSelect}><ellipse cx="88" cy="542" rx="19" ry="11" /><ellipse cx="172" cy="542" rx="19" ry="11" /></Hotspot>
          {signals.has('wholeBody') && <Hotspot region="wholeBody" signal={signals.get('wholeBody')} active={active === 'wholeBody'} idle={idle} onSelect={onSelect}><path className="whole-hot" d={BODY_OUTLINE} /></Hotspot>}
        </g>
      </svg>
    </div>
  );
}

export default function InjuryBodyMap({
  measured,
  profile,
}: {
  measured: OccupationInjuryEvidence | null;
  profile: OccupationalInjuryProfile | null;
}) {
  const signals = useMemo(() => buildRegionSignals(measured, profile), [measured, profile]);
  const signalMap = useMemo(() => new Map<RegionKey, RegionSignal>(signals.map((signal) => [signal.key, signal] as const)), [signals]);
  const [active, setActive] = useState<RegionKey | null>(signals[0]?.key ?? null);
  const [view, setView] = useState<'front' | 'back'>('front');
  const idle = !profile;

  useEffect(() => {
    if (!signals.length) setActive(null);
    else if (!active || !signalMap.has(active)) setActive(signals[0].key);
  }, [signals, signalMap, active]);

  const activeKey = active ?? signals[0]?.key ?? null;
  const activeSignal = activeKey ? signalMap.get(activeKey) : undefined;
  const hasMeasured = signals.some((signal) => signal.source === 'BLS measured');

  return (
    <section className={`injury-anatomy-shell anatomy-v3${idle ? ' idle' : ''}`}>
      <div className="injury-anatomy-stage">
        <div className="injury-anatomy-stage-head">
          <div>
            <span><Activity size={13} /> PROJECTED INJURY ANATOMY</span>
            <h3>{idle ? 'Occupation-linked anatomical hologram' : 'Body-region injury projection'}</h3>
          </div>
          <div className="anatomy-v3-toolbar">
            <button className={view === 'front' ? 'active' : ''} onClick={() => setView('front')}>Anterior</button>
            <button className={view === 'back' ? 'active' : ''} onClick={() => setView('back')}>Posterior</button>
            <span className={`injury-anatomy-mode${hasMeasured ? ' measured' : ''}`}>
              {idle ? <Search size={13} /> : hasMeasured ? <Database size={13} /> : <Sparkles size={13} />}
              {idle ? 'Awaiting occupation' : hasMeasured ? 'BLS body-part data' : 'Demand-derived fallback'}
            </span>
          </div>
        </div>

        <div className="injury-anatomy-visual anatomy-v3-visual">
          <div className="holo-hud-ring ring-a" />
          <div className="holo-hud-ring ring-b" />
          <div className="holo-hud-ring ring-c" />
          <div className="holo-projector-base"><i /><i /><i /></div>
          <div className="anatomy-scan-line" />
          <HologramFigure view={view} signals={signalMap} active={active} idle={idle} onSelect={setActive} />
          <div className="holo-axis-label left">BIO / REGION</div>
          <div className="holo-axis-label right">{view === 'front' ? 'ANTERIOR' : 'POSTERIOR'} VIEW</div>
          {idle && (
            <div className="injury-anatomy-idle-callout anatomy-v3-idle-callout">
              <Search size={18} />
              <strong>Search an occupation to activate the projection.</strong>
              <span>Measured BLS body-part data will drive highlighted regions when published.</span>
            </div>
          )}
        </div>
      </div>

      <aside className="injury-anatomy-data anatomy-v3-data">
        {idle ? (
          <div className="injury-anatomy-idle-data">
            <span>PROJECTION LAYERS</span>
            <div><b>01</b><strong>Anatomical mesh</strong><small>Human-proportioned translucent tissue, skeletal and organ reference layers.</small></div>
            <div><b>02</b><strong>BLS injury heat</strong><small>Published body-part counts illuminate the corresponding anatomical regions.</small></div>
            <div><b>03</b><strong>Interactive region inspection</strong><small>Hover a highlighted region to expose measured or derived supporting detail.</small></div>
          </div>
        ) : (
          <>
            <div className="injury-anatomy-focus">
              <span>FOCUS REGION</span>
              <h4>{activeSignal?.label ?? 'No region selected'}</h4>
              {activeSignal && (
                <>
                  <div className="injury-anatomy-focus-meta">
                    <strong>{activeSignal.source}</strong>
                    {activeSignal.value !== undefined && <em>{activeSignal.value.toLocaleString('en-US')}</em>}
                  </div>
                  <div className="injury-anatomy-focus-bar"><i style={{ width: `${Math.round(activeSignal.score * 100)}%` }} /></div>
                  <div className="injury-anatomy-detail-list">
                    {activeSignal.detail.length ? activeSignal.detail.map((item) => <div key={item}>{item}</div>) : <div>No detailed body-part breakdown published.</div>}
                  </div>
                </>
              )}
            </div>

            <div className="injury-anatomy-ranking">
              <span>REGION RANKING</span>
              {signals.slice(0, 7).map((signal, index) => (
                <button key={signal.key} className={active === signal.key ? 'active' : ''} onMouseEnter={() => setActive(signal.key)} onClick={() => setActive(signal.key)}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <div>
                    <strong>{signal.label}</strong>
                    <small>{signal.source}</small>
                    <span><i style={{ width: `${Math.round(signal.score * 100)}%` }} /></span>
                  </div>
                  {signal.value !== undefined && <em>{signal.value.toLocaleString('en-US')}</em>}
                </button>
              ))}
            </div>
            <button className="anatomy-reset" onClick={() => setActive(signals[0]?.key ?? null)}><RotateCcw size={12} /> Reset focus</button>
          </>
        )}
      </aside>
    </section>
  );
}
