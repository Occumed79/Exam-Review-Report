import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Activity, Database, RotateCcw, Search, Sparkles } from 'lucide-react';
import type { OccupationalInjuryProfile } from '@/lib/occupationalInjuryIntelligence';
import type { InjuryMetric, OccupationInjuryEvidence } from '@/lib/liveOccupationalApi';
import './injury-anatomy.css';
import './injury-anatomy-v2.css';
import './injury-anatomy-v4.css';
import './injury-anatomy-v5.css';

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

const FRONT_ANATOMY_URL = 'https://upload.wikimedia.org/wikipedia/commons/a/a2/202403_human_anatomy_skeleton_and_organs.svg';
const BACK_ANATOMY_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Human_skeleton_back_no-text_no_color.svg';

const HOTSPOT_POSITIONS: Record<'front' | 'back', Record<RegionKey, { x: number; y: number; w: number; h: number }>> = {
  front: {
    head: { x: 50, y: 10, w: 15, h: 12 },
    neck: { x: 50, y: 19, w: 10, h: 8 },
    shoulder: { x: 50, y: 27, w: 40, h: 14 },
    chest: { x: 50, y: 37, w: 31, h: 19 },
    lowBack: { x: 50, y: 50, w: 28, h: 14 },
    upperExtremity: { x: 50, y: 43, w: 63, h: 31 },
    hand: { x: 50, y: 57, w: 78, h: 17 },
    hip: { x: 50, y: 58, w: 30, h: 14 },
    knee: { x: 50, y: 75, w: 28, h: 12 },
    lowerExtremity: { x: 50, y: 82, w: 36, h: 30 },
    foot: { x: 50, y: 96, w: 34, h: 9 },
    wholeBody: { x: 50, y: 53, w: 72, h: 88 },
  },
  back: {
    head: { x: 50, y: 10, w: 15, h: 12 },
    neck: { x: 50, y: 19, w: 10, h: 8 },
    shoulder: { x: 50, y: 27, w: 40, h: 14 },
    chest: { x: 50, y: 37, w: 31, h: 18 },
    lowBack: { x: 50, y: 50, w: 30, h: 18 },
    upperExtremity: { x: 50, y: 43, w: 63, h: 31 },
    hand: { x: 50, y: 57, w: 78, h: 17 },
    hip: { x: 50, y: 59, w: 32, h: 15 },
    knee: { x: 50, y: 75, w: 28, h: 12 },
    lowerExtremity: { x: 50, y: 82, w: 36, h: 30 },
    foot: { x: 50, y: 96, w: 34, h: 9 },
    wholeBody: { x: 50, y: 53, w: 72, h: 88 },
  },
};

const BODY_PART_DATASET_IDS = new Set(['R10']);

function metricToRegion(label: string): RegionKey | null {
  const text = label.toLowerCase();
  if (/head|face|cranial|skull/.test(text)) return 'head';
  if (/neck|cervical/.test(text)) return 'neck';
  if (/shoulder/.test(text)) return 'shoulder';
  if (/chest|thorax|trunk|torso/.test(text)) return 'chest';
  if (/back|lumbar/.test(text)) return 'lowBack';
  if (/arm|upper extrem|elbow/.test(text)) return 'upperExtremity';
  if (/hand|finger|wrist/.test(text)) return 'hand';
  if (/hip|pelvis/.test(text)) return 'hip';
  if (/knee/.test(text)) return 'knee';
  if (/leg|lower extrem|calf|shin/.test(text)) return 'lowerExtremity';
  if (/foot|feet|ankle|toe/.test(text)) return 'foot';
  if (/multiple|whole body|body systems/.test(text)) return 'wholeBody';
  return null;
}

function bodyPartMetrics(measured: OccupationInjuryEvidence | null): InjuryMetric[] {
  if (!measured) return [];
  return measured.datasets
    .filter((dataset) => BODY_PART_DATASET_IDS.has(dataset.id) && dataset.status === 'available')
    .flatMap((dataset) => dataset.top);
}

function derivedSignals(profile: OccupationalInjuryProfile | null): RegionSignal[] {
  if (!profile) return [];
  const regions = new Map<RegionKey, { score: number; detail: string[] }>();
  const prominenceScore: Record<string, number> = {
    'Very prominent': 1,
    Prominent: 0.82,
    Relevant: 0.62,
    Contextual: 0.4,
  };

  for (const signal of profile.injurySignals) {
    const score = prominenceScore[signal.prominence] ?? 0.4;
    for (const regionLabel of signal.bodyRegions) {
      const region = metricToRegion(regionLabel);
      if (!region) continue;
      const current = regions.get(region) ?? { score: 0, detail: [] };
      current.score = Math.max(current.score, score);
      if (signal.label && !current.detail.includes(signal.label)) current.detail.push(signal.label);
      regions.set(region, current);
    }
  }

  return [...regions.entries()].map(([key, value]) => ({
    key,
    label: REGION_LABELS[key],
    score: value.score,
    source: 'Derived context',
    detail: value.detail,
  }));
}

function buildRegionSignals(measured: OccupationInjuryEvidence | null, profile: OccupationalInjuryProfile | null): RegionSignal[] {
  const metrics = bodyPartMetrics(measured);
  const measuredByRegion = new Map<RegionKey, { value: number; detail: string[] }>();
  for (const metric of metrics) {
    const region = metricToRegion(metric.label);
    if (!region) continue;
    const current = measuredByRegion.get(region) ?? { value: 0, detail: [] };
    current.value += metric.value;
    current.detail.push(`${metric.label}: ${metric.value.toLocaleString('en-US')}`);
    measuredByRegion.set(region, current);
  }

  if (measuredByRegion.size) {
    const max = Math.max(...[...measuredByRegion.values()].map((item) => item.value), 1);
    return [...measuredByRegion.entries()]
      .map(([key, value]) => ({
        key,
        label: REGION_LABELS[key],
        score: value.value / max,
        source: 'BLS measured' as const,
        value: value.value,
        detail: value.detail,
      }))
      .sort((a, b) => b.score - a.score);
  }

  return derivedSignals(profile).sort((a, b) => b.score - a.score);
}

function heatColor(score: number): string {
  if (score >= 0.8) return '#ff5f76';
  if (score >= 0.6) return '#ffb45e';
  if (score >= 0.4) return '#7ae7cf';
  return '#55c9e8';
}

function heatStyle(signal: RegionSignal): CSSProperties {
  return {
    '--heat-color': heatColor(signal.score),
    '--heat-strength': signal.score,
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
