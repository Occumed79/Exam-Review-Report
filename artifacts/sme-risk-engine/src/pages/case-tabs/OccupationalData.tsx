import { SMECase, OccupationalData as OD } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const PRESET_DATA: Record<string, Partial<OD>> = {
  "Firefighter": {
    commonInjuryPatterns: "Cardiovascular events during active fire suppression; musculoskeletal injuries during rescue and extrication; smoke/chemical inhalation; thermal burns; traumatic injuries from structure collapse",
    fatalityRiskFactors: "Sudden cardiac death (leading cause of on-duty fatalities — ~50%); traumatic injury from structure collapse, vehicle accidents, falls; overexertion",
    mskPrevalence: "High — lower back, shoulder, and knee injuries are most prevalent. Overexertion accounts for the largest proportion of lost-time injuries.",
    heatIllnessRisk: "High — thermal stress from structural turnout gear, SCBA, and fire environment. Exacerbated by pre-existing cardiovascular disease.",
    respiratoryRisk: "Moderate-High — smoke and chemical inhalation despite SCBA use; carcinogen exposure; reactive airway disease.",
    transportationRisk: "Moderate — emergency vehicle operations; PPE-related driving impairment.",
    violenceRisk: "Low-Moderate",
    slipsTripsFalls: "Moderate — uneven terrain, smoke-filled structures, wet surfaces.",
    overexertion: "High — highest recorded injury category for firefighters.",
    hazardousExposure: "High — chemical, biological, and radiological potential; carcinogen exposure is well-documented.",
    source: "IAFF / NIOSH / BLS CFOI / NFPA Fire Data",
    sourceDate: "2023"
  },
  "Driver / Commercial Vehicle Operator": {
    commonInjuryPatterns: "Musculoskeletal from prolonged sitting; eye strain; stress-related conditions; injuries from vehicle collisions",
    fatalityRiskFactors: "Vehicle crashes due to fatigue, medical events behind the wheel, impaired reaction time, sudden incapacitation",
    mskPrevalence: "Moderate — lower back and neck are most prevalent from prolonged sitting and vibration.",
    heatIllnessRisk: "Low-Moderate",
    respiratoryRisk: "Low — diesel exhaust exposure possible for some drivers.",
    transportationRisk: "High — primary occupational risk. Sudden incapacitation behind the wheel is a critical safety concern.",
    violenceRisk: "Moderate — public transit operators face passenger-related violence risk.",
    slipsTripsFalls: "Low-Moderate",
    overexertion: "Low",
    hazardousExposure: "Low",
    source: "FMCSA / BLS / NIOSH",
    sourceDate: "2023"
  },
  "Aviation Safety-Sensitive": {
    commonInjuryPatterns: "Musculoskeletal from prolonged sitting in cockpit; barotrauma; noise-induced hearing loss; vision-related injuries",
    fatalityRiskFactors: "Sudden incapacitation in flight; psychiatric crisis at altitude; medication impairment of cognition and reaction time",
    mskPrevalence: "Moderate — neck, back, and shoulder from cockpit ergonomics.",
    heatIllnessRisk: "Low",
    respiratoryRisk: "Low-Moderate — altitude hypoxia considerations; pressurization.",
    transportationRisk: "Extreme — aviation safety is the primary concern. Medical events causing incapacitation at altitude are catastrophic.",
    violenceRisk: "Low (controlled environment)",
    slipsTripsFalls: "Low",
    overexertion: "Low",
    hazardousExposure: "Moderate — radiation at altitude; fuel/chemical exposure during maintenance roles.",
    source: "FAA / NTSB / ICAO",
    sourceDate: "2023"
  },
  "Remote/Austere Deployment": {
    commonInjuryPatterns: "Trauma from security incidents; heat illness; infectious disease; gastrointestinal illness; musculoskeletal from terrain; mental health conditions",
    fatalityRiskFactors: "Security incidents; delayed emergency evacuation; untreated chronic disease exacerbations; heat illness in extreme climate",
    mskPrevalence: "Moderate-High — physical demands of austere environments; carrying loads.",
    heatIllnessRisk: "High — extreme heat is a primary environmental risk in many deployment locations.",
    respiratoryRisk: "Moderate — dust, poor air quality, and particulate exposure in many deployment regions.",
    transportationRisk: "High — transportation incidents are a leading cause of contractor/military personnel fatalities in austere settings.",
    violenceRisk: "High — security-sensitive environment with elevated risk.",
    slipsTripsFalls: "Moderate — uneven terrain, low-visibility conditions.",
    overexertion: "Moderate",
    hazardousExposure: "Moderate-High — depending on location and role.",
    source: "DoD / CENTCOM / Contractor Health Data",
    sourceDate: "2023"
  },
  "Construction / Physical Labor": {
    commonInjuryPatterns: "Falls from height; struck-by incidents; caught-in/between; overexertion; musculoskeletal injuries; heat illness",
    fatalityRiskFactors: "Falls account for ~40% of construction fatalities; struck-by; electrical; caught-in/between (OSHA 'Fatal Four')",
    mskPrevalence: "High — back, shoulder, knee injuries from lifting, carrying, kneeling, and overexertion.",
    heatIllnessRisk: "High — outdoor work in summer heat; PPE burden.",
    respiratoryRisk: "High — dust (silica, asbestos), fumes, chemicals.",
    transportationRisk: "Moderate — heavy equipment and vehicle operations.",
    violenceRisk: "Low",
    slipsTripsFalls: "High — falls are leading fatality cause.",
    overexertion: "High",
    hazardousExposure: "High — chemical, silica, asbestos, lead exposure in construction.",
    source: "OSHA / BLS CFOI / NIOSH",
    sourceDate: "2023"
  },
  "Healthcare / Patient Care": {
    commonInjuryPatterns: "Musculoskeletal from patient handling; needlestick and sharps injuries; workplace violence; infectious disease exposure; stress-related",
    fatalityRiskFactors: "Workplace violence (nurses/ED workers); infectious disease exposure; vehicle accidents for home health workers",
    mskPrevalence: "High — back and shoulder injuries from patient handling and lifting are the most prevalent.",
    heatIllnessRisk: "Low",
    respiratoryRisk: "Moderate — airborne infectious disease exposure; chemical disinfectant exposure.",
    transportationRisk: "Moderate — home health workers face significant MVA risk.",
    violenceRisk: "High — healthcare workers experience the highest rates of workplace violence of any industry.",
    slipsTripsFalls: "Moderate",
    overexertion: "High",
    hazardousExposure: "Moderate — chemotherapy agents, disinfectants, anesthetic gases.",
    source: "BLS / NIOSH / OSHA",
    sourceDate: "2023"
  },
  "Law Enforcement": {
    commonInjuryPatterns: "Musculoskeletal from use of force; transportation incidents; struck-by; assault injuries; cumulative stress/PTSD",
    fatalityRiskFactors: "Assaults (firearms leading cause); transportation accidents; overexertion; stress-related sudden cardiac events",
    mskPrevalence: "High — lower back, knee, shoulder from use-of-force, vehicle operations, and prolonged sitting.",
    heatIllnessRisk: "Moderate — exacerbated by body armor and heat exposure.",
    respiratoryRisk: "Low-Moderate",
    transportationRisk: "High — vehicle pursuits and emergency response driving.",
    violenceRisk: "High — occupational assault risk is a primary concern.",
    slipsTripsFalls: "Moderate",
    overexertion: "Moderate",
    hazardousExposure: "Moderate — chemical exposure, fentanyl exposure risk.",
    source: "BLS / LEOKA (FBI) / NIOSH / Officer Down Memorial",
    sourceDate: "2023"
  },
  "General Office / Administrative": {
    commonInjuryPatterns: "Musculoskeletal from prolonged sitting and repetitive motion; eye strain; stress-related conditions; slips/trips",
    fatalityRiskFactors: "Transportation accidents; workplace violence (rare); falls",
    mskPrevalence: "Moderate — carpal tunnel, neck, back from repetitive motion and ergonomic issues.",
    heatIllnessRisk: "Low",
    respiratoryRisk: "Low",
    transportationRisk: "Low",
    violenceRisk: "Low",
    slipsTripsFalls: "Low",
    overexertion: "Low",
    hazardousExposure: "Low",
    source: "BLS",
    sourceDate: "2023"
  }
};

const JOB_CATEGORIES = Object.keys(PRESET_DATA);

const RISK_FIELDS: { key: keyof OD; label: string; color: string }[] = [
  { key: "heatIllnessRisk", label: "Heat Illness", color: "#ef4444" },
  { key: "respiratoryRisk", label: "Respiratory", color: "#06b6d4" },
  { key: "transportationRisk", label: "Transportation", color: "#f59e0b" },
  { key: "violenceRisk", label: "Violence", color: "#c4a5b8" },
  { key: "slipsTripsFalls", label: "Slips/Falls", color: "#a78bfa" },
  { key: "overexertion", label: "Overexertion", color: "#f97316" },
  { key: "hazardousExposure", label: "Hazardous Exp.", color: "#10b981" },
];

function parseRiskLevel(text: string): number {
  const t = text.toLowerCase();
  if (t.includes("extreme")) return 4;
  if (t.includes("high") && t.includes("moderate")) return 3;
  if (t.includes("high")) return 3;
  if (t.includes("moderate")) return 2;
  if (t.includes("low") && t.includes("moderate")) return 1.5;
  if (t.includes("low")) return 1;
  return 0;
}

interface Props { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void; }

function blankOD(): OD {
  return { jobCategory: "", commonInjuryPatterns: "", fatalityRiskFactors: "", mskPrevalence: "", heatIllnessRisk: "", respiratoryRisk: "", transportationRisk: "", violenceRisk: "", slipsTripsFalls: "", overexertion: "", hazardousExposure: "", source: "", sourceDate: "", notes: "" };
}

export default function OccupationalData({ caseData, onUpdate }: Props) {
  const od = caseData.occupationalData;

  function initOD(category: string) {
    const preset = PRESET_DATA[category] ?? {};
    onUpdate({ occupationalData: { ...blankOD(), jobCategory: category, ...preset } });
  }
  function upd(field: keyof OD, value: string) {
    if (!od) return;
    onUpdate({ occupationalData: { ...od, [field]: value } });
  }

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" };
  const inp = { width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8125rem" };

  const chartData = od ? RISK_FIELDS.map(f => ({ name: f.label, value: parseRiskLevel((od[f.key] as string) || ""), color: f.color })) : [];

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: "0.125rem" }}>Occupational Injury Data Module</h2>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
          Document occupational injury context for the assigned job category. Select a preset or enter custom data. Source: BLS/OSHA/NIOSH public data references.
        </p>
      </div>

      {!od ? (
        <div>
          <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1rem" }}>Select Job Category to Load Preset Data</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {JOB_CATEGORIES.map(cat => (
                <button key={cat} className="glow-btn glow-btn-secondary" onClick={() => initOD(cat)} data-testid={`btn-load-preset-${cat.replace(/\s+/g,"-").toLowerCase()}`} style={{ padding: "0.625rem 0.75rem", fontSize: "0.8125rem", textAlign: "left" }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem" }}>Or <button className="glow-btn glow-btn-secondary" onClick={() => initOD("")} style={{ fontSize: "0.8125rem", padding: "0.3rem 0.75rem", display: "inline" }} data-testid="btn-blank-od">start with a blank entry</button></div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem" }}>
          <div>
            <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Job Category</label>
                  <select className="glass-input" style={inp} value={od.jobCategory} onChange={e => { initOD(e.target.value); }} data-testid="select-job-category">
                    <option value="">— Custom —</option>
                    {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Source</label>
                  <input className="glass-input" style={inp} value={od.source} onChange={e => upd("source", e.target.value)} data-testid="input-od-source" />
                </div>
                <div style={{ width: "140px" }}>
                  <label style={lbl}>Source Date</label>
                  <input className="glass-input" style={inp} value={od.sourceDate} onChange={e => upd("sourceDate", e.target.value)} data-testid="input-od-source-date" />
                </div>
              </div>
              {[
                ["commonInjuryPatterns", "Common Injury Patterns"],
                ["fatalityRiskFactors", "Fatality Risk Factors"],
                ["mskPrevalence", "Musculoskeletal Injury Prevalence"],
              ].map(([field, label]) => (
                <div key={field} style={{ marginBottom: "0.75rem" }}>
                  <label style={lbl}>{label}</label>
                  <textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={(od as unknown as Record<string, string>)[field]} onChange={e => upd(field as keyof OD, e.target.value)} data-testid={`od-${field}`} />
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Specific Risk Categories</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {RISK_FIELDS.map(f => (
                  <div key={f.key}>
                    <label style={{ ...lbl, color: f.color }}>{f.label} Risk</label>
                    <input className="glass-input" style={inp} value={(od as unknown as Record<string, string>)[f.key]} onChange={e => upd(f.key as keyof OD, e.target.value)} data-testid={`od-${f.key}`} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "0.875rem" }}>
                <label style={lbl}>Additional Notes</label>
                <textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={od.notes} onChange={e => upd("notes", e.target.value)} data-testid="od-notes" />
              </div>
            </div>
          </div>

          <div>
            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "0.875rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Risk Level Overview</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" domain={[0, 4]} hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }} width={90} />
                  <Tooltip formatter={(v) => {
                    const levels = ["None","Low","Moderate","Moderate-High","High","Extreme"];
                    return [levels[Math.round(Number(v))] || v, "Risk Level"];
                  }} contentStyle={{ background: "rgba(10,15,30,0.9)", border: "1px solid rgba(180,215,208,0.2)", borderRadius: "8px", fontSize: "0.75rem", color: "#fff" }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "0.5rem" }}>
                Based on available BLS/OSHA/NIOSH reference data · For contextual SME support only
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
