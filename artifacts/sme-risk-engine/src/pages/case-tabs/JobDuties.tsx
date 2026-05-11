import { SMECase } from "@/lib/types";

const PHYSICAL_DEMANDS = [
  "Lifting","Carrying","Pushing/Pulling","Climbing","Crawling","Kneeling","Bending",
  "Prolonged Standing","Prolonged Walking","Running","Driving","Operating Machinery",
  "Weapons Handling","Emergency Response","Wearing PPE","Wearing Respirator/SCBA",
  "Wearing Body Armor","Working at Heights","Confined Spaces","Heat Exposure","Cold Exposure"
];
const COGNITIVE_DEMANDS = [
  "High-Stress Decision-Making","Situational Awareness","Emergency Judgment","Shift Work",
  "Night Work","Working Alone","Security-Sensitive Role","Aviation Safety-Sensitive Role",
  "Patient Care","Public Safety","Vehicle Operation","Hazardous Materials"
];
const ENV_DEMANDS = [
  "Austere Location","Remote Site","Limited Medical Care","Extreme Heat","Extreme Cold",
  "Altitude","Poor Air Quality","Infectious Disease Exposure","Vector-Borne Disease Exposure",
  "Food/Water Safety Risk","Civil Unrest/Security Risk","Limited Pharmacy Access",
  "Limited Specialty Care","Evacuation Delays"
];

interface Props { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void; }

export default function JobDuties({ caseData, onUpdate }: Props) {
  const jd = caseData.jobDuties;

  function toggle(list: string[], key: "physicalDemands" | "cognitiveDemands" | "environmentalDemands", item: string) {
    const updated = list.includes(item) ? list.filter(x => x !== item) : [...list, item];
    onUpdate({ jobDuties: { ...jd, [key]: updated } });
  }

  function setField(field: "essentialFunctions" | "clientRequirements" | "agencyStandardNotes", value: string) {
    onUpdate({ jobDuties: { ...jd, [field]: value } });
  }

  function renderDemandGroup(title: string, demands: string[], selected: string[], key: "physicalDemands" | "cognitiveDemands" | "environmentalDemands", color: string) {
    return (
      <div className="glass-card" style={{ padding: "1.25rem" }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, color, marginBottom: "0.875rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.375rem" }}>
          {demands.map(d => (
            <label key={d} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.4rem 0.625rem", borderRadius: "8px", background: selected.includes(d) ? `${color}0f` : "rgba(255,255,255,0.02)", border: `1px solid ${selected.includes(d) ? `${color}35` : "rgba(255,255,255,0.06)"}`, transition: "all 0.15s" }} data-testid={`demand-${d.replace(/\s+/g,"-").toLowerCase()}`}>
              <input type="checkbox" checked={selected.includes(d)} onChange={() => toggle(selected, key, d)} style={{ accentColor: color, flexShrink: 0 }} />
              <span style={{ fontSize: "0.7813rem", color: selected.includes(d) ? color : "rgba(255,255,255,0.55)", fontWeight: selected.includes(d) ? 600 : 400, lineHeight: 1.3 }}>{d}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" };

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: "0.125rem" }}>Job Duties & Essential Functions</h2>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
          Document all essential job functions and occupational demands. These will be cross-referenced with medical conditions in the risk scoring engine.
        </p>
      </div>

      {/* Summary badges */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.8125rem", background: "rgba(180,215,208,0.1)", color: "#b4d7d0", border: "1px solid rgba(180,215,208,0.2)", padding: "0.3rem 0.75rem", borderRadius: "6px", fontWeight: 600 }}>
          {jd.physicalDemands.length} Physical Demands
        </span>
        <span style={{ fontSize: "0.8125rem", background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)", padding: "0.3rem 0.75rem", borderRadius: "6px", fontWeight: 600 }}>
          {jd.cognitiveDemands.length} Cognitive/Safety Demands
        </span>
        <span style={{ fontSize: "0.8125rem", background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", padding: "0.3rem 0.75rem", borderRadius: "6px", fontWeight: 600 }}>
          {jd.environmentalDemands.length} Environmental/Deployment Demands
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginBottom: "1.25rem" }}>
        {renderDemandGroup("Physical Demands", PHYSICAL_DEMANDS, jd.physicalDemands, "physicalDemands", "#b4d7d0")}
        {renderDemandGroup("Cognitive & Safety-Sensitive Demands", COGNITIVE_DEMANDS, jd.cognitiveDemands, "cognitiveDemands", "#a78bfa")}
        {renderDemandGroup("Environmental & Deployment Demands", ENV_DEMANDS, jd.environmentalDemands, "environmentalDemands", "#f59e0b")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={lbl}>Essential Job Functions (Free Text)</label>
            <textarea className="glass-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.875rem", minHeight: "120px", resize: "vertical" }} value={jd.essentialFunctions} onChange={e => setField("essentialFunctions", e.target.value)} placeholder="Describe essential job functions in detail — this will appear in the report..." data-testid="textarea-essential-functions" />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={lbl}>Client / Agency-Specific Requirements</label>
            <textarea className="glass-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.875rem", minHeight: "80px", resize: "vertical" }} value={jd.clientRequirements} onChange={e => setField("clientRequirements", e.target.value)} placeholder="Specific client or agency requirements beyond standard demands..." data-testid="textarea-client-requirements" />
          </div>
          <div>
            <label style={lbl}>Agency Standard / Guideline Notes</label>
            <textarea className="glass-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.875rem", minHeight: "80px", resize: "vertical" }} value={jd.agencyStandardNotes} onChange={e => setField("agencyStandardNotes", e.target.value)} placeholder="Notes on applicable agency standards and how they relate to these duties..." data-testid="textarea-agency-notes" />
          </div>
        </div>
      </div>
    </div>
  );
}
