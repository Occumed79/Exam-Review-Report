import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Activity, Database, Search, Sparkles } from 'lucide-react';
import type { OccupationalInjuryProfile } from '@/lib/occupationalInjuryIntelligence';
import type { InjuryMetric, OccupationInjuryEvidence } from '@/lib/liveOccupationalApi';
import './injury-anatomy.css';
import './injury-anatomy-v2.css';

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
  const hue = 178 - clamped * 150;
  const alpha = 0.25 + clamped * 0.72;
  return `hsla(${hue}, 88%, 62%, ${alpha})`;
}

function glowColor(score: number): string {
  const clamped = Math.max(0, Math.min(1, score));
  const hue = 178 - clamped * 150;
  return `hsla(${hue}, 96%, 64%, ${0.35 + clamped * 0.45})`;
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
  const score = signal?.score ?? 0.05;
  return {
    '--region-fill': scoreColor(score),
    '--region-glow': glowColor(score),
    '--region-opacity': signal ? 1 : 0.2,
  } as CSSProperties;
}

function BodyFigure({
  view,
  signals,
  active,
  onSelect,
  idle,
}: {
  view: 'front' | 'back';
  signals: Map<RegionKey, RegionSignal>;
  active: RegionKey | null;
  onSelect: (key: RegionKey) => void;
  idle: boolean;
}) {
  const shape = (key: RegionKey, node: ReactNode) => (
    <g
      key={`${view}-${key}`}
      className={`anatomy-region${active === key ? ' active' : ''}${idle ? ' idle' : ''}`}
      style={regionStyle(signals.get(key))}
      onMouseEnter={() => !idle && onSelect(key)}
      onFocus={() => !idle && onSelect(key)}
      onClick={() => !idle && onSelect(key)}
      role="button"
      tabIndex={idle ? -1 : 0}
      aria-label={REGION_LABELS[key]}
    >
      {node}
    </g>
  );

  return (
    <div className="anatomy-figure-wrap">
      <span>{view === 'front' ? 'ANTERIOR' : 'POSTERIOR'}</span>
      <svg className="anatomy-figure" viewBox="0 0 180 430" aria-label={`${view} body injury map`}>
        <g className="anatomy-silhouette">
          <circle cx="90" cy="38" r="23" />
          <rect x="79" y="59" width="22" height="23" rx="9" />
          <path d="M61 83 Q90 72 119 83 L128 185 Q90 204 52 185 Z" />
          <path className="anatomy-limb" d="M56 92 Q39 110 33 145 L20 240" />
          <path className="anatomy-limb" d="M124 92 Q141 110 147 145 L160 240" />
          <path className="anatomy-limb" d="M70 188 L63 252 L58 377" />
          <path className="anatomy-limb" d="M110 188 L117 252 L122 377" />
          <ellipse cx="55" cy="398" rx="17" ry="8" />
          <ellipse cx="125" cy="398" rx="17" ry="8" />
        </g>

        {shape('head', <circle cx="90" cy="38" r="22" />)}
        {shape('neck', <rect x="80" y="60" width="20" height="22" rx="9" />)}
        {shape('shoulder', <><ellipse cx="59" cy="91" rx="18" ry="15" /><ellipse cx="121" cy="91" rx="18" ry="15" /></>)}
        {shape('upperExtremity', <><path className="anatomy-limb" d="M51 99 Q38 120 33 151 L23 229" /><path className="anatomy-limb" d="M129 99 Q142 120 147 151 L157 229" /></>)}
        {shape('hand', <><ellipse cx="20" cy="245" rx="9" ry="14" /><ellipse cx="160" cy="245" rx="9" ry="14" /></>)}
        {shape('chest', <path d="M65 91 Q90 82 115 91 L121 159 Q90 171 59 159 Z" />)}
        {view === 'back' && shape('lowBack', <path d="M61 151 Q90 165 119 151 L124 192 Q90 204 56 192 Z" />)}
        {view === 'front' && shape('hip', <path d="M59 166 Q90 180 121 166 L116 207 Q90 217 64 207 Z" />)}
        {shape('knee', <><ellipse cx="65" cy="285" rx="11" ry="14" /><ellipse cx="115" cy="285" rx="11" ry="14" /></>)}
        {shape('lowerExtremity', <><path className="anatomy-limb" d="M66 205 L62 271 L58 371" /><path className="anatomy-limb" d="M114 205 L118 271 L122 371" /></>)}
        {shape('foot', <><ellipse cx="55" cy="398" rx="16" ry="8" /><ellipse cx="125" cy="398" rx="16" ry="8" /></>)}
        {signals.has('wholeBody') && (
          <g className={`anatomy-whole-body${active === 'wholeBody' ? ' active' : ''}`} style={regionStyle(signals.get('wholeBody'))} onMouseEnter={() => onSelect('wholeBody')} onClick={() => onSelect('wholeBody')}>
            <ellipse cx="90" cy="214" rx="76" ry="199" />
          </g>
        )}
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
  const signalMap = useMemo(
    () => new Map<RegionKey, RegionSignal>(signals.map((signal) => [signal.key, signal] as const)),
    [signals],
  );
  const [active, setActive] = useState<RegionKey | null>(signals[0]?.key ?? null);
  const idle = !profile;

  useEffect(() => {
    if (!signals.length) setActive(null);
    else if (!active || !signalMap.has(active)) setActive(signals[0].key);
  }, [signals, signalMap, active]);

  const activeKey = active ?? signals[0]?.key ?? null;
  const activeSignal = activeKey ? signalMap.get(activeKey) : undefined;
  const hasMeasured = signals.some((signal) => signal.source === 'BLS measured');

  return (
    <section className={`injury-anatomy-shell${idle ? ' idle' : ''}`}>
      <div className="injury-anatomy-stage">
        <div className="injury-anatomy-stage-head">
          <div>
            <span><Activity size={13} /> INJURY ANATOMY</span>
            <h3>{idle ? 'Occupation-linked body map' : 'Body-region signal map'}</h3>
          </div>
          <div className={`injury-anatomy-mode${hasMeasured ? ' measured' : ''}`}>
            {idle ? <Search size={13} /> : hasMeasured ? <Database size={13} /> : <Sparkles size={13} />}
            {idle ? 'Awaiting occupation' : hasMeasured ? 'BLS body-part data' : 'Demand-derived fallback'}
          </div>
        </div>

        <div className="injury-anatomy-visual">
          <div className="anatomy-orbit orbit-one" />
          <div className="anatomy-orbit orbit-two" />
          <div className="anatomy-scan-line" />
          <BodyFigure view="front" signals={signalMap} active={active} onSelect={setActive} idle={idle} />
          <BodyFigure view="back" signals={signalMap} active={active} onSelect={setActive} idle={idle} />
          {idle && <div className="injury-anatomy-idle-callout"><Search size={18} /><strong>Search an occupation to activate the anatomy map.</strong><span>Published BLS body-part data will drive the heat map when available.</span></div>}
        </div>
      </div>

      <aside className="injury-anatomy-data">
        {idle ? (
          <div className="injury-anatomy-idle-data">
            <span>WHAT ACTIVATES HERE</span>
            <div><b>01</b><strong>BLS body-part distribution</strong><small>Measured occupation-level injury data where published.</small></div>
            <div><b>02</b><strong>Region heat intensity</strong><small>Higher published counts or stronger derived signals glow hotter.</small></div>
            <div><b>03</b><strong>Front / back anatomy</strong><small>Hoverable regions reveal the underlying measured or derived context.</small></div>
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
          </>
        )}
      </aside>
    </section>
  );
}
