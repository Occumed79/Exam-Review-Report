import { useState } from "react";
import { SMECase, RiskCategoryScore, RiskScore } from "@/lib/types";
import { TrendingUp, RefreshCw, AlertTriangle } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { generateId } from "@/lib/store";

const SCORE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "0": { label: "None", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  "1": { label: "Low", color: "#86efac", bg: "rgba(134,239,172,0.1)" },
  "2": { label: "Moderate", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  "3": { label: "High", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  "U": { label: "Unable to Score", color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
};

const CATEGORIES = [
  "Cardiovascular / Cardiac Risk",
  "Neurologic / Seizure / Syncope Risk",
  "Psychiatric / Behavioral Health Risk",
  "Musculoskeletal / Functional Limitation",
  "Respiratory / Respirator Tolerance",
  "Medication Side Effect Risk",
  "Sudden Incapacitation Risk",
  "Deployment / Environmental Risk",
  "Documentation / Evidence Quality",
  "Health Equity / Access Barrier Impact",
];

function autoScore(c: SMECase): RiskCategoryScore[] {
  const scores: RiskCategoryScore[] = [];
  const conditions = c.medicalConditions;
  const injuries = c.injuries;
  const jobDemands = [...c.jobDuties.physicalDemands, ...c.jobDuties.cognitiveDemands, ...c.jobDuties.environmentalDemands].map(d => d.toLowerCase());
  const countryRisk = c.countryRisk;

  // Cardiovascular
  const cvConditions = conditions.filter(m => m.category === "cardiovascular");
  if (cvConditions.length > 0) {
    const uncontrolled = cvConditions.filter(m => m.status === "uncontrolled" || m.status === "active").length;
    const incapRisk = cvConditions.filter(m => m.incapacitationRisk === "Yes" || m.incapacitationRisk === "Possible").length;
    const heatExposure = jobDemands.some(d => d.includes("heat")) || (countryRisk?.climateRisks.includes("Extreme Heat") ?? false);
    let score: RiskScore = 1;
    let why = "Cardiovascular history identified.";
    if (uncontrolled > 0) { score = 3; why = "Uncontrolled cardiovascular condition identified."; }
    else if (incapRisk > 0 && heatExposure) { score = 3; why = "Cardiovascular history with incapacitation risk + heat exposure in job duties."; }
    else if (incapRisk > 0) { score = 2; why = "Cardiovascular history with documented incapacitation concern."; }
    const missing = cvConditions.filter(m => !m.providerQuote).length > 0 ? "Cardiology documentation and provider statement on functional capacity may be absent" : "";
    scores.push({ category: "Cardiovascular / Cardiac Risk", score, whyFlagged: why, supportingEvidence: cvConditions.map(m => m.conditionName).join("; "), missingInformation: missing, jobRelevance: heatExposure ? "Heat/exertion demands may increase cardiovascular stress" : "Physical exertion demands identified", guidelineRelevance: "NFPA 1582, DOT/FMCSA medical standards, employer cardiovascular requirements", environmentRelevance: heatExposure ? "Heat exposure noted in job duties or deployment country" : "", smeQuestion: "Does the cardiovascular history represent a meaningful safety concern given the documented job demands?", suggestedFollowUp: missing ? "Cardiology evaluation; stress test; provider functional capacity statement" : "Review cardiology documentation for completeness" });
  }

  // Neurologic
  const neuroConditions = conditions.filter(m => m.category === "neurologic");
  if (neuroConditions.length > 0) {
    const seizure = neuroConditions.filter(m => m.conditionName.toLowerCase().includes("seizure") || m.conditionName.toLowerCase().includes("epilepsy"));
    const syncope = neuroConditions.filter(m => m.conditionName.toLowerCase().includes("syncope"));
    const safetySensitive = jobDemands.some(d => d.includes("vehicle") || d.includes("driving") || d.includes("aviation") || d.includes("height") || d.includes("machinery") || d.includes("safety"));
    let score: RiskScore = 1;
    let why = "Neurologic history identified.";
    if (seizure.length > 0 && safetySensitive) { score = 3; why = "Seizure disorder history identified in safety-sensitive role."; }
    else if (seizure.length > 0) { score = 2; why = "Seizure disorder history identified."; }
    else if (syncope.length > 0 && safetySensitive) { score = 2; why = "Syncope history identified in safety-sensitive role."; }
    const missing = neuroConditions.filter(m => !m.providerQuote).length > 0 ? "Neurology evaluation documentation may be incomplete" : "";
    scores.push({ category: "Neurologic / Seizure / Syncope Risk", score, whyFlagged: why, supportingEvidence: neuroConditions.map(m => `${m.conditionName} (${m.status})`).join("; "), missingInformation: missing, jobRelevance: safetySensitive ? "Safety-sensitive role identified in job demands" : "Review job demands for safety-sensitive functions", guidelineRelevance: "FAA medical standards; DOT/FMCSA; NFPA 1582; sudden incapacitation standards", environmentRelevance: "", smeQuestion: "Is the neurologic history stable and well-documented to support a safety-sensitive role determination?", suggestedFollowUp: "Neurology clearance letter; EEG if applicable; drug level documentation; seizure-free period confirmation" });
  }

  // Psychiatric
  const psych = conditions.filter(m => m.category === "psychiatric");
  if (psych.length > 0) {
    const active = psych.filter(m => m.status === "active" || m.status === "uncontrolled").length;
    scores.push({ category: "Psychiatric / Behavioral Health Risk", score: active > 0 ? 2 : 1, whyFlagged: active > 0 ? "Active psychiatric condition identified." : "Psychiatric history identified.", supportingEvidence: psych.map(m => m.conditionName).join("; "), missingInformation: psych.filter(m => !m.providerQuote).length > 0 ? "Mental health provider documentation may be incomplete" : "", jobRelevance: "Assess stability in context of job demands and environment", guidelineRelevance: "Applicable mental health standards per exam type", environmentRelevance: c.deploymentCountry ? "Deployment environment may present additional psychological stressors" : "", smeQuestion: "Is the psychiatric history stable and well-documented to support the occupation?", suggestedFollowUp: "Mental health provider clearance; stability assessment; medication review for safety-relevant side effects" });
  }

  // MSK
  const highPainInjuries = injuries.filter(i => i.residualPain >= 4);
  const physicalDemands = jobDemands.some(d => d.includes("lifting") || d.includes("carrying") || d.includes("climbing") || d.includes("crawling"));
  if (highPainInjuries.length > 0 || injuries.filter(i => i.residualWeakness === "Moderate" || i.residualWeakness === "Severe").length > 0) {
    scores.push({ category: "Musculoskeletal / Functional Limitation", score: physicalDemands ? 2 : 1, whyFlagged: "Residual musculoskeletal limitation identified.", supportingEvidence: highPainInjuries.map(i => `${i.injuryType} — pain ${i.residualPain}/10`).join("; "), missingInformation: injuries.filter(i => i.documentationConfidence === "missing" || i.documentationConfidence === "unclear").length > 0 ? "Some injury records have unclear or missing documentation" : "", jobRelevance: physicalDemands ? "Physical demands identified including lifting, carrying, climbing" : "Review physical demands for musculoskeletal relevance", guidelineRelevance: "BLS injury data; job-specific physical fitness standards", environmentRelevance: "", smeQuestion: "Do the documented functional limitations represent a meaningful concern for the specified physical job demands?", suggestedFollowUp: "Functional capacity evaluation if available; current treating provider statement; PT discharge summary" });
  }

  // Respiratory
  const resp = conditions.filter(m => m.category === "respiratory");
  const respirator = jobDemands.some(d => d.includes("respirator") || d.includes("scba") || d.includes("dust") || d.includes("air"));
  if (resp.length > 0) {
    scores.push({ category: "Respiratory / Respirator Tolerance", score: respirator ? 2 : 1, whyFlagged: resp[0].status === "uncontrolled" ? "Uncontrolled respiratory condition identified." : "Respiratory history identified.", supportingEvidence: resp.map(m => m.conditionName).join("; "), missingInformation: resp.filter(m => !m.providerQuote).length > 0 ? "Pulmonary function testing results may be absent" : "", jobRelevance: respirator ? "Respirator/SCBA use or dust exposure identified in job demands" : "No respiratory-specific demands identified", guidelineRelevance: "NIOSH respirator clearance; NFPA 1582; OSHA respiratory standard", environmentRelevance: countryRisk?.climateRisks.includes("Desert/Dust") ? "Dust/sand exposure at deployment location" : "", smeQuestion: "Is pulmonary function documented sufficient to support respirator use and job demands?", suggestedFollowUp: "Spirometry/PFT; provider statement on respirator tolerance" });
  }

  // Medication risk
  const medConditions = conditions.filter(m => m.medicationSideEffects);
  const sedating = conditions.filter(m => {
    const meds = m.currentMedications.toLowerCase();
    return meds.includes("levetiracetam") || meds.includes("keppra") || meds.includes("diazepam") || meds.includes("lorazepam") || meds.includes("oxycodone") || meds.includes("morphine") || meds.includes("ambien") || meds.includes("benzodiazepine");
  });
  if (medConditions.length > 0 || sedating.length > 0) {
    scores.push({ category: "Medication Side Effect Risk", score: sedating.length > 0 ? 2 : 1, whyFlagged: sedating.length > 0 ? "Potentially sedating medication identified that may be relevant to safety-sensitive duties." : "Medication side effects documented.", supportingEvidence: conditions.filter(m => m.currentMedications).map(m => `${m.currentMedications} (${m.conditionName})`).join("; "), missingInformation: "Complete medication list with sedation/impairment potential should be reviewed", jobRelevance: "Medication side effects should be evaluated in context of safety-sensitive job demands", guidelineRelevance: "DOT/FMCSA; FAA; NFPA 1582 medication guidelines", environmentRelevance: countryRisk ? `Medication availability at ${countryRisk.country} should be confirmed` : "", smeQuestion: "Do any current medications represent a sedation, impairment, or access risk relevant to job demands?", suggestedFollowUp: "Complete medication review; provider statement on side effect profile and safety-sensitive duty tolerance" });
  }

  // Sudden incapacitation
  const incapRisk = conditions.filter(m => m.incapacitationRisk === "Yes" || m.incapacitationRisk === "Possible");
  if (incapRisk.length > 0) {
    const safetyCritical = jobDemands.some(d => d.includes("vehicle") || d.includes("height") || d.includes("aviation") || d.includes("aircraft") || d.includes("machinery") || d.includes("emergency") || d.includes("firefighter"));
    scores.push({ category: "Sudden Incapacitation Risk", score: safetyCritical ? 3 : 2, whyFlagged: `Incapacitation risk flagged for ${incapRisk.length} condition(s) in ${safetyCritical ? "safety-critical" : "potentially safety-sensitive"} role.`, supportingEvidence: incapRisk.map(m => `${m.conditionName} — incapacitation risk: ${m.incapacitationRisk}`).join("; "), missingInformation: "Provider documentation of incapacitation risk may require additional specificity", jobRelevance: safetyCritical ? "Safety-critical role identified — sudden incapacitation could endanger others" : "Safety-sensitive functions identified", guidelineRelevance: "Sudden incapacitation standards per exam type (NFPA, FAA, DOT/FMCSA, etc.)", environmentRelevance: "", smeQuestion: "Does the level of incapacitation risk represent an unacceptable safety concern given the documented job functions and applicable standards?", suggestedFollowUp: "Condition-specific specialist evaluation; provider statement on incapacitation risk probability; current status documentation" });
  }

  // Deployment / environmental
  if (c.deploymentCountry && countryRisk) {
    const highRisk = countryRisk.localMedicalInfrastructure === "Very Limited" || countryRisk.localMedicalInfrastructure === "Minimal" || countryRisk.securityRisk === "High" || countryRisk.securityRisk === "Extreme";
    const chronics = conditions.filter(m => m.status === "active" || m.status === "stable").length > 0;
    let score: RiskScore = 1;
    if (highRisk && chronics) score = 3;
    else if (highRisk || chronics) score = 2;
    scores.push({ category: "Deployment / Environmental Risk", score, whyFlagged: `Deployment to ${countryRisk.country} with ${countryRisk.localMedicalInfrastructure} medical infrastructure.`, supportingEvidence: `Country: ${countryRisk.country}; Medical infrastructure: ${countryRisk.localMedicalInfrastructure}; Security: ${countryRisk.securityRisk}`, missingInformation: "Detailed medication supply plan and emergency protocol documentation may be needed", jobRelevance: "Deployment environment requires self-sufficiency for chronic condition management", guidelineRelevance: "MOD deployment standards; CDC travel health; client deployment requirements", environmentRelevance: `Climate: ${countryRisk.climateRisks.join(", ") || "Not documented"}; Infectious disease: ${countryRisk.infectiousDiseaseRisks.join(", ") || "Not documented"}`, smeQuestion: "Can the identified conditions be safely managed in the deployment environment with available medical resources?", suggestedFollowUp: "Pre-deployment medication supply plan; emergency contact protocol; specialist clearance for deployment" });
  }

  // Documentation quality
  const poorDocs = conditions.filter(m => !m.providerQuote && m.status !== "resolved").length;
  const injuryDocGaps = injuries.filter(i => i.documentationConfidence === "missing" || i.documentationConfidence === "unclear").length;
  if (poorDocs > 0 || injuryDocGaps > 0) {
    scores.push({ category: "Documentation / Evidence Quality", score: poorDocs + injuryDocGaps >= 3 ? 2 : 1, whyFlagged: `${poorDocs + injuryDocGaps} record(s) with incomplete or missing documentation.`, supportingEvidence: `${poorDocs} condition(s) missing provider quotes; ${injuryDocGaps} injury record(s) with poor documentation confidence`, missingInformation: conditions.filter(m => !m.providerQuote).map(m => `Provider documentation for: ${m.conditionName}`).join("; "), jobRelevance: "Documentation gaps limit ability to assess functional relevance of medical findings", guidelineRelevance: "All applicable standards require adequate documentation for determination", environmentRelevance: "", smeQuestion: "Is the available documentation adequate to support a reasoned SME determination, or should additional records be obtained?", suggestedFollowUp: "Request outstanding records; identify specific providers to contact; document rationale for proceeding with available information" });
  }

  // Health equity
  if (c.healthEquity) {
    const he = c.healthEquity;
    const barriers = [he.transportationBarriers, he.medicationAffordability, he.languageSupport, he.healthLiteracySupport].filter(Boolean).length;
    if (barriers > 0 || he.followUpFeasibility === "Difficult") {
      scores.push({ category: "Health Equity / Access Barrier Impact", score: "U", whyFlagged: `${barriers} access barrier(s) identified; follow-up feasibility: ${he.followUpFeasibility}.`, supportingEvidence: he.documentationBarriers || "See health equity module for details", missingInformation: "Barrier details may not be fully documented", jobRelevance: "Access barriers may affect documentation completeness — not an adverse medical finding", guidelineRelevance: "Anti-discrimination requirements under ADA, EEOC, and applicable state/federal law", environmentRelevance: "", smeQuestion: "Do identified access barriers explain any documentation gaps, and have support recommendations been documented?", suggestedFollowUp: he.supportRecommendations || "Document support recommendations in health equity module" });
    }
  }

  return scores;
}

interface Props { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void; }

export default function RiskScoring({ caseData, onUpdate }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function runAutoScore() {
    const scores = autoScore(caseData);
    onUpdate({ riskScores: scores });
  }

  function updateScore(idx: number, field: keyof RiskCategoryScore, value: unknown) {
    const updated = caseData.riskScores.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    onUpdate({ riskScores: updated });
  }

  function addCustom() {
    onUpdate({ riskScores: [...caseData.riskScores, { category: "Custom Risk Category", score: "U", whyFlagged: "", supportingEvidence: "", missingInformation: "", jobRelevance: "", guidelineRelevance: "", environmentRelevance: "", smeQuestion: "", suggestedFollowUp: "" }] });
  }

  function remove(idx: number) {
    onUpdate({ riskScores: caseData.riskScores.filter((_, i) => i !== idx) });
  }

  const radarData = caseData.riskScores.map(s => ({
    subject: s.category.split("/")[0].trim(),
    value: s.score === "U" ? 1 : (s.score as number)
  }));

  const highCount = caseData.riskScores.filter(s => s.score === 3).length;
  const modCount = caseData.riskScores.filter(s => s.score === 2).length;
  const unknownCount = caseData.riskScores.filter(s => s.score === "U").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: "0.125rem" }}>Risk Scoring Engine</h2>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
            Auto-scores based on entered case data, or edit scores and rationale manually. Scores = 0 (None) / 1 (Low) / 2 (Moderate) / 3 (High) / U (Unable to score).
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button className="glow-btn glow-btn-secondary" onClick={addCustom} data-testid="btn-add-risk-category" style={{ fontSize: "0.8125rem", padding: "0.5rem 0.875rem" }}>+ Add Category</button>
          <button className="glow-btn" onClick={runAutoScore} data-testid="btn-auto-score" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshCw size={14} />
            Auto-Score from Case Data
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.25rem", marginBottom: "1.25rem" }}>
        {/* Summary cards */}
        <div style={{ display: "flex", gap: "0.875rem" }}>
          {[
            { label: "High Risk (3)", count: highCount, color: "#ef4444" },
            { label: "Moderate (2)", count: modCount, color: "#f59e0b" },
            { label: "Unknown/U", count: unknownCount, color: "#9ca3af" },
            { label: "Total Scored", count: caseData.riskScores.length, color: "#00d4ff" },
          ].map(({ label, count, color }) => (
            <div key={label} className="glass-card" style={{ padding: "1rem", flex: 1 }}>
              <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>{label}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
            </div>
          ))}
        </div>

        {/* Radar */}
        {radarData.length > 0 && (
          <div className="glass-card" style={{ padding: "0.875rem" }}>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Risk Profile</div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData} outerRadius={65}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: "rgba(255,255,255,0.4)" }} />
                <Radar dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.9)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "0.75rem", color: "#fff" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {highCount > 0 && (
        <div className="risk-flag-card" style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
            <AlertTriangle size={14} style={{ color: "#ef4444" }} />
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#ef4444" }}>{highCount} High-Risk Category{highCount > 1 ? "s" : ""} Identified — SME Review Required</span>
          </div>
          {caseData.riskScores.filter(s => s.score === 3).map((s, i) => (
            <div key={i} style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.65)", padding: "0.25rem 0", borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
              <strong>{s.category}:</strong> {s.whyFlagged}
            </div>
          ))}
        </div>
      )}

      {caseData.riskScores.length === 0 ? (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
          <TrendingUp size={40} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 1rem" }} />
          <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem", fontSize: "0.9375rem" }}>No risk scores generated yet</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem", marginBottom: "1.5rem" }}>Add medical conditions, job duties, and other case data first, then click "Auto-Score from Case Data"</div>
          <button className="glow-btn" onClick={runAutoScore} data-testid="btn-auto-score-empty" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshCw size={14} />
            Auto-Score Now
          </button>
        </div>
      ) : (
        caseData.riskScores.map((s, idx) => {
          const conf = SCORE_CONFIG[String(s.score)];
          const isOpen = expanded === `${idx}`;
          return (
            <div key={idx} className="glass-card" style={{ marginBottom: "0.75rem", overflow: "hidden" }} data-testid={`risk-card-${idx}`}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1.25rem", cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : `${idx}`)}>
                <div style={{ width: "60px", height: "32px", borderRadius: "8px", background: conf.bg, border: `1px solid ${conf.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 800, color: conf.color }}>{String(s.score)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#fff", marginBottom: "0.125rem" }}>{s.category}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.whyFlagged}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: conf.color }}>{conf.label}</span>
                  <button className="glow-btn glow-btn-secondary" onClick={e => { e.stopPropagation(); remove(idx); }} style={{ padding: "0.25rem 0.5rem" }}>✕</button>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Category</label>
                      <input className="glass-input" style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }} value={s.category} onChange={e => updateScore(idx, "category", e.target.value)} data-testid={`risk-category-${idx}`} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Score</label>
                      <select className="glass-input" style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }} value={String(s.score)} onChange={e => updateScore(idx, "score", e.target.value === "U" ? "U" : Number(e.target.value) as RiskScore)} data-testid={`risk-score-${idx}`}>
                        <option value="0">0 — None</option>
                        <option value="1">1 — Low</option>
                        <option value="2">2 — Moderate</option>
                        <option value="3">3 — High</option>
                        <option value="U">U — Unable to Score</option>
                      </select>
                    </div>
                  </div>
                  {[
                    ["whyFlagged","Why Flagged","textarea"],
                    ["supportingEvidence","Supporting Evidence","textarea"],
                    ["missingInformation","Missing Information","textarea"],
                    ["jobRelevance","Job Duty Relevance","input"],
                    ["guidelineRelevance","Guideline Relevance","input"],
                    ["environmentRelevance","Environmental Relevance","input"],
                    ["smeQuestion","SME Question for Review","textarea"],
                    ["suggestedFollowUp","Suggested Follow-Up","textarea"],
                  ].map(([field, label, type]) => (
                    <div key={field} style={{ marginTop: "0.75rem" }}>
                      <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</label>
                      {type === "textarea" ? (
                        <textarea className="glass-input" style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", minHeight: "70px", resize: "vertical" }} value={(s as unknown as Record<string, unknown>)[field] as string} onChange={e => updateScore(idx, field as keyof RiskCategoryScore, e.target.value)} data-testid={`risk-${field}-${idx}`} />
                      ) : (
                        <input className="glass-input" style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }} value={(s as unknown as Record<string, unknown>)[field] as string} onChange={e => updateScore(idx, field as keyof RiskCategoryScore, e.target.value)} data-testid={`risk-${field}-${idx}`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
