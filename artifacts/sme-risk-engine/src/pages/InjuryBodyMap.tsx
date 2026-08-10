import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Activity, Database, RotateCcw, Search, Sparkles } from 'lucide-react';
import type { OccupationalInjuryProfile } from '@/lib/occupationalInjuryIntelligence';
import type { InjuryMetric, OccupationInjuryEvidence } from '@/lib/liveOccupationalApi';
import './injury-anatomy.css';
import './injury-anatomy-v2.css';
import './injury-anatomy-v4.css';

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

const FRONT_ANATOMY_URL = 'https://upload.wikimedia.org/wikipedia/commons/a/a2/202403_human_anatomy_skeleton_and_organs.svg';
const BACK_ANATOMY_URL = 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Human_skeleton_back_no-text_no-color.svg';

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

const HOTSPOT_POSITIONS: Record<'front' | 'back', Record<RegionKey, { x: number; y: number; w: number; h: number }>> = {
  front: {
    head: { x: 50, y: 11, w: 18, h: 13 },
    neck: { x: 50, y: 21, w: 14, h: 8 },
    shoulder: { x: 50, y: 29, w: 43, h: 12 },
    chest: { x: 50, y: 37, w: 34, h: 19 },
    lowBack: { x: 50, y: 51, w: 28, h: 14 },
    upperExtremity: { x: 50, y: 43, w: 62, h: 31 },
    hand: { x: 50, y: 59, w: 74, h: 11 },
    hip: { x: 50, y: 57, w: 28, h: 14 },
    knee: { x: 50, y: 73, w: 31, h: 10 },
    lowerExtremity: { x: 50, y: 79, w: 31, h: 30 },
    foot: { x: 50, y: 94, w: 34, h: 9 },
    wholeBody: { x: 50, y: 51, w: 78, h: 90 },
  },
  back: {
    head: { x: 50, y: 11, w: 18, h: 13 },
    neck: { x: 50, y: 21, w: 14, h: 8 },
    shoulder: { x: 50, y: 29, w: 44, h: 12 },
    chest: { x: 50, y: 38, w: 35, h: 18 },
    lowBack: { x: 50, y: 52, w: 31, h: 16 },
    upperExtremity: { x: 50, y: 43, w: 62, h: 31 },
    hand: { x: 50, y: 59, w: 74, h: 11 },
    hip: { x: 50, y: 58, w: 30, h: 14 },
    knee: { x: 50, y: 74, w: 32, h: 10 },
    lowerExtremity: { x: 50, y: 80, w: 32, h: 29 },
    foot: { x: 50, y: 94, w: 34, h: 9 },
    wholeBody: { x: 50, y: 51, w: 78, h: 90 },
  },
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

function heatStyle(signal?: RegionSignal): CSSProperties {
  const score = signal?.score ?? 0;
  const hue = 184 - Math.max(0, Math.min(1, score)) * 158;
  return {
    '--heat-color': `hsla(${hue}, 100%, 64%, ${0.46 + score * 0.48})`,
    '--heat-strength': `${0.18 + score * 0.82}`,
  } as CSSProperties;
}

export default function InjuryBodyMap({
  measured,
  profile,
}: {
  measured: OccupationInjuryEvidence | null;
  profile: OccupationalInjuryProfile | null;
}) {
  const signals = useMemo(() => buildRegionSignals(measured, profile), [measured, profile]);
  const signalMap = useMemo(() => new Map<RegionKey, RegionSignal>(signals.map((signal) => [signal.key, signal])), [signals]);
  const [active, setActive] = useState<RegionKey | null>(signals[0]?.key ?? null);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [assetFailed, setAssetFailed] = useState(false);
  const idle = !profile;

  useEffect(() => {
    if (!signals.length) setActive(null);
    else if (!active || !signalMap.has(active)) setActive(signals[0].key);
  }, [signals, signalMap, active]);

  const activeKey = active ?? signals[0]?.key ?? null;
  const activeSignal = activeKey ? signalMap.get(activeKey) : undefined;
  const hasMeasured = signals.some((signal) => signal.source === 'BLS measured');
  const sourceUrl = view === 'front' ? FRONT_ANATOMY_URL : BACK_ANATOMY_URL;

  return (
    <section className={`injury-anatomy-shell anatomy-real${idle ? ' idle' : ''}`}>
      <div className="injury-anatomy-stage anatomy-real-stage">
        <div className="injury-anatomy-stage-head">
          <div>
            <span><Activity size={13} /> PROJECTED INJURY ANATOMY</span>
            <h3>{idle ? 'Occupation-linked anatomical projection' : 'Interactive body-region injury projection'}</h3>
          </div>
          <div className="anatomy-real-controls">
            <div className="hologram-view-toggle">
              <button className={view === 'front' ? 'active' : ''} onClick={() => { setView('front'); setAssetFailed(false); }}>ANTERIOR</button>
              <button className={view === 'back' ? 'active' : ''} onClick={() => { setView('back'); setAssetFailed(false); }}>POSTERIOR</button>
            </div>
            <div className={`injury-anatomy-mode${hasMeasured ? ' measured' : ''}`}>
              {idle ? <Search size={13} /> : hasMeasured ? <Database size={13} /> : <Sparkles size={13} />}
              {idle ? 'Awaiting occupation' : hasMeasured ? 'BLS body-part data' : 'Demand-derived fallback'}
            </div>
          </div>
        </div>

        <div className="anatomy-real-visual">
          <div className="anatomy-real-hud hud-a" />
          <div className="anatomy-real-hud hud-b" />
          <div className="anatomy-real-hud hud-c" />
          <div className="anatomy-real-scan" />
          <div className="anatomy-real-projector"><i /><i /><i /></div>

          <div className="anatomy-real-body" data-view={view}>
            {!assetFailed ? (
              <>
                <img className="anatomy-real-img glow-layer" src={sourceUrl} alt="" aria-hidden="true" referrerPolicy="no-referrer" />
                <img
                  className="anatomy-real-img core-layer"
                  src={sourceUrl}
                  alt={`${view === 'front' ? 'Anterior' : 'Posterior'} human anatomy hologram`}
                  referrerPolicy="no-referrer"
                  onError={() => setAssetFailed(true)}
                />
              </>
            ) : (
              <div className="anatomy-real-fallback"><RotateCcw size={24} /><strong>Anatomy source unavailable</strong><span>The injury data remains available in the ranking panel.</span></div>
            )}

            {!idle && Object.entries(HOTSPOT_POSITIONS[view]).map(([key, position]) => {
              const region = key as RegionKey;
              const signal = signalMap.get(region);
              if (!signal || region === 'wholeBody') return null;
              return (
                <button
                  key={region}
                  className={`anatomy-real-hotspot${active === region ? ' active' : ''}`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    width: `${position.w}%`,
                    height: `${position.h}%`,
                    ...heatStyle(signal),
                  }}
                  onMouseEnter={() => setActive(region)}
                  onFocus={() => setActive(region)}
                  onClick={() => setActive(region)}
                  aria-label={`${REGION_LABELS[region]} injury signal`}
                />
              );
            })}
          </div>

          {idle && <div className="injury-anatomy-idle-callout anatomy-real-callout"><Search size={18} /><strong>Search an occupation to activate injury heat.</strong><span>Published BLS body-part data will illuminate the corresponding anatomical regions when available.</span></div>}
        </div>

        <div className="anatomy-real-credit">
          {view === 'front'
            ? 'Anatomy base: DataBase Center for Life Science (DBCLS), CC BY 4.0 · holographic styling applied.'
            : 'Posterior skeleton base: LadyofHats / Wikimedia Commons, public domain · holographic styling applied.'}
        </div>
      </div>

      <aside className="injury-anatomy-data anatomy-real-data">
        {idle ? (
          <div className="injury-anatomy-idle-data">
            <span>PROJECTION LAYERS</span>
            <div><b>01</b><strong>Real anatomical artwork</strong><small>Detailed skeleton and organ illustration replaces the generated mannequin geometry.</small></div>
            <div><b>02</b><strong>BLS injury heat</strong><small>Published body-part counts illuminate corresponding regions where available.</small></div>
            <div><b>03</b><strong>Interactive inspection</strong><small>Hover a highlighted region to expose the measured or derived supporting detail.</small></div>
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
              {signals.slice(0, 8).map((signal, index) => (
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
