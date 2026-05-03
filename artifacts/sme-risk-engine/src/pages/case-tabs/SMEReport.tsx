import { useState, useRef } from "react";
import { SMECase, RiskScore } from "@/lib/types";
import { FileText, Copy, Download, Printer, Save } from "lucide-react";

interface Props { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void; }

const SCORE_LABELS: Record<string, string> = {
  "0": "None (0)", "1": "Low (1)", "2": "Moderate (2)", "3": "High (3)", "U": "Unable to Score (U)"
};
const SCORE_CLASSES: Record<string, string> = {
  "0": "score-none", "1": "score-low", "2": "score-mod", "3": "score-high", "U": "score-none"
};

function buildReportHTML(c: SMECase): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const safeStr = (s: string | undefined) => s || "Not documented";
  const conditions = c.medicalConditions;
  const injuries = c.injuries;

  const conditionSections = conditions.map((mc, idx) => `
    <div class="report-section">
      <h3>${idx + 1}. ${mc.conditionName} (${mc.category})</h3>
      <p><span class="label">Current Status:</span> <span class="value">${mc.status}</span> &nbsp;|&nbsp; <span class="label">Incapacitation Risk:</span> <span class="value">${mc.incapacitationRisk}</span> &nbsp;|&nbsp; <span class="label">Recurrence Risk:</span> <span class="value">${mc.recurrenceRisk}</span></p>
      ${mc.dateDiagnosed ? `<p><span class="label">Date Diagnosed:</span> <span class="value">${mc.dateDiagnosed}</span></p>` : ""}
      ${mc.currentMedications ? `<p><span class="label">Current Medications:</span> <span class="value">${mc.currentMedications}</span>${mc.medicationSideEffects ? ` — <em>Side effects: ${mc.medicationSideEffects}</em>` : ""}</p>` : ""}
      ${mc.recentLabs ? `<p><span class="label">Recent Labs/Testing:</span> <span class="value">${mc.recentLabs}</span></p>` : ""}
      ${mc.functionalLimitations ? `<p><span class="label">Functional Limitations:</span> <span class="value">${mc.functionalLimitations}</span></p>` : ""}
      ${mc.restrictions ? `<p><span class="label">Documented Restrictions:</span> <span class="value">${mc.restrictions}</span></p>` : ""}
      ${mc.providerQuote ? `<div class="provider-quote">Provider documentation states: "${mc.providerQuote}"</div>` : "<p><em>No provider documentation quote entered for this condition.</em></p>"}
      ${mc.selfReported ? `<p><span class="label">Self-Reported:</span> <em>${mc.selfReported}</em></p>` : ""}
      ${mc.notes ? `<p><span class="label">SME Notes:</span> ${mc.notes}</p>` : ""}
    </div>
  `).join("");

  const injurySections = injuries.length > 0 ? injuries.map((inj, idx) => `
    <div class="report-section">
      <h3>${idx + 1}. ${inj.injuryType} — ${inj.bodyRegion}</h3>
      <p><span class="label">Date of Injury:</span> <span class="value">${safeStr(inj.dateOfInjury)}</span> &nbsp;|&nbsp; <span class="label">Documentation:</span> <span class="value">${inj.documentationConfidence}</span></p>
      ${inj.mechanism ? `<p><span class="label">Mechanism:</span> ${inj.mechanism}</p>` : ""}
      ${inj.treatmentReceived ? `<p><span class="label">Treatment Received:</span> ${inj.treatmentReceived}</p>` : ""}
      ${inj.surgeriesPerformed ? `<p><span class="label">Surgeries/Procedures:</span> ${inj.surgeriesPerformed}</p>` : ""}
      ${inj.imagingType ? `<p><span class="label">Imaging:</span> ${inj.imagingType}</p>` : ""}
      <p><span class="label">Residual Pain:</span> ${inj.residualPain}/10 &nbsp;|&nbsp; <span class="label">Residual Weakness:</span> ${safeStr(inj.residualWeakness)} &nbsp;|&nbsp; <span class="label">ROM Limitation:</span> ${safeStr(inj.romLimitation)}</p>
      <p><span class="label">Reinjury Risk:</span> ${inj.reinjuryRisk}</p>
      ${inj.jobDutyRelevance ? `<p><span class="label">Job Duty Relevance:</span> ${inj.jobDutyRelevance}</p>` : ""}
      ${inj.providerQuote ? `<div class="provider-quote">Provider documentation states: "${inj.providerQuote}"</div>` : ""}
    </div>
  `).join("") : "<p>No occupationally relevant injury or surgical history documented.</p>";

  const riskRows = c.riskScores.map(s => `
    <tr>
      <td>${s.category}</td>
      <td><span class="risk-score-box ${SCORE_CLASSES[String(s.score)]}">${SCORE_LABELS[String(s.score)]}</span></td>
      <td>${s.whyFlagged}</td>
    </tr>
  `).join("") || "<tr><td colspan='3'>No risk scores entered</td></tr>";

  const gapRows = c.documentationGaps.length > 0 ? c.documentationGaps.map(g => `
    <tr>
      <td>${g.description}</td>
      <td>${g.category}</td>
      <td style="text-transform: capitalize">${g.severity}</td>
      <td>${g.providerQuestion}</td>
    </tr>
  `).join("") : "<tr><td colspan='4'>No documentation gaps identified</td></tr>";

  const sa = c.smeAssessment;

  return `
    <div class="header-block">
      <h1>SME Occupational Health Review</h1>
      <p style="font-size: 0.9rem; color: #374151; margin: 0.25rem 0;">Case ID: <strong>${c.caseId}</strong> &nbsp;|&nbsp; Prepared: <strong>${today}</strong></p>
      <p style="font-size: 0.8rem; color: #6b7280; margin: 0.5rem 0 0;">Reviewing SME: ${safeStr(c.reviewingSME)} &nbsp;|&nbsp; Case Manager: ${safeStr(c.caseManager)}</p>
    </div>

    <div class="disclaimer">
      <strong>Important Notice:</strong> This report is a decision-support document prepared by a Subject Matter Expert (SME) to assist in occupational health review. It does not constitute a final medical determination, employment qualification, or disqualification. All findings require review by appropriate qualified professionals in accordance with applicable legal and regulatory requirements. This document may contain health information and should be handled in accordance with applicable privacy requirements.
    </div>

    <h2>Section 1: Examinee & Case Information</h2>
    <div class="report-section">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
        <tr><td style="padding: 0.3rem 0.5rem; width: 40%"><span class="label">Examinee Name/ID:</span></td><td><span class="value">${safeStr(c.examineeName)}</span></td><td style="padding: 0.3rem 0.5rem; width: 40%"><span class="label">Date of Birth:</span></td><td><span class="value">${safeStr(c.dob)} (Age: ${c.age || "—"})</span></td></tr>
        <tr><td style="padding: 0.3rem 0.5rem"><span class="label">Sex:</span></td><td><span class="value">${safeStr(c.sex)}</span></td><td style="padding: 0.3rem 0.5rem"><span class="label">Employer:</span></td><td><span class="value">${safeStr(c.employer)}</span></td></tr>
        <tr><td style="padding: 0.3rem 0.5rem"><span class="label">Job Title:</span></td><td><span class="value">${safeStr(c.jobTitle)}</span></td><td style="padding: 0.3rem 0.5rem"><span class="label">Department:</span></td><td><span class="value">${safeStr(c.department)}</span></td></tr>
        <tr><td style="padding: 0.3rem 0.5rem"><span class="label">Exam Type:</span></td><td><span class="value">${safeStr(c.examType)}</span></td><td style="padding: 0.3rem 0.5rem"><span class="label">Date of Exam:</span></td><td><span class="value">${safeStr(c.dateOfExam)}</span></td></tr>
        <tr><td style="padding: 0.3rem 0.5rem"><span class="label">Agency Standard:</span></td><td><span class="value">${safeStr(c.agencyStandard)}</span></td><td style="padding: 0.3rem 0.5rem"><span class="label">Deployment Country:</span></td><td><span class="value">${c.deploymentCountry || "N/A"}</span></td></tr>
      </table>
    </div>

    <h2>Section 2: Applicable Standards & Guidelines</h2>
    <div class="report-section">
      ${c.standards.selected.length > 0 ? `<p><span class="label">Selected Standards:</span> ${c.standards.selected.join("; ")}</p>` : "<p>No specific standards selected.</p>"}
      ${c.standards.customNotes ? `<p><span class="label">Standard Notes:</span> ${c.standards.customNotes}</p>` : ""}
    </div>

    <h2>Section 3: Essential Job Functions & Occupational Demands</h2>
    <div class="report-section">
      ${c.jobDuties.physicalDemands.length > 0 ? `<p><span class="label">Physical Demands:</span> ${c.jobDuties.physicalDemands.join("; ")}</p>` : ""}
      ${c.jobDuties.cognitiveDemands.length > 0 ? `<p><span class="label">Cognitive/Safety Demands:</span> ${c.jobDuties.cognitiveDemands.join("; ")}</p>` : ""}
      ${c.jobDuties.environmentalDemands.length > 0 ? `<p><span class="label">Environmental Demands:</span> ${c.jobDuties.environmentalDemands.join("; ")}</p>` : ""}
      ${c.jobDuties.essentialFunctions ? `<p><span class="label">Essential Functions:</span> ${c.jobDuties.essentialFunctions}</p>` : ""}
      ${c.jobDuties.clientRequirements ? `<p><span class="label">Client Requirements:</span> ${c.jobDuties.clientRequirements}</p>` : ""}
    </div>

    <h2>Section 4: Medical History — Active & Relevant Conditions</h2>
    ${conditionSections || "<p>No medical conditions entered.</p>"}

    <h2>Section 5: Injury & Surgical History</h2>
    ${injurySections}

    ${c.deploymentCountry && c.countryRisk ? `
    <h2>Section 6: Deployment Country Risk Profile</h2>
    <div class="report-section">
      <p><span class="label">Deployment Country:</span> <span class="value">${c.countryRisk.country}</span> &nbsp;|&nbsp; <span class="label">Region:</span> ${safeStr(c.countryRisk.region)}</p>
      ${c.countryRisk.climateRisks.length > 0 ? `<p><span class="label">Climate Risks:</span> ${c.countryRisk.climateRisks.join(", ")}</p>` : ""}
      ${c.countryRisk.infectiousDiseaseRisks.length > 0 ? `<p><span class="label">Infectious Disease Risks:</span> ${c.countryRisk.infectiousDiseaseRisks.join(", ")}</p>` : ""}
      <p><span class="label">Medical Infrastructure:</span> ${safeStr(c.countryRisk.localMedicalInfrastructure)} &nbsp;|&nbsp; <span class="label">Pharmacy:</span> ${safeStr(c.countryRisk.pharmacyReliability)} &nbsp;|&nbsp; <span class="label">Security:</span> ${safeStr(c.countryRisk.securityRisk)}</p>
      ${c.countryRisk.evacuationConcerns ? `<p><span class="label">Evacuation Concerns:</span> ${c.countryRisk.evacuationConcerns}</p>` : ""}
      ${c.countryRisk.notes ? `<p><span class="label">Notes:</span> ${c.countryRisk.notes}</p>` : ""}
    </div>` : ""}

    <h2>Section 7: Risk Scoring Summary</h2>
    <div class="report-section">
      <p style="font-size: 0.8rem; color: #6b7280; font-style: italic; margin-bottom: 0.75rem;">Risk scores represent SME assessment of identified concerns: 0=None, 1=Low, 2=Moderate, 3=High, U=Unable to Score. Scores do not constitute medical determinations.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
        <thead><tr style="background: #f3f4f6"><th style="text-align:left; padding: 0.4rem 0.5rem; border-bottom: 2px solid #d1d5db">Category</th><th style="text-align:left; padding: 0.4rem 0.5rem; border-bottom: 2px solid #d1d5db">Score</th><th style="text-align:left; padding: 0.4rem 0.5rem; border-bottom: 2px solid #d1d5db">Rationale</th></tr></thead>
        <tbody>${riskRows}</tbody>
      </table>
    </div>

    <h2>Section 8: Documentation Gap Summary</h2>
    <div class="report-section">
      ${c.documentationGaps.length > 0 ? `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.8125rem;">
        <thead><tr style="background: #f3f4f6"><th style="text-align:left; padding: 0.375rem 0.5rem; border-bottom: 2px solid #d1d5db">Gap Description</th><th style="padding: 0.375rem 0.5rem; border-bottom: 2px solid #d1d5db">Category</th><th style="padding: 0.375rem 0.5rem; border-bottom: 2px solid #d1d5db">Priority</th><th style="text-align:left; padding: 0.375rem 0.5rem; border-bottom: 2px solid #d1d5db">Provider Question / Action</th></tr></thead>
        <tbody>${gapRows}</tbody>
      </table>` : "<p>No documentation gaps identified.</p>"}
    </div>

    ${c.healthEquity ? `
    <h2>Section 9: Health Equity & Access-to-Care Considerations</h2>
    <div class="report-section">
      <div class="disclaimer">These factors represent access-to-care considerations and support needs.</div>
      ${c.healthEquity.accessToCare ? `<p><span class="label">Access-to-Care Notes:</span> ${c.healthEquity.accessToCare}</p>` : ""}
      ${c.healthEquity.followUpFeasibility ? `<p><span class="label">Follow-Up Feasibility:</span> ${c.healthEquity.followUpFeasibility}</p>` : ""}
      ${c.healthEquity.documentationBarriers ? `<p><span class="label">Documentation Barriers:</span> ${c.healthEquity.documentationBarriers}</p>` : ""}
      ${c.healthEquity.supportRecommendations ? `<p><span class="label">Support Recommendations:</span> ${c.healthEquity.supportRecommendations}</p>` : ""}
    </div>` : ""}

    <h2>Section 10: SME Clinical Assessment</h2>
    <div class="report-section">
      ${sa.clinicalInterpretation ? `<p><span class="label">Clinical Interpretation:</span> ${sa.clinicalInterpretation}</p>` : "<p><em>Clinical interpretation not yet entered.</em></p>"}
      ${sa.occupationalRelevance ? `<p><span class="label">Occupational Relevance:</span> ${sa.occupationalRelevance}</p>` : ""}
      ${sa.riskLevel ? `<p><span class="label">Overall Risk Assessment:</span> <strong>${sa.riskLevel}</strong></p>` : ""}
      ${sa.documentationSufficiency ? `<p><span class="label">Documentation Sufficiency:</span> ${sa.documentationSufficiency}</p>` : ""}
      ${sa.additionalRecordsNeeded ? `<p><span class="label">Additional Records Needed:</span> <strong>${sa.additionalRecordsNeeded}</strong></p>` : ""}
    </div>

    <h2>Section 11: SME Recommendation</h2>
    <div class="report-section">
      <div class="disclaimer"><strong>Report Notice:</strong> This section summarizes the SME assessment for review.</div>
      ${sa.finalRecommendation ? `<p><span class="label">Recommendation Category:</span> <strong>${sa.finalRecommendation}</strong></p>` : "<p><em>Final recommendation not yet entered.</em></p>"}
      ${sa.recommendationFreeText ? `<p>${sa.recommendationFreeText}</p>` : ""}
    </div>

    <h2>Section 12: Documents Reviewed</h2>
    <div class="report-section">
      ${sa.documentsReviewed.length > 0 ? `<ul>${sa.documentsReviewed.map(d => `<li>${d}</li>`).join("")}</ul>` : "<p>No documents listed.</p>"}
    </div>

    <h2>Section 13: SME Notes</h2>
    <div class="report-section">
      ${sa.smeReviewNotes || "<em>No additional SME notes entered.</em>"}
      <p style="margin-top: 1rem"><span class="label">Date of SME Review:</span> <span class="value">${sa.dateCompleted || "Not yet completed"}</span></p>
    </div>

    <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #0a0f1e; font-size: 0.8125rem; color: #6b7280;">
      <p><strong>Reviewer:</strong> ${safeStr(c.reviewingSME)} &nbsp;|&nbsp; <strong>Case ID:</strong> ${c.caseId} &nbsp;|&nbsp; <strong>Generated:</strong> ${today}</p>
      <p><em>CONFIDENTIAL — For authorized personnel only. This document contains occupational health information and may be subject to privacy protections. Intended use: internal decision support only. Not a final medical determination.</em></p>
    </div>
  `;
}

const RECOMMENDATIONS = [
  "Recommend for Review — No Significant Concerns Identified",
  "Recommend for Review — With Conditions / Follow-Up Required",
  "Defer — Additional Records Required Before Determination",
  "Defer — Specialist Evaluation Required",
  "Decline to Score — Insufficient Documentation",
  "High Risk — Refer to Physician for Formal Evaluation",
  "Unable to Determine — Multiple Unresolved Issues",
];

export default function SMEReport({ caseData, onUpdate }: Props) {
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const sa = caseData.smeAssessment;

  function updSA(field: string, value: unknown) {
    onUpdate({ smeAssessment: { ...sa, [field]: value } });
  }
  function addDoc(val: string) {
    if (!val.trim()) return;
    updSA("documentsReviewed", [...sa.documentsReviewed, val]);
  }
  function removeDoc(i: number) {
    updSA("documentsReviewed", sa.documentsReviewed.filter((_, idx) => idx !== i));
  }
  function markComplete() {
    updSA("dateCompleted", new Date().toISOString().split("T")[0]);
  }

  function copyReport() {
    const text = reportRef.current?.innerText || "";
    navigator.clipboard.writeText(text).catch(() => {});
  }
  function downloadReport() {
    const html = buildReportHTML(caseData);
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SME Report - ${caseData.caseId}</title><style>body{font-family:Georgia,serif;max-width:900px;margin:0 auto;padding:2rem;color:#1a1a2e;background:#fff}.provider-quote{background:#f0f9ff;border-left:3px solid #0284c7;padding:0.625rem 1rem;font-style:italic;margin:0.5rem 0;border-radius:0 6px 6px 0}.label{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#4b5563}.value{font-weight:500;color:#0a0f1e}h1{font-size:1.375rem;margin-bottom:0.5rem}h2{font-size:1.125rem;font-weight:700;margin-top:1.5rem;margin-bottom:0.5rem;border-bottom:2px solid #0a0f1e;padding-bottom:0.25rem}h3{font-size:1rem;font-weight:600;margin-top:0.875rem;margin-bottom:0.25rem;color:#1e3a5f}.disclaimer{font-size:0.8125rem;color:#6b7280;font-style:italic;background:#f9fafb;padding:0.75rem;border-radius:6px;border-left:3px solid #6b7280;margin-bottom:1rem}.header-block{text-align:center;margin-bottom:2rem;padding-bottom:1rem;border-bottom:2px solid #0a0f1e}.report-section{margin-bottom:1.5rem}table{border-collapse:collapse}td,th{padding:0.375rem 0.5rem;border-bottom:1px solid #e5e7eb}ul{padding-left:1.5rem;margin-bottom:0.75rem}.risk-score-box{display:inline-block;padding:0.1rem 0.5rem;border-radius:4px;font-weight:700}.score-high{background:#fee2e2;color:#991b1b}.score-mod{background:#fef3c7;color:#92400e}.score-low{background:#dcfce7;color:#166534}.score-none{background:#f3f4f6;color:#374151}</style></head><body>${html}</body></html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SME-Report-${caseData.caseId}-${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" };
  const inp = { width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8125rem" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: "0.125rem" }}>SME Report Generator</h2>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
            Complete the SME assessment below. The report is auto-generated from all case modules. Copy, download, or print when complete.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button className="glow-btn glow-btn-secondary" onClick={() => setShowReport(!showReport)} data-testid="btn-toggle-report" style={{ fontSize: "0.8125rem", padding: "0.5rem 0.875rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <FileText size={13} />
            {showReport ? "Hide Report" : "Preview Report"}
          </button>
          <button className="glow-btn glow-btn-secondary" onClick={copyReport} data-testid="btn-copy-report" style={{ fontSize: "0.8125rem", padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Copy size={13} />
            Copy
          </button>
          <button className="glow-btn" onClick={downloadReport} data-testid="btn-download-report" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <Download size={14} />
            Download Report
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#00d4ff", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Clinical Assessment</div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={lbl}>Clinical Interpretation</label>
            <textarea className="glass-input" style={{ ...inp, minHeight: "100px", resize: "vertical" }} value={sa.clinicalInterpretation} onChange={e => updSA("clinicalInterpretation", e.target.value)} placeholder="SME clinical interpretation of the reviewed documentation..." data-testid="textarea-clinical-interpretation" />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={lbl}>Occupational Relevance</label>
            <textarea className="glass-input" style={{ ...inp, minHeight: "90px", resize: "vertical" }} value={sa.occupationalRelevance} onChange={e => updSA("occupationalRelevance", e.target.value)} placeholder="How do the identified medical findings relate to the documented job demands..." data-testid="textarea-occ-relevance" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={lbl}>Overall Risk Level</label>
              <select className="glass-input" style={inp} value={sa.riskLevel} onChange={e => updSA("riskLevel", e.target.value)} data-testid="select-risk-level">
                <option value="">— Select —</option>
                <option>None Identified</option>
                <option>Low</option>
                <option>Moderate</option>
                <option>High</option>
                <option>Significant — Requires Follow-Up</option>
                <option>Unable to Determine</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Documentation Sufficiency</label>
              <select className="glass-input" style={inp} value={sa.documentationSufficiency} onChange={e => updSA("documentationSufficiency", e.target.value)} data-testid="select-doc-sufficiency">
                <option value="">— Select —</option>
                <option>Sufficient</option>
                <option>Partially Sufficient</option>
                <option>Insufficient — Records Requested</option>
                <option>Unable to Determine</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#00d4ff", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Recommendation & Records</div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={lbl}>Additional Records Needed</label>
            <textarea className="glass-input" style={{ ...inp, minHeight: "80px", resize: "vertical" }} value={sa.additionalRecordsNeeded} onChange={e => updSA("additionalRecordsNeeded", e.target.value)} placeholder="List specific outstanding records or studies needed..." data-testid="textarea-additional-records" />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={lbl}>Recommendation Category</label>
            <select className="glass-input" style={inp} value={sa.finalRecommendation} onChange={e => updSA("finalRecommendation", e.target.value)} data-testid="select-final-recommendation">
              <option value="">— Select —</option>
              {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Recommendation Free Text</label>
            <textarea className="glass-input" style={{ ...inp, minHeight: "90px", resize: "vertical" }} value={sa.recommendationFreeText} onChange={e => updSA("recommendationFreeText", e.target.value)} placeholder="Full recommendation narrative for the report..." data-testid="textarea-recommendation-text" />
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#00d4ff", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>SME Review Notes</div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={lbl}>Internal SME Notes (not in report export)</label>
            <textarea className="glass-input" style={{ ...inp, minHeight: "100px", resize: "vertical" }} value={sa.smeReviewNotes} onChange={e => updSA("smeReviewNotes", e.target.value)} placeholder="Internal notes for SME reference — these will appear in the report as SME notes..." data-testid="textarea-sme-notes" />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Date Review Completed</label>
              <input type="date" className="glass-input" style={inp} value={sa.dateCompleted} onChange={e => updSA("dateCompleted", e.target.value)} data-testid="input-date-completed" />
            </div>
            <button className="glow-btn glow-btn-secondary" onClick={markComplete} data-testid="btn-mark-complete" style={{ fontSize: "0.8125rem", padding: "0.5rem 0.875rem", marginBottom: "0" }}>
              Mark Complete
            </button>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#00d4ff", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Documents Reviewed</div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <input
              className="glass-input"
              style={{ ...inp, flex: 1 }}
              placeholder="Document name..."
              data-testid="input-add-doc"
              onKeyDown={e => { if (e.key === "Enter") { addDoc((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; } }}
            />
            <button className="glow-btn glow-btn-secondary" onClick={() => { const el = document.querySelector<HTMLInputElement>("[data-testid='input-add-doc']"); if (el) { addDoc(el.value); el.value = ""; } }} data-testid="btn-add-doc" style={{ padding: "0.5rem 0.75rem" }}>Add</button>
          </div>
          <div style={{ maxHeight: "150px", overflowY: "auto" }}>
            {sa.documentsReviewed.map((doc, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", flex: 1 }}>{doc}</span>
                <button className="glow-btn glow-btn-secondary" onClick={() => removeDoc(i)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.6875rem" }}>✕</button>
              </div>
            ))}
            {sa.documentsReviewed.length === 0 && <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.3)" }}>No documents listed yet</div>}
          </div>
        </div>
      </div>

      {showReport && (
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Report Preview</span>
            <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.1)" }} />
          </div>
          <div
            className="report-preview"
            ref={reportRef}
            data-testid="report-preview"
            dangerouslySetInnerHTML={{ __html: buildReportHTML(caseData) }}
            style={{ maxHeight: "800px", overflowY: "auto" }}
          />
        </div>
      )}
    </div>
  );
}
