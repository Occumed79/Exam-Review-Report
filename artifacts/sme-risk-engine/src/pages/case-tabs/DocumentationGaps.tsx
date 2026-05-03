import { useState } from "react";
import { SMECase, DocumentationGap } from "@/lib/types";
import { FileSearch, RefreshCw, Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/store";

const SEV_META = {
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  moderate: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  low: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
};

function autoDetect(c: SMECase): DocumentationGap[] {
  const gaps: DocumentationGap[] = [];
  const conditions = c.medicalConditions;
  const injuries = c.injuries;

  for (const mc of conditions) {
    if (!mc.providerQuote) {
      gaps.push({ id: generateId(), description: `Missing provider documentation quote for: ${mc.conditionName}`, category: "Provider Documentation", severity: "high", relatedCondition: mc.conditionName, providerQuestion: `Can the treating provider for ${mc.conditionName} provide a formal statement addressing current status, functional limitations, and relevant occupational considerations?`, custom: false });
    }
    if (mc.category === "cardiovascular" && !mc.recentLabs.toLowerCase().includes("stress") && !mc.recentLabs.toLowerCase().includes("ecg") && !mc.recentLabs.toLowerCase().includes("echo")) {
      gaps.push({ id: generateId(), description: `Cardiac workup documentation may be incomplete for: ${mc.conditionName}`, category: "Diagnostic Testing", severity: "high", relatedCondition: mc.conditionName, providerQuestion: `Has the treating cardiologist or primary care provider performed or reviewed stress testing, ECG, or echocardiogram results relevant to ${mc.conditionName}? If so, can results be provided?`, custom: false });
    }
    if (mc.category === "neurologic" && (mc.conditionName.toLowerCase().includes("seizure") || mc.conditionName.toLowerCase().includes("epilepsy"))) {
      if (!mc.recentLabs.toLowerCase().includes("eeg") && !mc.recentLabs.toLowerCase().includes("drug level")) {
        gaps.push({ id: generateId(), description: `EEG and drug level documentation not documented for seizure disorder: ${mc.conditionName}`, category: "Diagnostic Testing", severity: "high", relatedCondition: mc.conditionName, providerQuestion: `Can the treating neurologist provide recent EEG results and current anticonvulsant drug level documentation for ${mc.conditionName}? What is the current seizure-free period?`, custom: false });
      }
    }
    if (mc.category === "respiratory" && !mc.recentLabs.toLowerCase().includes("pft") && !mc.recentLabs.toLowerCase().includes("spirom") && !mc.recentLabs.toLowerCase().includes("pulmonary")) {
      gaps.push({ id: generateId(), description: `Pulmonary function testing (PFT/spirometry) not documented for: ${mc.conditionName}`, category: "Diagnostic Testing", severity: "moderate", relatedCondition: mc.conditionName, providerQuestion: `Has current pulmonary function testing been performed for ${mc.conditionName}? Can spirometry results and a provider statement regarding respirator tolerance be provided?`, custom: false });
    }
    if (mc.category === "endocrine-metabolic" && (mc.conditionName.toLowerCase().includes("diabetes"))) {
      if (!mc.recentLabs.toLowerCase().includes("hba1c") && !mc.recentLabs.toLowerCase().includes("a1c")) {
        gaps.push({ id: generateId(), description: `HbA1c not documented for: ${mc.conditionName}`, category: "Laboratory Results", severity: "moderate", relatedCondition: mc.conditionName, providerQuestion: `Can current HbA1c results and a provider statement on glycemic control and occupational tolerance be provided for ${mc.conditionName}?`, custom: false });
      }
    }
    if ((mc.status === "active" || mc.status === "uncontrolled") && !mc.specialist) {
      gaps.push({ id: generateId(), description: `Active/uncontrolled condition without documented specialist: ${mc.conditionName}`, category: "Specialist Follow-Up", severity: "moderate", relatedCondition: mc.conditionName, providerQuestion: `Is ${mc.conditionName} being managed by a specialist? If so, can specialist documentation be obtained?`, custom: false });
    }
    if (mc.incapacitationRisk === "Yes" && !mc.providerQuote) {
      gaps.push({ id: generateId(), description: `Incapacitation risk flagged but no provider documentation for: ${mc.conditionName}`, category: "Provider Documentation", severity: "high", relatedCondition: mc.conditionName, providerQuestion: `Provider documentation addressing the probability and circumstances of incapacitation related to ${mc.conditionName} is not documented. Can a provider statement addressing this risk and applicable occupational standards be obtained?`, custom: false });
    }
    if (mc.refrigerationNeeded && c.deploymentCountry) {
      gaps.push({ id: generateId(), description: `Medication refrigeration required for deployment: ${mc.conditionName} (${mc.currentMedications})`, category: "Deployment Planning", severity: "high", relatedCondition: mc.conditionName, providerQuestion: `${mc.conditionName} requires refrigerated medication (${mc.currentMedications}) and a deployment to ${c.deploymentCountry} is planned. Can the prescribing provider address medication storage requirements, stability alternatives, and a supply plan for the deployment period?`, custom: false });
    }
  }

  for (const inj of injuries) {
    if (inj.documentationConfidence === "missing") {
      gaps.push({ id: generateId(), description: `Injury/surgical records missing: ${inj.injuryType} (${inj.bodyRegion})`, category: "Medical Records", severity: "high", relatedCondition: inj.injuryType, providerQuestion: `Records documenting ${inj.injuryType} to ${inj.bodyRegion} are not available. Can treating provider records, surgical reports, imaging results, or PT discharge summaries be obtained?`, custom: false });
    }
    if (inj.documentationConfidence === "unclear") {
      gaps.push({ id: generateId(), description: `Injury documentation incomplete/unclear: ${inj.injuryType} (${inj.bodyRegion})`, category: "Medical Records", severity: "moderate", relatedCondition: inj.injuryType, providerQuestion: `Documentation for ${inj.injuryType} is incomplete. Can additional records, current functional status, and treating provider statement be obtained?`, custom: false });
    }
    if (inj.residualPain >= 5 && !inj.providerQuote) {
      gaps.push({ id: generateId(), description: `Significant residual pain (${inj.residualPain}/10) without provider documentation: ${inj.injuryType}`, category: "Provider Documentation", severity: "moderate", relatedCondition: inj.injuryType, providerQuestion: `${inj.injuryType} shows residual pain of ${inj.residualPain}/10 but provider documentation is absent. Can a current treating provider statement addressing functional status and job duty tolerance be obtained?`, custom: false });
    }
  }

  if (!c.jobDuties.essentialFunctions && c.jobDuties.physicalDemands.length === 0) {
    gaps.push({ id: generateId(), description: "Essential job functions not documented", category: "Job Description", severity: "moderate", relatedCondition: "", providerQuestion: "A detailed job description or essential functions statement from the employer may be needed to assess medical fitness in context of specific duties.", custom: false });
  }

  if (c.deploymentCountry && !c.countryRisk) {
    gaps.push({ id: generateId(), description: `Deployment country risk profile not completed for: ${c.deploymentCountry}`, category: "Deployment Planning", severity: "moderate", relatedCondition: "", providerQuestion: "A country risk assessment for the planned deployment location has not been completed. This may be needed to assess medication access, emergency care availability, and environment-condition interactions.", custom: false });
  }

  return gaps;
}

interface Props { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void; }

export default function DocumentationGaps({ caseData, onUpdate }: Props) {
  function run() {
    const detected = autoDetect(caseData);
    const existing = caseData.documentationGaps.filter(g => g.custom);
    const combined = [...detected, ...existing];
    onUpdate({ documentationGaps: combined });
  }

  function addCustom() {
    const ng: DocumentationGap = { id: generateId(), description: "", category: "Custom", severity: "moderate", relatedCondition: "", providerQuestion: "", custom: true };
    onUpdate({ documentationGaps: [...caseData.documentationGaps, ng] });
  }

  function upd(id: string, field: keyof DocumentationGap, value: unknown) {
    onUpdate({ documentationGaps: caseData.documentationGaps.map(g => g.id === id ? { ...g, [field]: value } : g) });
  }

  function remove(id: string) {
    onUpdate({ documentationGaps: caseData.documentationGaps.filter(g => g.id !== id) });
  }

  const high = caseData.documentationGaps.filter(g => g.severity === "high");
  const mod = caseData.documentationGaps.filter(g => g.severity === "moderate");
  const low = caseData.documentationGaps.filter(g => g.severity === "low");

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" };
  const inp = { width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: "0.125rem" }}>Documentation Gap Analyzer</h2>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
            Automatically detect documentation gaps based on case data. Also shows suggested provider questions to help obtain missing information.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button className="glow-btn glow-btn-secondary" onClick={addCustom} data-testid="btn-add-custom-gap" style={{ fontSize: "0.8125rem", padding: "0.5rem 0.875rem" }}>+ Add Custom Gap</button>
          <button className="glow-btn" onClick={run} data-testid="btn-detect-gaps" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshCw size={14} />
            Detect Gaps from Case Data
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "0.875rem", marginBottom: "1.25rem" }}>
        {[
          { label: "High Priority", count: high.length, color: "#ef4444" },
          { label: "Moderate", count: mod.length, color: "#f59e0b" },
          { label: "Low Priority", count: low.length, color: "#22c55e" },
          { label: "Total Gaps", count: caseData.documentationGaps.length, color: "#00d4ff" },
        ].map(({ label, count, color }) => (
          <div key={label} className="glass-card" style={{ padding: "0.875rem 1.25rem", flex: 1 }}>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>{label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{count}</div>
          </div>
        ))}
      </div>

      {caseData.documentationGaps.length === 0 ? (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
          <FileSearch size={40} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 1rem" }} />
          <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>No documentation gaps identified yet</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem", marginBottom: "1.5rem" }}>Enter medical conditions and case data, then click "Detect Gaps"</div>
          <button className="glow-btn" onClick={run} data-testid="btn-detect-gaps-empty" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshCw size={14} />
            Detect Gaps Now
          </button>
        </div>
      ) : (
        <div>
          {["high", "moderate", "low"].map(sev => {
            const sevGaps = caseData.documentationGaps.filter(g => g.severity === sev);
            if (sevGaps.length === 0) return null;
            const meta = SEV_META[sev as keyof typeof SEV_META];
            return (
              <div key={sev} style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.625rem" }}>
                  {sev.charAt(0).toUpperCase() + sev.slice(1)} Priority — {sevGaps.length} Gap{sevGaps.length > 1 ? "s" : ""}
                </div>
                {sevGaps.map(gap => (
                  <div key={gap.id} style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "0.625rem" }} data-testid={`gap-card-${gap.id}`}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {gap.custom ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <div>
                              <label style={lbl}>Description</label>
                              <input className="glass-input" style={inp} value={gap.description} onChange={e => upd(gap.id, "description", e.target.value)} placeholder="Gap description..." data-testid={`gap-desc-${gap.id}`} />
                            </div>
                            <div>
                              <label style={lbl}>Category</label>
                              <select className="glass-input" style={inp} value={gap.category} onChange={e => upd(gap.id, "category", e.target.value)} data-testid={`gap-cat-${gap.id}`}>
                                {["Provider Documentation","Diagnostic Testing","Laboratory Results","Medical Records","Specialist Follow-Up","Deployment Planning","Job Description","Custom"].map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Severity</label>
                              <select className="glass-input" style={inp} value={gap.severity} onChange={e => upd(gap.id, "severity", e.target.value)} data-testid={`gap-sev-${gap.id}`}>
                                <option value="high">High</option>
                                <option value="moderate">Moderate</option>
                                <option value="low">Low</option>
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Related Condition</label>
                              <input className="glass-input" style={inp} value={gap.relatedCondition} onChange={e => upd(gap.id, "relatedCondition", e.target.value)} data-testid={`gap-condition-${gap.id}`} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginBottom: "0.375rem" }}>
                            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: meta.color, marginBottom: "0.25rem" }}>{gap.description}</div>
                            {gap.relatedCondition && <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>Related to: {gap.relatedCondition} · Category: {gap.category}</div>}
                          </div>
                        )}
                        <div style={{ marginTop: gap.custom ? 0 : "0.625rem" }}>
                          <label style={{ ...lbl, color: "#00d4ff" }}>Suggested Provider Question / Follow-Up Action</label>
                          <textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical", borderColor: "rgba(0,212,255,0.2)" }} value={gap.providerQuestion} onChange={e => upd(gap.id, "providerQuestion", e.target.value)} placeholder="Provider question or follow-up action..." data-testid={`gap-question-${gap.id}`} />
                        </div>
                      </div>
                      <button className="glow-btn glow-btn-secondary" onClick={() => remove(gap.id)} data-testid={`btn-remove-gap-${gap.id}`} style={{ padding: "0.3rem 0.5rem", flexShrink: 0 }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
