import { SMECase, CountryRiskProfile } from "@/lib/types";
import { AlertTriangle, Globe } from "lucide-react";

const COUNTRIES = [
  "Afghanistan","Bahrain","Colombia","Djibouti","Egypt","Germany","Iraq","Japan",
  "Jordan","Kenya","Kuwait","Libya","Nigeria","Philippines","Qatar","Saudi Arabia",
  "Somalia","South Korea","Syria","UAE","Uganda","Ukraine","United Kingdom","Yemen","Other"
];

const CLIMATE_RISKS = ["Extreme Heat","Extreme Cold","High Humidity","High Altitude","Desert/Dust","Poor Air Quality"];
const ID_RISKS = ["Malaria","Dengue","Tuberculosis","Diarrheal Illness","Hepatitis A/B/C","Rabies","Typhoid","Meningitis","Other Vector-Borne Disease","Other"];

interface RiskInteraction { title: string; severity: "high" | "moderate"; description: string; }

function detectInteractions(caseData: SMECase, cr: CountryRiskProfile | null): RiskInteraction[] {
  if (!cr) return [];
  const interactions: RiskInteraction[] = [];
  const conditions = caseData.medicalConditions;
  const jobDemands = [...caseData.jobDuties.physicalDemands, ...caseData.jobDuties.cognitiveDemands, ...caseData.jobDuties.environmentalDemands].map(d => d.toLowerCase());

  for (const mc of conditions) {
    const condLower = mc.conditionName.toLowerCase();
    const catLower = mc.category.toLowerCase();

    if (mc.refrigerationNeeded && (cr.pharmacyReliability === "Limited" || cr.localMedicalInfrastructure === "Limited" || cr.localMedicalInfrastructure === "Very Limited" || cr.localMedicalInfrastructure === "Minimal")) {
      interactions.push({ title: `${mc.conditionName} — Medication Refrigeration & Remote Access Risk`, severity: "high", description: `Available records indicate ${mc.conditionName} requires refrigerated medication (${mc.currentMedications}). The selected deployment location (${cr.country}) has ${cr.pharmacyReliability} pharmacy reliability and ${cr.localMedicalInfrastructure} local medical infrastructure. This combination may present a potential medication storage and access risk requiring SME review.` });
    }
    if ((catLower === "respiratory" || condLower.includes("asthma") || condLower.includes("copd")) && (cr.climateRisks.includes("Desert/Dust") || cr.climateRisks.includes("Poor Air Quality"))) {
      interactions.push({ title: `${mc.conditionName} — Respiratory Exacerbation Risk in Dusty/Poor Air Quality Environment`, severity: "high", description: `Available records indicate a history of ${mc.conditionName}. The selected deployment country profile for ${cr.country} includes ${cr.climateRisks.filter(r => r === "Desert/Dust" || r === "Poor Air Quality").join(" and ")}. This may present a potential respiratory exacerbation risk depending on current condition stability, medication access, and job duties involving outdoor or dusty environments.` });
    }
    if ((condLower.includes("seizure") || condLower.includes("epilepsy")) && (cr.localMedicalInfrastructure === "Very Limited" || cr.localMedicalInfrastructure === "Minimal")) {
      interactions.push({ title: `${mc.conditionName} — Emergency Access Risk at Remote Location`, severity: "high", description: `Available records indicate a history of ${mc.conditionName}. The deployment location (${cr.country}) has ${cr.localMedicalInfrastructure} local medical infrastructure. Limited emergency care availability may be occupationally relevant for conditions with potential sudden incapacitation risk.` });
    }
    if ((catLower === "cardiovascular" || condLower.includes("cardiac") || condLower.includes("heart")) && cr.climateRisks.includes("Extreme Heat") && (jobDemands.some(d => d.includes("heat") || d.includes("physical") || d.includes("lifting") || d.includes("emergency")))) {
      interactions.push({ title: `${mc.conditionName} — Cardiovascular Risk Factor: Extreme Heat + Physical Exertion`, severity: "high", description: `Available records indicate a history of ${mc.conditionName}. The selected country profile for ${cr.country} includes extreme heat. The job duties include physical exertion. This combination may present a potential cardiovascular risk factor requiring SME review and possible provider clarification regarding heat and exertion tolerance.` });
    }
    if ((condLower.includes("sleep apnea") || condLower.includes("apnea") || mc.category === "sleep-disorder") && mc.currentMedications?.toLowerCase().includes("cpap") === false && cr.localMedicalInfrastructure !== "Good") {
      interactions.push({ title: `${mc.conditionName} — CPAP/Treatment Continuity Risk at Deployment`, severity: "moderate", description: `Available records indicate a history of ${mc.conditionName} requiring treatment (CPAP). The deployment location (${cr.country}) may have unreliable power or limited equipment support. Treatment continuity risk should be assessed by SME.` });
    }
    if ((catLower === "endocrine-metabolic" || condLower.includes("diabetes")) && cr.climateRisks.includes("Extreme Heat") && mc.currentMedications?.toLowerCase().includes("glipizide")) {
      interactions.push({ title: `${mc.conditionName} — Heat + Sulfonylurea Hypoglycemia Risk`, severity: "high", description: `Available records indicate a history of ${mc.conditionName} treated with a sulfonylurea (${mc.currentMedications}). The selected country (${cr.country}) climate profile includes extreme heat. Heat exposure may increase hypoglycemia risk in individuals on sulfonylurea agents. This may require provider clarification and SME review.` });
    }
    if (mc.emergencyAccessNeeded && (cr.evacuationConcerns || cr.localMedicalInfrastructure === "Very Limited" || cr.localMedicalInfrastructure === "Minimal")) {
      interactions.push({ title: `${mc.conditionName} — Emergency Access Need Identified at Remote Deployment`, severity: "high", description: `Available records indicate ${mc.conditionName} with documented emergency access needs. The deployment location (${cr.country}) has evacuation concerns noted: "${cr.evacuationConcerns || "limited emergency access"}". This represents a potential emergency access risk requiring SME review.` });
    }
  }
  return interactions;
}

interface Props { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void; }

function blankProfile(country: string): CountryRiskProfile {
  return { country, region: "", climateRisks: [], infectiousDiseaseRisks: [], vaccineRequirements: "", medicationAvailability: "", localMedicalInfrastructure: "Limited", evacuationConcerns: "", specialtyCareAvailability: "", pharmacyReliability: "Limited", securityRisk: "Moderate", foodWaterSafety: "Moderate risk", occupationalExposureRisks: "", notes: "", sourceLink: "", lastReviewed: "" };
}

export default function CountryRisk({ caseData, onUpdate }: Props) {
  const cr = caseData.countryRisk;
  const interactions = detectInteractions(caseData, cr);

  function initProfile() {
    onUpdate({ countryRisk: blankProfile(caseData.deploymentCountry || "") });
  }
  function upd(field: keyof CountryRiskProfile, value: unknown) {
    if (!cr) return;
    onUpdate({ countryRisk: { ...cr, [field]: value } });
  }
  function toggleList(listKey: "climateRisks" | "infectiousDiseaseRisks", item: string) {
    if (!cr) return;
    const list = cr[listKey] as string[];
    const updated = list.includes(item) ? list.filter(x => x !== item) : [...list, item];
    onUpdate({ countryRisk: { ...cr, [listKey]: updated } });
  }

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" };
  const inp = { width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8125rem" };

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <Globe size={20} style={{ color: "#b4d7d0" }} />
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff" }}>Deployment Country Risk Module</h2>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
          Document country-specific deployment risk factors. The system will automatically identify potential risk interactions with entered medical conditions.
        </p>
      </div>

      {!cr ? (
        <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
          <Globe size={36} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 1rem" }} />
          <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>No country risk profile entered</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
            {caseData.deploymentCountry ? `Deployment country: ${caseData.deploymentCountry}` : "No deployment country specified in case info"}
          </div>
          <button className="glow-btn" onClick={initProfile} data-testid="btn-init-country-risk">
            Create Country Risk Profile
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Country Information</div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={lbl}>Country</label>
                <select className="glass-input" style={inp} value={cr.country} onChange={e => upd("country", e.target.value)} data-testid="select-country">
                  <option value="">— Select —</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={lbl}>Region</label>
                <input className="glass-input" style={inp} value={cr.region} onChange={e => upd("region", e.target.value)} placeholder="e.g., Middle East, Sub-Saharan Africa" data-testid="input-region" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={lbl}>Local Medical Infrastructure</label>
                  <select className="glass-input" style={inp} value={cr.localMedicalInfrastructure} onChange={e => upd("localMedicalInfrastructure", e.target.value)} data-testid="select-medical-infra">
                    <option>Good</option><option>Limited</option><option>Very Limited</option><option>Minimal</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Pharmacy Reliability</label>
                  <select className="glass-input" style={inp} value={cr.pharmacyReliability} onChange={e => upd("pharmacyReliability", e.target.value)} data-testid="select-pharmacy">
                    <option>Good</option><option>Limited</option><option>Very Limited</option><option>Unreliable</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Security/Civil Unrest Risk</label>
                  <select className="glass-input" style={inp} value={cr.securityRisk} onChange={e => upd("securityRisk", e.target.value)} data-testid="select-security">
                    <option>Low</option><option>Moderate</option><option>High</option><option>Extreme</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Food/Water Safety</label>
                  <select className="glass-input" style={inp} value={cr.foodWaterSafety} onChange={e => upd("foodWaterSafety", e.target.value)} data-testid="select-food-water">
                    <option>Low risk</option><option>Moderate risk</option><option>High risk</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.875rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Climate Risks</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                {CLIMATE_RISKS.map(r => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.375rem 0.625rem", borderRadius: "8px", background: cr.climateRisks.includes(r) ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${cr.climateRisks.includes(r) ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)"}` }} data-testid={`climate-${r.replace(/\s+/g,"-").toLowerCase()}`}>
                    <input type="checkbox" checked={cr.climateRisks.includes(r)} onChange={() => toggleList("climateRisks", r)} style={{ accentColor: "#f59e0b" }} />
                    <span style={{ fontSize: "0.8125rem", color: cr.climateRisks.includes(r) ? "#f59e0b" : "rgba(255,255,255,0.55)", fontWeight: cr.climateRisks.includes(r) ? 600 : 400 }}>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#10b981", marginBottom: "0.875rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Infectious Disease Risks</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                {ID_RISKS.map(r => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.375rem 0.625rem", borderRadius: "8px", background: cr.infectiousDiseaseRisks.includes(r) ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${cr.infectiousDiseaseRisks.includes(r) ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)"}` }} data-testid={`id-risk-${r.replace(/\s+/g,"-").toLowerCase()}`}>
                    <input type="checkbox" checked={cr.infectiousDiseaseRisks.includes(r)} onChange={() => toggleList("infectiousDiseaseRisks", r)} style={{ accentColor: "#10b981" }} />
                    <span style={{ fontSize: "0.8125rem", color: cr.infectiousDiseaseRisks.includes(r) ? "#10b981" : "rgba(255,255,255,0.55)", fontWeight: cr.infectiousDiseaseRisks.includes(r) ? 600 : 400 }}>{r}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Deployment Health Details</div>
              {[
                ["vaccineRequirements", "Vaccine Requirements/Recommendations", "textarea"],
                ["medicationAvailability", "Medication Availability Concerns", "textarea"],
                ["evacuationConcerns", "Emergency Evacuation Concerns", "input"],
                ["specialtyCareAvailability", "Specialty Care Availability", "input"],
                ["occupationalExposureRisks", "Occupational Exposure Risks", "textarea"],
                ["notes", "Country Notes", "textarea"],
                ["sourceLink", "Source Link", "input"],
                ["lastReviewed", "Last Reviewed Date", "date"],
              ].map(([field, label, type]) => (
                <div key={field} style={{ marginBottom: "0.75rem" }}>
                  <label style={lbl}>{label}</label>
                  {type === "textarea" ? (
                    <textarea className="glass-input" style={{ ...inp, minHeight: "60px", resize: "vertical" }} value={(cr as unknown as Record<string, string>)[field]} onChange={e => upd(field as keyof CountryRiskProfile, e.target.value)} data-testid={`country-${field}`} />
                  ) : type === "date" ? (
                    <input type="date" className="glass-input" style={inp} value={(cr as unknown as Record<string, string>)[field]} onChange={e => upd(field as keyof CountryRiskProfile, e.target.value)} data-testid={`country-${field}`} />
                  ) : (
                    <input className="glass-input" style={inp} value={(cr as unknown as Record<string, string>)[field]} onChange={e => upd(field as keyof CountryRiskProfile, e.target.value)} data-testid={`country-${field}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Risk Interactions */}
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Automated Risk Interaction Analysis
              </div>
              {interactions.length === 0 ? (
                <div className="glass-card" style={{ padding: "1rem", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "0.8125rem" }}>
                  No automated risk interactions detected based on current condition and country data.
                </div>
              ) : (
                interactions.map((interaction, idx) => (
                  <div key={idx} className={interaction.severity === "high" ? "risk-flag-card" : "risk-flag-amber"} style={{ marginBottom: "0.75rem", padding: "1rem", borderRadius: "12px" }} data-testid={`risk-interaction-${idx}`}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <AlertTriangle size={14} style={{ color: interaction.severity === "high" ? "#ef4444" : "#f59e0b", flexShrink: 0, marginTop: "1px" }} />
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: interaction.severity === "high" ? "#ef4444" : "#f59e0b" }}>{interaction.title}</div>
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.55, paddingLeft: "1.375rem" }}>{interaction.description}</div>
                    <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", paddingLeft: "1.375rem", marginTop: "0.375rem", fontStyle: "italic" }}>Requires SME review · Based on available documentation</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
