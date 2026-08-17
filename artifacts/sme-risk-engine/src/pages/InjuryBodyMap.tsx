import { useEffect, useMemo, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Activity, Database, Search, Sparkles } from 'lucide-react';
import type { OccupationalInjuryProfile } from '@/lib/occupationalInjuryIntelligence';
import type { InjuryMetric, OccupationInjuryEvidence } from '@/lib/liveOccupationalApi';
import HologramPointCloud from './HologramPointCloud';
import './injury-anatomy.css';
import './injury-hologram-advanced.css';

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

const HOTSPOT_POSITIONS: Record<'front' | 'back', Record<RegionKey, { x: number; y: number; w: number; h: number }>> = {
  front: {
    head: { x: 50, y: 12, w: 18, h: 15 },
    neck: { x: 50, y: 20, w: 12, h: 7 },
    shoulder: { x: 50, y: 28, w: 42, h: 13 },
    chest: { x: 50, y: 39, w: 34, h: 22 },
    lowBack: { x: 50, y: 52, w: 30, h: 15 },
    upperExtremity: { x: 50, y: 45, w: 68, h: 35 },
    hand: { x: 50, y: 61, w: 80, h: 15 },
    hip: { x: 50, y: 58, w: 31, h: 14 },
    knee: { x: 50, y: 76, w: 28, h: 11 },
    lowerExtremity: { x: 50, y: 82, w: 34, h: 30 },
    foot: { x: 50, y: 96, w: 35, h: 9 },
    wholeBody: { x: 50, y: 53, w: 76, h: 90 },
  },
  back: {
    head: { x: 50, y: 12, w: 18, h: 15 },
    neck: { x: 50, y: 20, w: 12, h: 7 },
    shoulder: { x: 50, y: 28, w: 42, h: 13 },
    chest: { x: 50, y: 39, w: 34, h: 21 },
    lowBack: { x: 50, y: 52, w: 32, h: 17 },
    upperExtremity: { x: 50, y: 45, w: 68, h: 35 },
    hand: { x: 50, y: 61, w: 80, h: 15 },
    hip: { x: 50, y: 59, w: 33, h: 15 },
    knee: { x: 50, y: 76, w: 28, h: 11 },
    lowerExtremity: { x: 50, y: 82, w: 34, h: 30 },
    foot: { x: 50, y: 96, w: 35, h: 9 },
    wholeBody: { x: 50, y: 53, w: 76, h: 90 },
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
  const regionScores = useMemo(
    () => Object.fromEntries(signals.map((signal) => [signal.key, signal.score])) as Partial<Record<RegionKey, number>>,
    [signals],
  );
  const [active, setActive] = useState<RegionKey | null>(signals[0]?.key ?? null);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const idle = !profile;

  useEffect(() => {
    if (!signals.length) setActive(null);
    else if (!active || !signalMap.has(active)) setActive(signals[0].key);
  }, [signals, signalMap, active]);

  const activeKey = active ?? signals[0]?.key ?? null;
  const activeSignal = activeKey ? signalMap.get(activeKey) : undefined;
  const hasMeasured = signals.some((signal) => signal.source === 'BLS measured');

  const projectionStyle = {
    '--holo-rotate-x': `${(-tilt.y * 3.5).toFixed(2)}deg`,
    '--holo-rotate-y': `${(tilt.x * 4.5).toFixed(2)}deg`,
    '--holo-pointer-x': `${50 + tilt.x * 18}%`,
    '--holo-pointer-y': `${50 + tilt.y * 14}%`,
    '--holo-energy': activeSignal?.score ?? 0.34,
  } as CSSProperties;

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
  };

  const setProjectionView = (nextView: 'front' | 'back') => {
    setView(nextView);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section className={`injury-anatomy-shell anatomy-real advanced-hologram${idle ? ' idle' : ''}`} style={projectionStyle}>
      <div className="injury-anatomy-stage anatomy-real-stage">
        <div className="injury-anatomy-stage-head">
          <div>
            <span><Activity size={13} /> HOLOGRAPHIC INJURY ANATOMY</span>
            <h3>{idle ? 'Occupation-linked anatomical intelligence projection' : 'Interactive anatomical risk projection'}</h3>
          </div>
          <div className="anatomy-real-controls">
            <div className="hologram-view-toggle">
              <button className={view === 'front' ? 'active' : ''} onClick={() => setProjectionView('front')}>ANTERIOR</button>
              <button className={view === 'back' ? 'active' : ''} onClick={() => setProjectionView('back')}>POSTERIOR</button>
            </div>
            <div className={`injury-anatomy-mode${hasMeasured ? ' measured' : ''}`}>
              {idle ? <Search size={13} /> : hasMeasured ? <Database size={13} /> : <Sparkles size={13} />}
              {idle ? 'Standby' : hasMeasured ? 'BLS-linked projection' : 'Demand-derived projection'}
            </div>
          </div>
        </div>

        <div
          className="anatomy-real-visual advanced-hologram-visual"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        >
          <div className="holo-telemetry holo-telemetry-left">
            <span>ANATOMY VECTOR</span><strong>{view === 'front' ? 'ANTERIOR' : 'POSTERIOR'}</strong>
            <small>VOLUMETRIC POINT CLOUD · ACTIVE</small>
          </div>
          <div className="holo-telemetry holo-telemetry-right">
            <span>REGION ENERGY</span><strong>{Math.round((activeSignal?.score ?? 0) * 100).toString().padStart(2, '0')}%</strong>
            <small>{hasMeasured ? 'MEASURED SIGNAL' : idle ? 'AWAITING INPUT' : 'DERIVED SIGNAL'}</small>
          </div>

          <div className="holo-floor-grid" />
          <div className="holo-depth-field depth-field-a" />
          <div className="holo-depth-field depth-field-b" />
          <div className="holo-depth-field depth-field-c" />
          <div className="anatomy-real-hud hud-a" />
          <div className="anatomy-real-hud hud-b" />
          <div className="anatomy-real-hud hud-c" />
          <div className="holo-orbit orbit-x" />
          <div className="holo-orbit orbit-y" />
          <div className="anatomy-real-scan" />
          <div className="holo-scan-plane scan-plane-secondary" />
          <div className="anatomy-real-projector"><i /><i /><i /></div>

          <div className="advanced-hologram-rig">
            <div className="holo-volume-shell" />
            <div className="anatomy-real-body" data-view={view}>
              <HologramPointCloud
                view={view}
                tiltX={tilt.x}
                tiltY={tilt.y}
                activeRegion={activeKey}
                regionScores={regionScores}
              />

              <div className="holo-body-scanlines" />
              <div className="holo-body-crosshair" />

              {!idle && Object.entries(HOTSPOT_POSITIONS[view]).map(([key, position]) => {
                const region = key as RegionKey;
                const signal = signalMap.get(region);
                if (!signal || region === 'wholeBody') return null;
                return (
                  <button
                    key={region}
                    className={`anatomy-real-hotspot${active === region ? ' active' : ''}`}
                    data-source={signal.source === 'BLS measured' ? 'measured' : 'derived'}
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
          </div>

          {idle && <div className="injury-anatomy-idle-callout anatomy-real-callout"><Search size={18} /><strong>Search an occupation to energize the projection.</strong><span>Published BLS body-part data will drive region intensity while occupational-demand signals fill gaps.</span></div>}
        </div>

        <div className="anatomy-real-credit">Procedural 3D human point cloud · projected volume + evidence-driven regional signal mapping</div>
      </div>

      <aside className="injury-anatomy-data anatomy-real-data">
        {idle ? (
          <div className="injury-anatomy-idle-data">
            <span>PROJECTION STACK</span>
            <div><b>01</b><strong>Volumetric human point cloud</strong><small>Thousands of projected points are generated from rounded anatomical volumes rather than a flat polygon silhouette.</small></div>
            <div><b>02</b><strong>True anatomical proportions</strong><small>Head, torso, pelvis, limbs, joints, hands and feet are independently modeled to preserve believable human form.</small></div>
            <div><b>03</b><strong>Evidence-driven heat</strong><small>BLS body-part counts illuminate corresponding regions; occupational demand signals provide contextual fallback.</small></div>
            <div><b>04</b><strong>Interactive depth</strong><small>Anterior/posterior projection, pointer-responsive perspective and regional selection operate on the volumetric model.</small></div>
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
                <button key={signal.key} className={active === signal.key ? 'active' : ''} data-source={signal.source === 'BLS measured' ? 'measured' : 'derived'} onMouseEnter={() => setActive(signal.key)} onClick={() => setActive(signal.key)}>
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
