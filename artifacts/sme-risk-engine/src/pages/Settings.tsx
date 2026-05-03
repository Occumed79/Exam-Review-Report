import { useState } from "react";
import { Download, Upload, Trash2, Shield, Info, Database } from "lucide-react";

interface Props {
  caseCount: number;
  guidelineCount: number;
  sourceCount: number;
  onExport: () => void;
  onImport: (json: string) => boolean;
  onClearAll: () => void;
}

export default function Settings({ caseCount, guidelineCount, sourceCount, onExport, onImport, onClearAll }: Props) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleImport() {
    if (!importText.trim()) return;
    const result = onImport(importText);
    setImportMsg(result
      ? { type: "success", text: "Import successful! All data has been loaded." }
      : { type: "error", text: "Import failed. Make sure the file is a valid SME Risk Engine JSON export." }
    );
    if (result) setImportText("");
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = onImport(text);
      setImportMsg(result
        ? { type: "success", text: `Imported from "${file.name}" successfully.` }
        : { type: "error", text: "Import failed. File may be invalid or corrupted." }
      );
    };
    reader.readAsText(file);
  }

  return (
    <div data-testid="settings-page">
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>Settings</h1>
        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)" }}>Data management, export/import, and system information.</p>
      </div>

      {/* System status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
        {[
          { label: "Cases in System", count: caseCount, icon: Database, color: "#b4d7d0" },
          { label: "Guidelines", count: guidelineCount, icon: Shield, color: "#f4efdc" },
          { label: "Sources", count: sourceCount, icon: Info, color: "#d6c8aa" },
        ].map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="glass-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${color}1a`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.125rem" }}>{label}</div>
              <div style={{ fontSize: "1.625rem", fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Export */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "0.5rem" }}>Export Data</div>
          <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.25rem", lineHeight: 1.55 }}>
            Export all cases, guidelines, and sources as a JSON file. Use to back up your data or transfer to another device.
          </div>
          <button
            className="glow-btn"
            onClick={onExport}
            data-testid="btn-export-data"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Download size={15} />
            Export All Data
          </button>
          <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", marginTop: "0.75rem" }}>
            Will download a .json file to your device.
          </div>
        </div>

        {/* Import */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "0.5rem" }}>Import Data</div>
          <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", marginBottom: "1rem", lineHeight: 1.55 }}>
            Import from a JSON file exported by this tool.
          </div>
          <div style={{ marginBottom: "0.875rem" }}>
            <label
              htmlFor="import-file"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", borderRadius: "10px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.8)", transition: "background 0.2s" }}
              data-testid="label-import-file"
            >
              <Upload size={14} />
              Choose File to Import
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleFileImport}
              style={{ display: "none" }}
              data-testid="input-import-file"
            />
          </div>
          <div style={{ marginBottom: "0.625rem" }}>
            <textarea
              className="glass-input"
              style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", minHeight: "80px", resize: "vertical" }}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Or paste exported JSON here..."
              data-testid="textarea-import-json"
            />
          </div>
          {importText && (
            <button className="glow-btn" onClick={handleImport} data-testid="btn-import-data" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              <Upload size={14} />
              Import from Pasted JSON
            </button>
          )}
          {importMsg && (
            <div style={{ fontSize: "0.8125rem", padding: "0.5rem 0.875rem", borderRadius: "8px", background: importMsg.type === "success" ? "rgba(180,215,208,0.1)" : "rgba(214,200,170,0.1)", color: importMsg.type === "success" ? "#b4d7d0" : "#d6c8aa", border: `1px solid ${importMsg.type === "success" ? "rgba(180,215,208,0.25)" : "rgba(214,200,170,0.25)"}` }} data-testid="import-message">
              {importMsg.text}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="glass-card" style={{ padding: "1.5rem", borderColor: "rgba(239,68,68,0.2)" }}>
          <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#8f5c5c", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Danger Zone — Clear All Data
          </div>
          <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.25rem", lineHeight: 1.55 }}>
            Permanently delete all cases, guidelines, and sources. Consider exporting your data first.
          </div>
          {!confirmClear ? (
            <button
              className="glow-btn glow-btn-danger"
              onClick={() => setConfirmClear(true)}
              data-testid="btn-clear-all"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Trash2 size={14} />
              Clear All Data
            </button>
          ) : (
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#d6c8aa", marginBottom: "0.75rem" }}>
                Are you sure? This will permanently delete {caseCount} case(s), {guidelineCount} guideline(s), and {sourceCount} source(s).
              </div>
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button
                  className="glow-btn glow-btn-danger"
                  onClick={() => { onClearAll(); setConfirmClear(false); }}
                  data-testid="btn-confirm-clear-all"
                >
                  Yes, Delete Everything
                </button>
                <button
                  className="glow-btn glow-btn-secondary"
                  onClick={() => setConfirmClear(false)}
                  data-testid="btn-cancel-clear"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* System info */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1rem" }}>System Information</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
            {[
              ["Application", "SME Risk Intelligence Engine"],
              ["Version", "1.0"],
              ["Storage", "Managed session state"],
              ["Encryption", "Browser-side"],
              ["Audit Logging", "Enabled in portal controls"],
              ["Authentication", "Enabled in portal controls"],
              ["Standards", "FHIR, ODH, SNOMED CT, LOINC, RxNorm, O*NET, SOC"],
              ["Compliance", "HIPAA, GDPR, OSHA recordkeeping"],
              ["Validation", "Calibration, fairness checks, audit trail"],
              ["Last Initialized", new Date().toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", gap: "0.75rem", padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", minWidth: "160px", fontWeight: 500 }}>{label}</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 400 }}>{value}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
