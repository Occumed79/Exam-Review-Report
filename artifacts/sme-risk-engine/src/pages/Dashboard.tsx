import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plus, Search, Copy, Trash2, ExternalLink, TrendingUp,
  FileText, AlertTriangle, CheckCircle, Clock
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip
} from "recharts";
import { SMECase, CaseStatus } from "@/lib/types";
import { generateCaseId } from "@/lib/store";

interface DashboardProps {
  cases: SMECase[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const STATUS_META: Record<CaseStatus, { cls: string; label: string }> = {
  "Draft": { cls: "badge-draft", label: "Draft" },
  "Needs Records": { cls: "badge-needs-records", label: "Needs Records" },
  "Risk Review Needed": { cls: "badge-risk-review", label: "Risk Review Needed" },
  "Ready for SME": { cls: "badge-ready", label: "Ready for SME" },
  "SME Reviewed": { cls: "badge-reviewed", label: "SME Reviewed" },
  "Finalized": { cls: "badge-finalized", label: "Finalized" },
};

const EXAM_LABELS: Record<string, string> = {
  "pre-employment": "Pre-Employment",
  "annual": "Annual",
  "deployment": "Deployment",
  "firefighter": "Firefighter",
  "aviation": "Aviation",
  "law-enforcement": "Law Enforcement",
  "dot-fmcsa": "DOT/FMCSA",
  "return-to-work": "Return-to-Work",
  "fitness-for-duty": "Fitness for Duty",
  "other": "Other",
};

function getDocConfidence(c: SMECase): number {
  let score = 100;
  const gaps = c.documentationGaps.filter(g => !g.custom).length;
  const unclearConditions = c.medicalConditions.filter(m => m.status === "unclear" || m.status === "uncontrolled").length;
  const missingQuotes = c.medicalConditions.filter(m => !m.providerQuote).length;
  score -= gaps * 10;
  score -= unclearConditions * 8;
  score -= missingQuotes * 5;
  return Math.max(0, Math.min(100, score));
}

function getRiskSummary(c: SMECase): number {
  if (c.riskScores.length === 0) {
    // Auto-estimate
    let r = 0;
    r += c.medicalConditions.filter(m => m.status === "active" || m.status === "uncontrolled").length * 15;
    r += c.medicalConditions.filter(m => m.incapacitationRisk === "Yes").length * 20;
    r += c.medicalConditions.filter(m => m.incapacitationRisk === "Possible").length * 10;
    r += c.documentationGaps.length * 5;
    return Math.min(100, r);
  }
  const numericScores = c.riskScores
    .map(s => (s.score === "U" ? 2 : (s.score as number)))
    .filter(s => typeof s === "number");
  if (numericScores.length === 0) return 0;
  return Math.round((numericScores.reduce((a, b) => a + b, 0) / (numericScores.length * 3)) * 100);
}

function getRiskColor(pct: number): string {
  if (pct >= 60) return "#7f9d96";
  if (pct >= 35) return "#d6c8aa";
  if (pct >= 15) return "#a7c7be";
  return "#b4d7d0";
}

export default function Dashboard({ cases, onDelete, onDuplicate }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = cases.filter(c => {
    const q = search.toLowerCase();
    const matchSearch =
      c.caseId.toLowerCase().includes(q) ||
      c.examineeName.toLowerCase().includes(q) ||
      c.jobTitle.toLowerCase().includes(q) ||
      c.employer.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const total = cases.length;
  const pendingReview = cases.filter(c => c.status === "Risk Review Needed" || c.status === "Needs Records").length;
  const highRiskCount = cases.filter(c => getRiskSummary(c) >= 50).length;
  const gapCount = cases.reduce((sum, c) => sum + c.documentationGaps.length, 0);

  // Radar data across all cases
  const radarData = [
    { subject: "Medical Stability", A: cases.reduce((s, c) => s + (c.medicalConditions.filter(m => m.status === "active").length > 0 ? 2 : 0), 0) },
    { subject: "Safety Sensitive", A: cases.reduce((s, c) => s + (c.medicalConditions.filter(m => m.incapacitationRisk === "Yes" || m.incapacitationRisk === "Possible").length > 0 ? 2 : 0), 0) },
    { subject: "Deployment Risk", A: cases.filter(c => c.deploymentCountry).length },
    { subject: "Doc Gaps", A: cases.filter(c => c.documentationGaps.length > 0).length },
    { subject: "Medications", A: cases.reduce((s, c) => s + (c.medicalConditions.filter(m => m.currentMedications).length > 0 ? 1 : 0), 0) },
    { subject: "Functional", A: cases.reduce((s, c) => s + (c.injuries.filter(i => i.residualPain > 3).length > 0 ? 1 : 0), 0) },
  ];

  return (
    <div data-testid="dashboard-page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
            Case Dashboard
          </h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)" }}>
            Occupational Health Risk Intelligence — SME Review Portal
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="glow-btn glow-btn-secondary"
            onClick={() => {
              // Open Secure Ingestion Modal (we'll mount it in App.tsx or here)
              window.dispatchEvent(new CustomEvent('open-secure-ingest'));
            }}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(180, 215, 208, 0.15)", border: "1px solid rgba(180, 215, 208, 0.3)", color: "#b4d7d0" }}
          >
            <Shield size={16} />
            Secure Ingest
          </button>
          <button
            className="glow-btn"
            onClick={() => setLocation(`/case/new`)}
            data-testid="btn-new-case"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Plus size={16} />
            New Case
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
        {[
          { label: "Total Cases", value: total, icon: FileText, color: "#b4d7d0", sub: "in system" },
          { label: "Pending Review", value: pendingReview, icon: Clock, color: "#d6c8aa", sub: "needs attention" },
          { label: "High Risk Flags", value: highRiskCount, icon: AlertTriangle, color: "#7f9d96", sub: "cases flagged" },
          { label: "Documentation Gaps", value: gapCount, icon: TrendingUp, color: "#a7c7be", sub: "across all cases" },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="glass-card" style={{ padding: "1.25rem" }} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.375rem", fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>{sub}</div>
              </div>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}1a`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}30` }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem", marginBottom: "1.75rem" }}>
        {/* Filters */}
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                className="glass-input"
                placeholder="Search cases by ID, name, job title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                data-testid="input-search-cases"
                style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2.25rem", fontSize: "0.875rem" }}
              />
            </div>
            <select
              className="glass-input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              data-testid="select-status-filter"
              style={{ padding: "0.5rem 0.875rem", fontSize: "0.875rem", cursor: "pointer" }}
            >
              <option value="all">All Statuses</option>
              {Object.keys(STATUS_META).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {filtered.length === 0 && search && (
            <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.35)", fontSize: "0.875rem" }}>
              No cases match "{search}"
            </div>
          )}
        </div>

        {/* Radar */}
        <div className="glass-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Portfolio Risk Profile
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={radarData} outerRadius={60}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.45)" }} />
              <Radar dataKey="A" stroke="#b4d7d0" fill="#b4d7d0" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip
                contentStyle={{ background: "rgba(10,15,30,0.9)", border: "1px solid rgba(180,215,208,0.2)", borderRadius: "8px", fontSize: "0.75rem", color: "#fff" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cases Grid */}
      {filtered.length === 0 && !search ? (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
          <FileText size={40} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 1rem" }} />
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>No cases yet</div>
          <div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.3)", marginBottom: "1.5rem" }}>Create your first case to get started</div>
          <button className="glow-btn" onClick={() => setLocation("/case/new")} data-testid="btn-create-first-case">
            <Plus size={14} style={{ display: "inline", marginRight: "0.375rem" }} />
            New Case
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1rem" }}>
          {filtered.map(c => {
            const statusMeta = STATUS_META[c.status];
            const riskPct = getRiskSummary(c);
            const docConf = getDocConfidence(c);
            const riskColor = getRiskColor(riskPct);
            return (
              <div
                key={c.id}
                className="glass-card"
                style={{ padding: "1.25rem", cursor: "pointer", position: "relative" }}
                onClick={() => setLocation(`/case/${c.id}`)}
                data-testid={`case-card-${c.id}`}
              >
                {/* Status + demo badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
                  <span className={statusMeta.cls} style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "0.2rem 0.625rem", borderRadius: "6px" }}>
                    {statusMeta.label}
                  </span>
                  <span style={{ fontSize: "0.6875rem", background: "rgba(180,215,208,0.12)", color: "#b4d7d0", border: "1px solid rgba(180,215,208,0.25)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontWeight: 600 }}>
                    {EXAM_LABELS[c.examType] || c.examType}
                  </span>
                  {c.notes?.startsWith("DEMO") && (
                    <span style={{ fontSize: "0.6rem", background: "rgba(214,200,170,0.1)", color: "#d6c8aa", border: "1px solid rgba(214,200,170,0.2)", padding: "0.15rem 0.4rem", borderRadius: "4px", fontWeight: 600, letterSpacing: "0.05em" }}>
                      DEMO
                    </span>
                  )}
                </div>

                {/* Name + job */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(180,215,208,0.2), rgba(244,239,220,0.2))", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.75rem", fontWeight: 700, color: "#b4d7d0", flexShrink: 0 }}>
                      {c.examineeName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#fff" }}>{c.examineeName}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>{c.jobTitle} · {c.employer}</div>
                    </div>
                  </div>
                </div>

                {/* Case ID + dates */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem", marginBottom: "0.875rem", fontSize: "0.75rem" }}>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.125rem" }}>Case ID</div>
                    <div style={{ color: "#b4d7d0", fontFamily: "monospace", fontWeight: 600 }}>{c.caseId}</div>
                  </div>
                  {c.deploymentCountry && (
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.125rem" }}>Deployment</div>
                      <div style={{ color: "#d6c8aa", fontWeight: 600 }}>{c.deploymentCountry}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.125rem" }}>Standard</div>
                    <div style={{ color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.agencyStandard || "—"}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.125rem" }}>Updated</div>
                    <div style={{ color: "rgba(255,255,255,0.5)" }}>{new Date(c.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Risk + Doc confidence */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.875rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Risk Level</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: riskColor }}>{riskPct}%</span>
                    </div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${riskPct}%`, background: riskColor, borderRadius: "2px", transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Doc Confidence</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#b4d7d0" }}>{docConf}%</span>
                    </div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${docConf}%`, background: "#b4d7d0", borderRadius: "2px", transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                </div>

                {/* Conditions tags */}
                {c.medicalConditions.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.75rem" }}>
                    {c.medicalConditions.slice(0, 3).map(m => (
                      <span key={m.id} style={{ fontSize: "0.625rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: "rgba(180,215,208,0.08)", color: "#b4d7d0", border: "1px solid rgba(180,215,208,0.15)", fontWeight: 500 }}>
                        {m.conditionName}
                      </span>
                    ))}
                    {c.medicalConditions.length > 3 && (
                      <span style={{ fontSize: "0.625rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                        +{c.medicalConditions.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div
                  style={{ display: "flex", gap: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="glow-btn"
                    onClick={() => setLocation(`/case/${c.id}`)}
                    data-testid={`btn-open-case-${c.id}`}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", fontSize: "0.8125rem", padding: "0.4rem 0.75rem" }}
                  >
                    <ExternalLink size={13} />
                    Open
                  </button>
                  <button
                    className="glow-btn glow-btn-secondary"
                    onClick={() => onDuplicate(c.id)}
                    data-testid={`btn-duplicate-case-${c.id}`}
                    style={{ padding: "0.4rem 0.625rem" }}
                    title="Duplicate case"
                  >
                    <Copy size={13} />
                  </button>
                  {confirmDelete === c.id ? (
                    <button
                      className="glow-btn glow-btn-danger"
                      onClick={() => { onDelete(c.id); setConfirmDelete(null); }}
                      data-testid={`btn-confirm-delete-${c.id}`}
                      style={{ padding: "0.4rem 0.625rem", fontSize: "0.75rem" }}
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      className="glow-btn glow-btn-secondary"
                      onClick={() => setConfirmDelete(c.id)}
                      data-testid={`btn-delete-case-${c.id}`}
                      style={{ padding: "0.4rem 0.625rem" }}
                      title="Delete case"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
