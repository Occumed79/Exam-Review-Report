import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { SMECase, InjuryRecord, DocumentationConfidence } from "@/lib/types";
import { generateId } from "@/lib/store";

function blank(): InjuryRecord {
  return {
    id: generateId(), injuryType: "", bodyRegion: "", dateOfInjury: "",
    mechanism: "", treatmentReceived: "", surgeriesPerformed: "",
    ptReceived: false, imagingType: "", residualPain: 0, residualWeakness: "",
    romLimitation: "", workRestrictions: "", reinjuryRisk: "Unclear",
    jobDutyRelevance: "", providerQuote: "", documentationConfidence: "partial"
  };
}

interface Props { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void; }

const BODY_REGIONS = [
  "Head/Skull","Neck/Cervical Spine","Shoulder — Left","Shoulder — Right","Upper Arm — Left","Upper Arm — Right",
  "Elbow — Left","Elbow — Right","Forearm/Wrist — Left","Forearm/Wrist — Right","Hand/Fingers — Left","Hand/Fingers — Right",
  "Thoracic Spine","Lumbar Spine","Sacrum/Coccyx","Hip — Left","Hip — Right","Knee — Left","Knee — Right",
  "Lower Leg — Left","Lower Leg — Right","Ankle/Foot — Left","Ankle/Foot — Right","Abdomen","Chest/Thorax","Pelvis","Multiple Regions","Other"
];

export default function InjuryHistory({ caseData, onUpdate }: Props) {
  const [expanded, setExpanded] = useState<string | null>(caseData.injuries[0]?.id ?? null);

  function add() {
    const ni = blank();
    onUpdate({ injuries: [...caseData.injuries, ni] });
    setExpanded(ni.id);
  }
  function remove(id: string) {
    const updated = caseData.injuries.filter(x => x.id !== id);
    onUpdate({ injuries: updated });
    if (expanded === id) setExpanded(updated[0]?.id ?? null);
  }
  function upd(id: string, field: keyof InjuryRecord, value: unknown) {
    onUpdate({ injuries: caseData.injuries.map(x => x.id === id ? { ...x, [field]: value } : x) });
  }

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" };
  const inp = { width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8125rem" };

  const CONF_COLORS: Record<DocumentationConfidence, string> = {
    documented: "#22c55e", partial: "#f59e0b", unclear: "#f97316", missing: "#ef4444"
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: "0.125rem" }}>Injury & Surgical History</h2>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>Document occupationally relevant injury and surgical history with functional impact assessment.</p>
        </div>
        <button className="glow-btn" onClick={add} data-testid="btn-add-injury" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem" }}>
          <Plus size={14} />
          Add Injury/Surgery
        </button>
      </div>

      {caseData.injuries.length === 0 && (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "0.875rem" }}>No injury or surgical history entered</div>
          <button className="glow-btn" onClick={add} data-testid="btn-add-first-injury">Add Record</button>
        </div>
      )}

      {caseData.injuries.map((inj, idx) => {
        const isOpen = expanded === inj.id;
        const confColor = CONF_COLORS[inj.documentationConfidence];
        return (
          <div key={inj.id} className="glass-card" style={{ marginBottom: "0.875rem" }} data-testid={`injury-card-${inj.id}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem 1.25rem", cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : inj.id)}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: confColor, flexShrink: 0, boxShadow: `0 0 6px ${confColor}80` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#fff" }}>{inj.injuryType || `Injury/Surgery ${idx + 1}`}</div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                  {inj.bodyRegion && <span style={{ fontSize: "0.6875rem", color: "#b4d7d0", fontWeight: 500 }}>{inj.bodyRegion}</span>}
                  {inj.dateOfInjury && <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>{inj.dateOfInjury}</span>}
                  <span style={{ fontSize: "0.6875rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: `${confColor}15`, color: confColor, fontWeight: 600 }}>{inj.documentationConfidence}</span>
                  {inj.residualPain > 0 && <span style={{ fontSize: "0.6875rem", color: inj.residualPain >= 5 ? "#ef4444" : "#f59e0b" }}>Pain: {inj.residualPain}/10</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button className="glow-btn glow-btn-secondary" onClick={e => { e.stopPropagation(); remove(inj.id); }} data-testid={`btn-delete-injury-${inj.id}`} style={{ padding: "0.3rem 0.5rem" }}><Trash2 size={12} /></button>
                {isOpen ? <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />}
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
                  <div><label style={lbl}>Injury/Surgery Type</label><input className="glass-input" style={inp} value={inj.injuryType} onChange={e => upd(inj.id, "injuryType", e.target.value)} placeholder="e.g., Lumbar disc herniation, ACL tear, Appendectomy" data-testid={`input-injury-type-${inj.id}`} /></div>
                  <div><label style={lbl}>Body Region</label><select className="glass-input" style={inp} value={inj.bodyRegion} onChange={e => upd(inj.id, "bodyRegion", e.target.value)} data-testid={`select-body-region-${inj.id}`}><option value="">— Select —</option>{BODY_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                  <div><label style={lbl}>Date of Injury</label><input type="date" className="glass-input" style={inp} value={inj.dateOfInjury} onChange={e => upd(inj.id, "dateOfInjury", e.target.value)} data-testid={`input-injury-date-${inj.id}`} /></div>
                  <div><label style={lbl}>Documentation</label><select className="glass-input" style={inp} value={inj.documentationConfidence} onChange={e => upd(inj.id, "documentationConfidence", e.target.value as DocumentationConfidence)} data-testid={`select-doc-confidence-${inj.id}`}><option value="documented">Documented</option><option value="partial">Partial</option><option value="unclear">Unclear</option><option value="missing">Missing</option></select></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                  <div><label style={lbl}>Mechanism of Injury</label><input className="glass-input" style={inp} value={inj.mechanism} onChange={e => upd(inj.id, "mechanism", e.target.value)} placeholder="How the injury occurred" data-testid={`input-mechanism-${inj.id}`} /></div>
                  <div><label style={lbl}>Treatment Received</label><input className="glass-input" style={inp} value={inj.treatmentReceived} onChange={e => upd(inj.id, "treatmentReceived", e.target.value)} placeholder="Conservative treatment, surgical, etc." data-testid={`input-treatment-${inj.id}`} /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.75rem", alignItems: "end" }}>
                  <div><label style={lbl}>Surgery Details</label><input className="glass-input" style={inp} value={inj.surgeriesPerformed} onChange={e => upd(inj.id, "surgeriesPerformed", e.target.value)} placeholder="Procedure name / date" data-testid={`input-surgery-${inj.id}`} /></div>
                  <div><label style={lbl}>Imaging</label><input className="glass-input" style={inp} value={inj.imagingType} onChange={e => upd(inj.id, "imagingType", e.target.value)} placeholder="MRI/X-ray/CT + findings" data-testid={`input-imaging-${inj.id}`} /></div>
                  <div><label style={lbl}>Residual Pain (0-10)</label><input type="number" min="0" max="10" className="glass-input" style={inp} value={inj.residualPain} onChange={e => upd(inj.id, "residualPain", Number(e.target.value))} data-testid={`input-residual-pain-${inj.id}`} /></div>
                  <div><label style={lbl}>Residual Weakness</label><select className="glass-input" style={inp} value={inj.residualWeakness} onChange={e => upd(inj.id, "residualWeakness", e.target.value)} data-testid={`select-weakness-${inj.id}`}><option value="">—</option><option value="None">None</option><option value="Mild">Mild</option><option value="Moderate">Moderate</option><option value="Severe">Severe</option><option value="Unclear">Unclear</option></select></div>
                  <div><label style={lbl}>ROM Limitation</label><input className="glass-input" style={inp} value={inj.romLimitation} onChange={e => upd(inj.id, "romLimitation", e.target.value)} placeholder="Describe limitation" data-testid={`input-rom-${inj.id}`} /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.75rem", alignItems: "end" }}>
                  <div><label style={lbl}>Work Restrictions</label><input className="glass-input" style={inp} value={inj.workRestrictions} onChange={e => upd(inj.id, "workRestrictions", e.target.value)} placeholder="Current documented restrictions" data-testid={`input-work-restrictions-${inj.id}`} /></div>
                  <div><label style={lbl}>Reinjury Risk</label><select className="glass-input" style={inp} value={inj.reinjuryRisk} onChange={e => upd(inj.id, "reinjuryRisk", e.target.value)} data-testid={`select-reinjury-risk-${inj.id}`}><option value="High">High</option><option value="Moderate">Moderate</option><option value="Low">Low</option><option value="Unclear">Unclear</option></select></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ ...lbl, margin: 0 }}>PT Received</label>
                    <input type="checkbox" checked={inj.ptReceived} onChange={e => upd(inj.id, "ptReceived", e.target.checked)} style={{ accentColor: "#b4d7d0", width: "16px", height: "16px" }} data-testid={`checkbox-pt-${inj.id}`} />
                  </div>
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <label style={lbl}>Job Duty Relevance</label>
                  <textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={inj.jobDutyRelevance} onChange={e => upd(inj.id, "jobDutyRelevance", e.target.value)} placeholder="How this injury may relate to essential job functions..." data-testid={`textarea-job-relevance-${inj.id}`} />
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <label style={lbl}>Provider Documentation Quote</label>
                  <textarea className="glass-input" style={{ ...inp, minHeight: "80px", resize: "vertical", borderColor: "rgba(180,215,208,0.2)" }} value={inj.providerQuote} onChange={e => upd(inj.id, "providerQuote", e.target.value)} placeholder='"Provider documentation states: [direct quote from treating provider]..."' data-testid={`textarea-injury-quote-${inj.id}`} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
