import { useMemo, useRef, useState } from "react";
import { Clipboard, CheckCircle2, FileSearch, ShieldCheck, Upload, X } from "lucide-react";
import {
  processDocumentLocally,
  verifyScrubbed,
  type LocalProcessingResult,
} from "@/lib/localPDFProcessor";

const CATEGORY_LABELS: Record<string, string> = {
  examinee_name: "Examinee",
  dob: "Date of Birth",
  sex: "Sex",
  employer: "Employer",
  job_title: "Job Title",
  case_id: "Case ID",
  agency_standard: "Standard",
  deployment_country: "Deployment / AOR",
  medical_condition: "Medical Condition",
  lab_value: "Lab / Objective Value",
  medication: "Medication",
  job_duty: "Job Duty",
  injury: "Injury / Surgery",
  documentation_gap: "Documentation Gap",
  recommendation: "Recommendation",
  exam_date: "Exam Date",
};

export default function DocumentAssistant() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<LocalProcessingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);

  const verification = useMemo(
    () => (result ? verifyScrubbed(result.scrubbedText) : null),
    [result],
  );

  const grouped = useMemo(() => {
    if (!result) return [] as Array<[string, LocalProcessingResult["clinicalDataPoints"]]>;
    const map = new Map<string, LocalProcessingResult["clinicalDataPoints"]>();
    for (const point of result.clinicalDataPoints) {
      const current = map.get(point.category) || [];
      current.push(point);
      map.set(point.category, current);
    }
    return Array.from(map.entries());
  }, [result]);

  async function process(file: File) {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await processDocumentLocally(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to process this document.");
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    if (!result) return;
    await navigator.clipboard.writeText(result.scrubbedText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function clear() {
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.35rem" }}>
          <FileSearch size={22} style={{ color: "#b4d7d0" }} />
          <h1 style={{ margin: 0, fontSize: "1.55rem", color: "#fff", fontWeight: 800 }}>Document Review Assistant</h1>
        </div>
        <p style={{ margin: 0, maxWidth: 760, color: "rgba(255,255,255,0.48)", fontSize: "0.88rem", lineHeight: 1.6 }}>
          Extract useful review facts from a medical packet without creating a case or report. Use the output as a temporary reviewer aid, then copy only what you need into your normal workflow.
        </p>
      </div>

      {!result ? (
        <div className="glass-card" style={{ padding: "2rem", maxWidth: 760 }}>
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              border: "1px dashed rgba(180,215,208,0.35)",
              borderRadius: 14,
              padding: "3.5rem 2rem",
              textAlign: "center",
              cursor: "pointer",
              background: "rgba(180,215,208,0.035)",
            }}
          >
            <Upload size={38} style={{ color: "#b4d7d0", marginBottom: "0.85rem" }} />
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
              {loading ? "Processing document locally…" : "Choose a PDF or image"}
            </div>
            <div style={{ marginTop: "0.4rem", color: "rgba(255,255,255,0.42)", fontSize: "0.78rem" }}>
              PDF, JPG, PNG, TIFF, BMP, WEBP, or text
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,.bmp,.webp,.txt,.csv,.md"
              style={{ display: "none" }}
              disabled={loading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void process(file);
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", marginTop: "1rem", color: "rgba(255,255,255,0.46)", fontSize: "0.76rem", lineHeight: 1.5 }}>
            <ShieldCheck size={15} style={{ color: "#b4d7d0", flexShrink: 0, marginTop: 2 }} />
            Processing and first-pass redaction occur in the browser. Extracted values should still be checked against the source document before being relied on.
          </div>
          {error && <div style={{ marginTop: "1rem", color: "#fca5a5", fontSize: "0.8rem" }}>{error}</div>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(340px, 0.8fr)", gap: "1rem", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1rem 1.1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700 }}>{result.sourceFileName}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", marginTop: 3 }}>
                    {result.extractionMethod} · {result.clinicalDataPoints.length} extracted review items · {Math.round(result.redactionConfidence * 100)}% redaction confidence
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="glow-btn glow-btn-secondary" onClick={() => setShowSource((v) => !v)}>
                    {showSource ? "Hide Text" : "View Text"}
                  </button>
                  <button className="glow-btn glow-btn-secondary" onClick={clear} aria-label="Clear document">
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>

            {verification && (
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: 10,
                  background: verification.isSafe ? "rgba(180,215,208,0.07)" : "rgba(239,68,68,0.08)",
                  border: verification.isSafe ? "1px solid rgba(180,215,208,0.18)" : "1px solid rgba(239,68,68,0.2)",
                  color: "rgba(255,255,255,0.72)",
                  fontSize: "0.78rem",
                  display: "flex",
                  gap: "0.55rem",
                  alignItems: "flex-start",
                }}
              >
                <CheckCircle2 size={15} style={{ color: verification.isSafe ? "#b4d7d0" : "#fca5a5", marginTop: 1 }} />
                <span>
                  {verification.isSafe
                    ? "No remaining identifier pattern was detected by the local verification pass."
                    : `Review the scrubbed output before reusing it. Remaining suspicious patterns: ${verification.suspiciousPatterns.join(", ")}`}
                </span>
              </div>
            )}

            <div className="glass-card" style={{ padding: "1.15rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "0.8rem" }}>
                Extracted Review Facts
              </div>
              {grouped.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>No structured facts were confidently extracted.</div>
              ) : (
                <div style={{ display: "grid", gap: "0.65rem" }}>
                  {grouped.map(([category, points]) => (
                    <div key={category} style={{ padding: "0.75rem", borderRadius: 9, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "0.68rem", color: "#b4d7d0", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "0.4rem" }}>
                        {CATEGORY_LABELS[category] || category}
                      </div>
                      {points.map((point, index) => (
                        <div key={`${point.value}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.2rem 0", color: "rgba(255,255,255,0.75)", fontSize: "0.82rem" }}>
                          <span>{point.value}</span>
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", whiteSpace: "nowrap" }}>{Math.round(point.confidence * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showSource && (
              <div className="glass-card" style={{ padding: "1.15rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "0.8rem" }}>
                  Redacted Source Text
                </div>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.65)", fontSize: "0.75rem", lineHeight: 1.55, maxHeight: 420, overflow: "auto" }}>
                  {result.redactedText}
                </pre>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: "1.15rem", position: "sticky", top: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", marginBottom: "0.8rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                  Reusable Review Summary
                </div>
                <div style={{ marginTop: 3, color: "rgba(255,255,255,0.38)", fontSize: "0.68rem" }}>Temporary output — not a report</div>
              </div>
              <button className="glow-btn" onClick={() => void copySummary()} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                {copied ? <CheckCircle2 size={14} /> : <Clipboard size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.68)", fontSize: "0.73rem", lineHeight: 1.55, maxHeight: "72vh", overflow: "auto" }}>
              {result.scrubbedText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
