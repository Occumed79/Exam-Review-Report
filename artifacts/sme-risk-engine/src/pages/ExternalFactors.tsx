import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CloudSun,
  Gauge,
  Layers3,
  Moon,
  Mountain,
  ShieldCheck,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import './external-factors.css';

type FactorLevel = 'low' | 'moderate' | 'high' | 'critical';

type Factor = {
  id: string;
  label: string;
  value: string;
  score: number;
  level: FactorLevel;
  note: string;
};

const levelFor = (score: number): FactorLevel => score >= 85 ? 'critical' : score >= 65 ? 'high' : score >= 35 ? 'moderate' : 'low';
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const n = (value: string, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export default function ExternalFactors() {
  const [temperature, setTemperature] = useState('82');
  const [humidity, setHumidity] = useState('55');
  const [altitude, setAltitude] = useState('500');
  const [aqi, setAqi] = useState('45');
  const [shiftHours, setShiftHours] = useState('10');
  const [sleepHours, setSleepHours] = useState('7');
  const [timeZones, setTimeZones] = useState('0');
  const [ppe, setPpe] = useState('1');
  const [hydration, setHydration] = useState<'reliable' | 'limited'>('reliable');

  const factors = useMemo<Factor[]>(() => {
    const temp = n(temperature, 72);
    const rh = n(humidity, 50);
    const alt = n(altitude);
    const air = n(aqi);
    const shift = n(shiftHours, 8);
    const sleep = n(sleepHours, 7);
    const zones = n(timeZones);
    const ppeLoad = n(ppe);

    const heatScore = clamp(Math.max(0, temp - 72) * 2.2 + Math.max(0, rh - 45) * (temp >= 80 ? 0.55 : 0.16) + ppeLoad * 9 + (hydration === 'limited' ? 16 : 0));
    const coldScore = clamp(Math.max(0, 55 - temp) * 2.3 + ppeLoad * 2);
    const altitudeScore = clamp(Math.max(0, alt - 2500) / 75);
    const airScore = clamp(air <= 50 ? air * 0.24 : air <= 100 ? 12 + (air - 50) * 0.55 : air <= 150 ? 40 + (air - 100) * 0.72 : 76 + (air - 150) * 0.48);
    const fatigueScore = clamp(Math.max(0, shift - 8) * 8 + Math.max(0, 7 - sleep) * 16 + zones * 7);
    const ppeScore = clamp(ppeLoad * 27 + (temp >= 85 ? 12 : 0));

    return [
      { id: 'heat', label: 'Heat strain context', value: `${temp}°F · ${rh}% RH`, score: heatScore, level: levelFor(heatScore), note: 'Temperature, humidity, PPE burden, and hydration access combine into this contextual load.' },
      { id: 'cold', label: 'Cold exposure context', value: `${temp}°F`, score: coldScore, level: levelFor(coldScore), note: 'Cold load rises as temperature falls and protective equipment demands increase.' },
      { id: 'altitude', label: 'Altitude load', value: `${alt.toLocaleString()} ft`, score: altitudeScore, level: levelFor(altitudeScore), note: 'Use this as a prompt to consider acclimatization, cardiopulmonary reserve, and exertion demand.' },
      { id: 'air', label: 'Air-quality load', value: `AQI ${air}`, score: airScore, level: levelFor(airScore), note: 'Poor air quality can compound respiratory symptoms, outdoor exertion, and respirator burden.' },
      { id: 'fatigue', label: 'Fatigue / circadian load', value: `${shift}h shift · ${sleep}h sleep · ${zones} TZ`, score: fatigueScore, level: levelFor(fatigueScore), note: 'Long duty periods, restricted sleep, and time-zone displacement can compound alertness and medication effects.' },
      { id: 'ppe', label: 'PPE / equipment burden', value: ['Minimal', 'Light', 'Moderate', 'Heavy'][Math.min(3, Math.max(0, ppeLoad))], score: ppeScore, level: levelFor(ppeScore), note: 'Protective equipment can increase thermal load, breathing resistance, mobility demand, and task fatigue.' },
    ];
  }, [temperature, humidity, altitude, aqi, shiftHours, sleepHours, timeZones, ppe, hydration]);

  const overall = Math.round(factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length);
  const dominant = [...factors].sort((a, b) => b.score - a.score).slice(0, 3);
  const highCount = factors.filter((factor) => factor.score >= 65).length;

  const presets = [
    { label: 'Hot / PPE intensive', apply: () => { setTemperature('96'); setHumidity('64'); setPpe('3'); setHydration('limited'); } },
    { label: 'High altitude', apply: () => { setAltitude('9000'); setTemperature('62'); setPpe('1'); } },
    { label: 'Night / fatigue', apply: () => { setShiftHours('14'); setSleepHours('4.5'); setTimeZones('6'); } },
    { label: 'Poor air quality', apply: () => { setAqi('165'); setTemperature('88'); setHumidity('48'); } },
  ];

  const reset = () => {
    setTemperature('82'); setHumidity('55'); setAltitude('500'); setAqi('45'); setShiftHours('10'); setSleepHours('7'); setTimeZones('0'); setPpe('1'); setHydration('reliable');
  };

  return (
    <div className="external-factors-workbench" data-testid="external-factors">
      <header className="external-factors-header">
        <div>
          <span className="external-kicker"><CloudSun size={14} /> HUMAN PERFORMANCE / EXPOSURE LOAD</span>
          <h1>External Factors</h1>
          <p>Case-specific environmental and operational modifiers that can change tolerance, alertness, exertional demand, or medication effects. Geography and combatant-command intelligence live in AOR Intelligence.</p>
        </div>
        <div className={`external-overall level-${levelFor(overall)}`}>
          <small>COMPOSITE CONTEXT LOAD</small>
          <strong>{overall}</strong>
          <span>{levelFor(overall)} contextual burden</span>
        </div>
      </header>

      <section className="external-summary-strip">
        <article><span>Dominant modifier</span><strong>{dominant[0]?.label ?? 'None'}</strong><small>{Math.round(dominant[0]?.score ?? 0)} / 100</small></article>
        <article><span>High-load factors</span><strong>{highCount}</strong><small>of {factors.length} screened modifiers</small></article>
        <article><span>Hydration access</span><strong>{hydration === 'reliable' ? 'Reliable' : 'Limited'}</strong><small>case-context input</small></article>
        <article><span>PPE burden</span><strong>{['Minimal', 'Light', 'Moderate', 'Heavy'][Math.min(3, Math.max(0, n(ppe)))]}</strong><small>reviewer-supplied scenario</small></article>
      </section>

      <div className="external-main-grid">
        <aside className="external-input-panel">
          <div className="external-panel-head"><span>01</span><div><strong>Exposure scenario</strong><small>Build the work environment, not the geography.</small></div><button onClick={reset}>Reset</button></div>

          <div className="external-presets">
            {presets.map((preset) => <button key={preset.label} onClick={preset.apply}>{preset.label}</button>)}
          </div>

          <div className="external-fields">
            <label><span><Thermometer size={12} /> Temperature °F</span><input value={temperature} onChange={(e) => setTemperature(e.target.value)} inputMode="decimal" /></label>
            <label><span><Wind size={12} /> Humidity %</span><input value={humidity} onChange={(e) => setHumidity(e.target.value)} inputMode="decimal" /></label>
            <label><span><Mountain size={12} /> Altitude ft</span><input value={altitude} onChange={(e) => setAltitude(e.target.value)} inputMode="decimal" /></label>
            <label><span><Gauge size={12} /> Air quality index</span><input value={aqi} onChange={(e) => setAqi(e.target.value)} inputMode="decimal" /></label>
            <label><span><Activity size={12} /> Shift length h</span><input value={shiftHours} onChange={(e) => setShiftHours(e.target.value)} inputMode="decimal" /></label>
            <label><span><Moon size={12} /> Sleep prior 24h</span><input value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} inputMode="decimal" /></label>
            <label><span><Zap size={12} /> Time zones crossed</span><input value={timeZones} onChange={(e) => setTimeZones(e.target.value)} inputMode="decimal" /></label>
            <label><span><ShieldCheck size={12} /> PPE burden</span><select value={ppe} onChange={(e) => setPpe(e.target.value)}><option value="0">Minimal</option><option value="1">Light</option><option value="2">Moderate</option><option value="3">Heavy</option></select></label>
            <label className="wide"><span>Hydration / cooling access</span><select value={hydration} onChange={(e) => setHydration(e.target.value as 'reliable' | 'limited')}><option value="reliable">Reliable</option><option value="limited">Limited / uncertain</option></select></label>
          </div>

          <div className="external-disclaimer"><AlertTriangle size={14} /><p>This is a contextual workload screen, not a clinical threshold, environmental measurement, or clearance determination. Use measured site data and controlling standards when required.</p></div>
        </aside>

        <main className="external-visual-panel">
          <div className="external-panel-head"><span>02</span><div><strong>Human-performance load field</strong><small>Each spoke is independent; compounding matters more than any single card.</small></div></div>
          <div className="external-radar-wrap">
            <svg className="external-radar" viewBox="0 0 520 420" role="img" aria-label="External factor load radar">
              <g className="radar-grid">
                {[70, 120, 170].map((r) => <circle key={r} cx="260" cy="210" r={r} />)}
                {factors.map((_, i) => { const a = (Math.PI * 2 * i) / factors.length - Math.PI / 2; return <line key={i} x1="260" y1="210" x2={260 + Math.cos(a) * 170} y2={210 + Math.sin(a) * 170} />; })}
              </g>
              <polygon className={`radar-load level-${levelFor(overall)}`} points={factors.map((factor, i) => { const a = (Math.PI * 2 * i) / factors.length - Math.PI / 2; const r = 35 + (factor.score / 100) * 135; return `${260 + Math.cos(a) * r},${210 + Math.sin(a) * r}`; }).join(' ')} />
              {factors.map((factor, i) => { const a = (Math.PI * 2 * i) / factors.length - Math.PI / 2; const r = 35 + (factor.score / 100) * 135; return <circle key={factor.id} className={`radar-node level-${factor.level}`} cx={260 + Math.cos(a) * r} cy={210 + Math.sin(a) * r} r="5" />; })}
            </svg>
            <div className="external-radar-core"><Layers3 size={18} /><strong>{overall}</strong><span>context load</span></div>
          </div>
          <div className="external-factor-grid">
            {factors.map((factor) => <article key={factor.id} className={`external-factor-card level-${factor.level}`}><div><span>{factor.label}</span><b>{Math.round(factor.score)}</b></div><strong>{factor.value}</strong><p>{factor.note}</p><i><span style={{ width: `${factor.score}%` }} /></i></article>)}
          </div>
        </main>

        <aside className="external-review-panel">
          <div className="external-panel-head"><span>03</span><div><strong>Reviewer prompts</strong><small>Translate environmental load into case questions.</small></div></div>
          <section className="external-priority">
            <span>TOP MODIFIERS</span>
            {dominant.map((factor, index) => <article key={factor.id}><b>{String(index + 1).padStart(2, '0')}</b><div><strong>{factor.label}</strong><small>{factor.value} · {factor.level}</small></div></article>)}
          </section>
          <section className="external-prompts">
            <span>QUESTIONS TO RESOLVE</span>
            <p>Does the condition or medication reduce heat, cold, altitude, respiratory, or alertness tolerance?</p>
            <p>Will PPE or respiratory protection materially increase physiologic demand?</p>
            <p>Is acclimatization, hydration, recovery time, or medication storage reliable in this scenario?</p>
            <p>Could fatigue or circadian disruption compound dizziness, sedation, cognition, or reaction time?</p>
            <p>Does the controlling program require measured environmental limits or additional surveillance?</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
