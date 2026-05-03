import { SMECase } from "@/lib/types";

interface Props { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void; }

export default function EssentialFunctions({ caseData, onUpdate }: Props) {
  const jd = caseData.jobDuties;

  const items = jd.essentialFunctions
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  function addFromPrompt(value: string) {
    const next = [jd.essentialFunctions.trim(), value.trim()].filter(Boolean).join("\n");
    onUpdate({ jobDuties: { ...jd, essentialFunctions: next } });
  }

  return (
    <div className="glass-card" style={{ padding: "1.25rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Essential Job Functions
        </div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: "0.125rem" }}>List the essential job functions for this position</h2>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
          Add the core duties required to perform the role. These can be used in review and reporting.
        </p>
      </div>

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
        {["Lift and carry materials", "Stand and walk for extended periods", "Operate equipment or machinery", "Make timely safety decisions"].map(v => (
          <button
            key={v}
            className="glass-card"
            style={{ padding: "0.8rem 0.9rem", textAlign: "left", color: "#fff", border: "1px solid rgba(180,215,208,0.12)", cursor: "pointer" }}
            onClick={() => addFromPrompt(v)}
          >
            {v}
          </button>
        ))}
      </div>

      <textarea
        className="glass-input"
        style={{ width: "100%", minHeight: "220px", padding: "0.75rem 0.9rem", fontSize: "0.875rem", resize: "vertical" }}
        value={jd.essentialFunctions}
        onChange={e => onUpdate({ jobDuties: { ...jd, essentialFunctions: e.target.value } })}
        placeholder="Enter essential job functions, one per line..."
        data-testid="textarea-essential-job-functions"
      />

      <div style={{ marginTop: "0.875rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>
        {items.length} function{items.length === 1 ? "" : "s"} listed
      </div>
    </div>
  );
}