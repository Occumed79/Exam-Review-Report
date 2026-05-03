import { SMECase, HealthEquityContext } from "@/lib/types";
import { Users, AlertTriangle, ShieldCheck } from "lucide-react";

interface Props { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void; }

function blank(): HealthEquityContext {
  return {
    accessToCare: "", transportationBarriers: false, transportationNotes: "",
    medicationAffordability: false, medicationAffordabilityNotes: "",
    insuranceLimitations: "", localProviderAvailability: "Good",
    specialistAccess: "Good", pharmacyAccess: "Good",
    languageSupport: false, languageNotes: "",
    healthLiteracySupport: false, healthLiteracyNotes: "",
    followUpFeasibility: "Easy", documentationBarriers: "",
    supportRecommendations: ""
  };
}

export default function HealthEquity({ caseData, onUpdate }: Props) {
  const he = caseData.healthEquity;

  function init() { onUpdate({ healthEquity: blank() }); }
  function upd(field: keyof HealthEquityContext, value: unknown) {
    if (!he) return;
    onUpdate({ healthEquity: { ...he, [field]: value } });
  }

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" };
  const inp = { width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8125rem" };
  const selOpts = (opts: string[]) => opts.map(o => <option key={o} value={o}>{o}</option>);

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <Users size={20} style={{ color: "#a78bfa" }} />
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff" }}>Health Equity & Access-to-Care Context</h2>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
          For support-need identification only. These factors must never be used as adverse medical findings.
        </p>
      </div>

      <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "14px", padding: "1.125rem 1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <ShieldCheck size={18} style={{ color: "#a78bfa", flexShrink: 0, marginTop: "1px" }} />
          <div>
            <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>
              This section captures access-to-care barriers, documentation barriers, health equity considerations, and support needs.
            </div>
          </div>
        </div>
      </div>

      {!he ? (
        <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
          <Users size={36} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 1rem" }} />
          <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: "1.25rem" }}>No health equity context entered</div>
          <button className="glow-btn" onClick={init} data-testid="btn-init-health-equity">Add Health Equity Context</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#a78bfa", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Access & Availability</div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={lbl}>Access-to-Care Concerns</label>
                <textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={he.accessToCare} onChange={e => upd("accessToCare", e.target.value)} placeholder="Describe any identified access barriers..." data-testid="input-access-care" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={lbl}>Local Provider Availability</label>
                  <select className="glass-input" style={inp} value={he.localProviderAvailability} onChange={e => upd("localProviderAvailability", e.target.value)} data-testid="select-provider-availability">{selOpts(["Good","Limited","Very Limited","Unknown"])}</select>
                </div>
                <div>
                  <label style={lbl}>Specialist Access</label>
                  <select className="glass-input" style={inp} value={he.specialistAccess} onChange={e => upd("specialistAccess", e.target.value)} data-testid="select-specialist-access">{selOpts(["Good","Limited","Very Limited","Unknown"])}</select>
                </div>
                <div>
                  <label style={lbl}>Pharmacy Access</label>
                  <select className="glass-input" style={inp} value={he.pharmacyAccess} onChange={e => upd("pharmacyAccess", e.target.value)} data-testid="select-pharmacy-access">{selOpts(["Good","Limited","Very Limited","Unknown"])}</select>
                </div>
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <label style={lbl}>Insurance / Access Limitations</label>
                <textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={he.insuranceLimitations} onChange={e => upd("insuranceLimitations", e.target.value)} placeholder="Insurance gaps or cost barriers to care..." data-testid="input-insurance" />
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#a78bfa", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Barrier Screening</div>
              {[
                { field: "transportationBarriers" as const, noteField: "transportationNotes" as const, label: "Transportation Barrier Identified", notesPlaceholder: "Describe transportation barrier..." },
                { field: "medicationAffordability" as const, noteField: "medicationAffordabilityNotes" as const, label: "Medication Affordability Concern", notesPlaceholder: "Describe medication cost/access concern..." },
                { field: "languageSupport" as const, noteField: "languageNotes" as const, label: "Language/Communication Support Need", notesPlaceholder: "Language or accessibility support needed..." },
                { field: "healthLiteracySupport" as const, noteField: "healthLiteracyNotes" as const, label: "Health Literacy Support Need", notesPlaceholder: "Health literacy support needs..." },
              ].map(({ field, noteField, label, notesPlaceholder }) => (
                <div key={field} style={{ marginBottom: "0.875rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", marginBottom: "0.5rem" }} data-testid={`checkbox-${field}`}>
                    <input type="checkbox" checked={!!he[field]} onChange={e => upd(field, e.target.checked)} style={{ accentColor: "#a78bfa", width: "15px", height: "15px" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: he[field] ? "#a78bfa" : "rgba(255,255,255,0.65)" }}>{label}</span>
                  </label>
                  {he[field] && (
                    <input className="glass-input" style={inp} value={(he as unknown as Record<string, unknown>)[noteField] as string} onChange={e => upd(noteField, e.target.value)} placeholder={notesPlaceholder} data-testid={`input-${noteField}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#a78bfa", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Follow-Up & Documentation</div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={lbl}>Follow-Up Feasibility</label>
                <select className="glass-input" style={inp} value={he.followUpFeasibility} onChange={e => upd("followUpFeasibility", e.target.value)} data-testid="select-followup-feasibility">{selOpts(["Easy","Moderate","Difficult","Unknown"])}</select>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={lbl}>Documentation Completion Barriers</label>
                <textarea className="glass-input" style={{ ...inp, minHeight: "90px", resize: "vertical" }} value={he.documentationBarriers} onChange={e => upd("documentationBarriers", e.target.value)} placeholder="Barriers that may affect ability to obtain records..." data-testid="input-doc-barriers" />
              </div>
              <div>
                <label style={lbl}>Support Recommendations</label>
                <textarea className="glass-input" style={{ ...inp, minHeight: "100px", resize: "vertical" }} value={he.supportRecommendations} onChange={e => upd("supportRecommendations", e.target.value)} placeholder="Recommended supports, accommodations, or follow-up plans..." data-testid="input-support-recommendations" />
              </div>
            </div>

            {/* Output statement */}
            <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "12px", padding: "1.125rem" }}>
              <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                <AlertTriangle size={14} style={{ color: "#a78bfa", flexShrink: 0, marginTop: "2px" }} />
                <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, fontStyle: "italic" }}>
                  "These factors may affect documentation completeness, treatment continuity, or follow-up feasibility and should be considered as support needs rather than adverse medical findings. They must not be used to penalize the individual or reduce employment opportunity."
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
