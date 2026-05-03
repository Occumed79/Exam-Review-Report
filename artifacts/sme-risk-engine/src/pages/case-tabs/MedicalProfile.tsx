import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { SMECase, MedicalCondition, ConditionCategory, ConditionStatus, IncapacitationRisk, RecurrenceRisk } from "@/lib/types";
import { generateId } from "@/lib/store";

const CAT_COLORS: Record<ConditionCategory, string> = {
  cardiovascular: "#ef4444", respiratory: "#06b6d4", "endocrine-metabolic": "#f59e0b",
  neurologic: "#a78bfa", psychiatric: "#ec4899", orthopedic: "#fb923c",
  "sleep-disorder": "#6366f1", renal: "#22d3ee", gastrointestinal: "#84cc16",
  hematologic: "#f43f5e", "infectious-disease": "#10b981", immunologic: "#8b5cf6",
  dermatologic: "#fbbf24", "vision-hearing": "#60a5fa", other: "#94a3b8"
};

const CAT_LABELS: Record<ConditionCategory, string> = {
  cardiovascular: "Cardiovascular", respiratory: "Respiratory", "endocrine-metabolic": "Endocrine/Metabolic",
  neurologic: "Neurologic", psychiatric: "Psychiatric/Behavioral", orthopedic: "Orthopedic/Musculoskeletal",
  "sleep-disorder": "Sleep Disorder", renal: "Renal", gastrointestinal: "Gastrointestinal",
  hematologic: "Hematologic", "infectious-disease": "Infectious Disease", immunologic: "Immunologic",
  dermatologic: "Dermatologic", "vision-hearing": "Vision/Hearing", other: "Other"
};

function blank(): MedicalCondition {
  return {
    id: generateId(), conditionName: "", category: "cardiovascular", dateDiagnosed: "",
    status: "active", symptoms: "", severity: 0, frequencyOfSymptoms: "", lastFlare: "",
    treatmentPlan: "", currentMedications: "", medicationSideEffects: "", specialist: "",
    hospitalizations: 0, erVisits: 0, surgeries: 0, recentLabs: "", providerQuote: "",
    selfReported: "", functionalLimitations: "", restrictions: "", monitoringRequirements: "",
    incapacitationRisk: "Unclear", recurrenceRisk: "Unclear", refrigerationNeeded: false,
    specialtyFollowUp: false, emergencyAccessNeeded: false, notes: ""
  };
}

interface Props { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void; }

export default function MedicalProfile({ caseData, onUpdate }: Props) {
  const [expanded, setExpanded] = useState<string | null>(caseData.medicalConditions.length > 0 ? caseData.medicalConditions[0].id : null);

  function addCondition() {
    const nc = blank();
    const updated = [...caseData.medicalConditions, nc];
    onUpdate({ medicalConditions: updated });
    setExpanded(nc.id);
  }

  function updateCondition(id: string, field: keyof MedicalCondition, value: unknown) {
    const updated = caseData.medicalConditions.map(c => c.id === id ? { ...c, [field]: value } : c);
    onUpdate({ medicalConditions: updated });
  }

  function deleteCondition(id: string) {
    const updated = caseData.medicalConditions.filter(c => c.id !== id);
    onUpdate({ medicalConditions: updated });
    if (expanded === id) setExpanded(updated[0]?.id ?? null);
  }

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" };
  const inp = { width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8125rem" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: "0.125rem" }}>Medical Profile</h2>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>Document all relevant medical conditions. Use careful, evidence-based language from provider documentation.</p>
        </div>
        <button className="glow-btn" onClick={addCondition} data-testid="btn-add-condition" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem" }}>
          <Plus size={14} />
          Add Condition
        </button>
      </div>

      {caseData.medicalConditions.length === 0 && (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "0.875rem", fontSize: "0.9375rem" }}>No medical conditions entered yet</div>
          <button className="glow-btn" onClick={addCondition} data-testid="btn-add-first-condition">Add Medical Condition</button>
        </div>
      )}

      {caseData.medicalConditions.map((mc, idx) => {
        const isOpen = expanded === mc.id;
        const catColor = CAT_COLORS[mc.category];
        const isHighRisk = mc.status === "active" || mc.status === "uncontrolled" || mc.incapacitationRisk === "Yes" || mc.incapacitationRisk === "Possible";
        return (
          <div
            key={mc.id}
            className={`glass-card${isHighRisk ? " glass-card-active" : ""}`}
            style={{ marginBottom: "0.875rem", overflow: "hidden", borderColor: isHighRisk ? "rgba(239,68,68,0.3)" : undefined }}
            data-testid={`condition-card-${mc.id}`}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem 1.25rem", cursor: "pointer" }}
              onClick={() => setExpanded(isOpen ? null : mc.id)}
            >
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: catColor, flexShrink: 0, boxShadow: `0 0 8px ${catColor}80` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#fff" }}>{mc.conditionName || `Condition ${idx + 1}`}</span>
                  {isHighRisk && <AlertTriangle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                  <span style={{ fontSize: "0.6875rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30`, fontWeight: 600 }}>{CAT_LABELS[mc.category]}</span>
                  <span style={{ fontSize: "0.6875rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{mc.status}</span>
                  {mc.currentMedications && <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>Rx: {mc.currentMedications.split(",")[0]}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button className="glow-btn glow-btn-secondary" onClick={(e) => { e.stopPropagation(); deleteCondition(mc.id); }} data-testid={`btn-delete-condition-${mc.id}`} style={{ padding: "0.3rem 0.5rem" }}><Trash2 size={12} /></button>
                {isOpen ? <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />}
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
                  <div><label style={lbl}>Condition Name</label><input className="glass-input" style={inp} value={mc.conditionName} onChange={e => updateCondition(mc.id, "conditionName", e.target.value)} placeholder="e.g., Hypertension, Type 2 Diabetes" data-testid={`input-condition-name-${mc.id}`} /></div>
                  <div><label style={lbl}>Category</label><select className="glass-input" style={inp} value={mc.category} onChange={e => updateCondition(mc.id, "category", e.target.value)} data-testid={`select-category-${mc.id}`}>{(Object.entries(CAT_LABELS) as [ConditionCategory, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                  <div><label style={lbl}>Date Diagnosed</label><input type="date" className="glass-input" style={inp} value={mc.dateDiagnosed} onChange={e => updateCondition(mc.id, "dateDiagnosed", e.target.value)} data-testid={`input-date-diagnosed-${mc.id}`} /></div>
                  <div><label style={lbl}>Current Status</label><select className="glass-input" style={inp} value={mc.status} onChange={e => updateCondition(mc.id, "status", e.target.value as ConditionStatus)} data-testid={`select-status-${mc.id}`}><option value="active">Active</option><option value="stable">Stable</option><option value="resolved">Resolved</option><option value="uncontrolled">Uncontrolled</option><option value="unclear">Unclear</option></select></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                  <div><label style={lbl}>Current Symptoms</label><textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={mc.symptoms} onChange={e => updateCondition(mc.id, "symptoms", e.target.value)} placeholder="Describe current symptoms..." data-testid={`textarea-symptoms-${mc.id}`} /></div>
                  <div><label style={lbl}>Treatment Plan</label><textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={mc.treatmentPlan} onChange={e => updateCondition(mc.id, "treatmentPlan", e.target.value)} placeholder="Current treatment regimen..." data-testid={`textarea-treatment-${mc.id}`} /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                  <div><label style={lbl}>Current Medications</label><input className="glass-input" style={inp} value={mc.currentMedications} onChange={e => updateCondition(mc.id, "currentMedications", e.target.value)} placeholder="Drug name, dose, frequency" data-testid={`input-medications-${mc.id}`} /></div>
                  <div><label style={lbl}>Medication Side Effects</label><input className="glass-input" style={inp} value={mc.medicationSideEffects} onChange={e => updateCondition(mc.id, "medicationSideEffects", e.target.value)} placeholder="Relevant side effects..." data-testid={`input-side-effects-${mc.id}`} /></div>
                  <div><label style={lbl}>Specialist Involved</label><input className="glass-input" style={inp} value={mc.specialist} onChange={e => updateCondition(mc.id, "specialist", e.target.value)} placeholder="e.g., Cardiology" data-testid={`input-specialist-${mc.id}`} /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                  <div><label style={lbl}>Severity (0-10)</label><input type="number" min="0" max="10" className="glass-input" style={inp} value={mc.severity} onChange={e => updateCondition(mc.id, "severity", Number(e.target.value))} data-testid={`input-severity-${mc.id}`} /></div>
                  <div><label style={lbl}>Hospitalizations</label><input type="number" min="0" className="glass-input" style={inp} value={mc.hospitalizations} onChange={e => updateCondition(mc.id, "hospitalizations", Number(e.target.value))} data-testid={`input-hospitalizations-${mc.id}`} /></div>
                  <div><label style={lbl}>ER Visits</label><input type="number" min="0" className="glass-input" style={inp} value={mc.erVisits} onChange={e => updateCondition(mc.id, "erVisits", Number(e.target.value))} data-testid={`input-er-visits-${mc.id}`} /></div>
                  <div><label style={lbl}>Surgeries/Procs</label><input type="number" min="0" className="glass-input" style={inp} value={mc.surgeries} onChange={e => updateCondition(mc.id, "surgeries", Number(e.target.value))} data-testid={`input-surgeries-${mc.id}`} /></div>
                  <div><label style={lbl}>Last Flare</label><input type="date" className="glass-input" style={inp} value={mc.lastFlare} onChange={e => updateCondition(mc.id, "lastFlare", e.target.value)} data-testid={`input-last-flare-${mc.id}`} /></div>
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <label style={lbl}>Recent Labs / Test Results</label>
                  <textarea className="glass-input" style={{ ...inp, minHeight: "60px", resize: "vertical" }} value={mc.recentLabs} onChange={e => updateCondition(mc.id, "recentLabs", e.target.value)} placeholder="Lab values, imaging results, test dates..." data-testid={`textarea-labs-${mc.id}`} />
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <label style={lbl}>Provider Documentation Quote</label>
                  <textarea className="glass-input" style={{ ...inp, minHeight: "80px", resize: "vertical", borderColor: "rgba(0,212,255,0.2)" }} value={mc.providerQuote} onChange={e => updateCondition(mc.id, "providerQuote", e.target.value)} placeholder='"Provider documentation states: [direct quote from treating provider]..."' data-testid={`textarea-provider-quote-${mc.id}`} />
                  <div style={{ fontSize: "0.6875rem", color: "rgba(0,212,255,0.5)", marginTop: "0.25rem" }}>Quote verbatim from provider documentation. Will appear in report labeled as: "Provider documentation states:"</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                  <div><label style={lbl}>Self-Reported Information</label><textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={mc.selfReported} onChange={e => updateCondition(mc.id, "selfReported", e.target.value)} placeholder="Information reported by examinee..." data-testid={`textarea-self-reported-${mc.id}`} /></div>
                  <div><label style={lbl}>Functional Limitations</label><textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={mc.functionalLimitations} onChange={e => updateCondition(mc.id, "functionalLimitations", e.target.value)} placeholder="Documented functional limitations..." data-testid={`textarea-functional-limitations-${mc.id}`} /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                  <div><label style={lbl}>Incapacitation Risk</label><select className="glass-input" style={inp} value={mc.incapacitationRisk} onChange={e => updateCondition(mc.id, "incapacitationRisk", e.target.value as IncapacitationRisk)} data-testid={`select-incapacitation-${mc.id}`}><option value="Yes">Yes</option><option value="Possible">Possible</option><option value="No">No</option><option value="Unclear">Unclear</option></select></div>
                  <div><label style={lbl}>Recurrence Risk</label><select className="glass-input" style={inp} value={mc.recurrenceRisk} onChange={e => updateCondition(mc.id, "recurrenceRisk", e.target.value as RecurrenceRisk)} data-testid={`select-recurrence-${mc.id}`}><option value="High">High</option><option value="Moderate">Moderate</option><option value="Low">Low</option><option value="Unclear">Unclear</option></select></div>
                  <div><label style={lbl}>Restrictions/Accommodations</label><input className="glass-input" style={inp} value={mc.restrictions} onChange={e => updateCondition(mc.id, "restrictions", e.target.value)} placeholder="Documented restrictions..." data-testid={`input-restrictions-${mc.id}`} /></div>
                  <div><label style={lbl}>Monitoring Requirements</label><input className="glass-input" style={inp} value={mc.monitoringRequirements} onChange={e => updateCondition(mc.id, "monitoringRequirements", e.target.value)} placeholder="Follow-up schedule..." data-testid={`input-monitoring-${mc.id}`} /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.875rem" }}>
                  {([
                    ["refrigerationNeeded", "Medication Refrigeration Required"],
                    ["specialtyFollowUp", "Specialty Follow-Up Required"],
                    ["emergencyAccessNeeded", "Emergency Access Needed"],
                  ] as [keyof MedicalCondition, string][]).map(([field, label]) => (
                    <label key={field} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.5rem 0.75rem", borderRadius: "8px", background: mc[field] ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${mc[field] ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.07)"}`, fontSize: "0.8125rem", color: mc[field] ? "#00d4ff" : "rgba(255,255,255,0.55)", fontWeight: 500 }} data-testid={`checkbox-${field}-${mc.id}`}>
                      <input type="checkbox" checked={!!mc[field]} onChange={e => updateCondition(mc.id, field, e.target.checked)} style={{ accentColor: "#00d4ff" }} />
                      {label}
                    </label>
                  ))}
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <label style={lbl}>Additional Notes</label>
                  <textarea className="glass-input" style={{ ...inp, minHeight: "60px", resize: "vertical" }} value={mc.notes} onChange={e => updateCondition(mc.id, "notes", e.target.value)} placeholder="SME notes on this condition..." data-testid={`textarea-condition-notes-${mc.id}`} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
