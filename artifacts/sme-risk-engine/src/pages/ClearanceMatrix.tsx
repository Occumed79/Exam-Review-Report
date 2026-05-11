import { useState, useMemo } from "react";
import {
  CheckCircle, XCircle, AlertCircle, HelpCircle,
  Filter, Download, Search, ChevronDown,
  Briefcase, Heart, Shield, Plane, Truck, Flame,
  FileText, Info
} from "lucide-react";
import type { SMECase, RiskScore } from "@/lib/types";

interface Props {
  cases: SMECase[];
}

type ClearanceStatus = "cleared" | "conditional" | "deferred" | "not-cleared" | "incomplete" | "pending";

const JOB_TYPES = [
  { id: "firefighter", label: "Firefighter", icon: Flame, short: "FF" },
  { id: "aviation", label: "Aviation", icon: Plane, short: "AV" },
  { id: "law-enforcement", label: "Law Enforcement", icon: Shield, short: "LE" },
  { id: "dot-fmcsa", label: "DOT / CDL", icon: Truck, short: "DOT" },
  { id: "deployment", label: "Int'l Deployment", icon: Briefcase, short: "DEP" },
  { id: "pre-employment", label: "Pre-Employment", icon: FileText, short: "PE" },
];

const STATUS_META: Record<ClearanceStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  cleared: { label: "Cleared", color: "#b4d7d0", bg: "rgba(180,215,208,0.10)", icon: CheckCircle },
  conditional: { label: "Conditional", color: "#94a3b8", bg: "rgba(148,163,184,0.10)", icon: AlertCircle },
  deferred: { label: "Deferred", color: "#64748b", bg: "rgba(100,116,139,0.10)", icon: HelpCircle },
  "not-cleared": { label: "Not Cleared", color: "#94a3b8", bg: "rgba(148,163,184,0.10)", icon: XCircle },
  incomplete: { label: "Incomplete", color: "#94a3b8", bg: "rgba(148,163,184,0.10)", icon: AlertCircle },
  pending: { label: "Pending Review", color: "#94a3b8", bg: "rgba(148,163,184,0.10)", icon: HelpCircle },
};

function maxScore(c: SMECase): RiskScore | null {
  if (!c.riskScores || c.riskScores.length === 0) return null;
  const nums = c.riskScores.map(r => r.score).filter((s): s is 0 | 1 | 2 | 3 => s !== "U");
  if (nums.length === 0) return null;
  return Math.max(...nums) as 0 | 1 | 2 | 3;
}

function deriveStatus(c: SMECase, _jobId: string): ClearanceStatus {
  const score = maxScore(c);
  const gaps = c.documentationGaps?.length ?? 0;

  if (c.status === "Draft" || c.status === "Needs Records") return "incomplete";
  if (c.status === "Risk Review Needed") return "deferred";

  if (gaps > 3) return "deferred";
  if (score === 3) return "not-cleared";
  if (score === 2 || score === 1) return "conditional";
  if (score === 0) return "cleared";
  return "pending";
}

function StatusCell({ status, compact }: { status: ClearanceStatus; compact?: boolean }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  if (compact) {
    return (
      <div
        title={meta.label}
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          background: meta.bg,
          border: `1px solid ${meta.color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "default",
        }}
      >
        <Icon size={14} style={{ color: meta.color }} />
      </div>
    );
  }
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.2rem 0.5rem",
        borderRadius: "5px",
        background: meta.bg,
        border: `1px solid ${meta.color}20`,
        fontSize: "0.6875rem",
        fontWeight: 600,
        color: "rgba(255,255,255,0.75)",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={11} />
      {meta.label}
    </div>
  );
}

function SummaryBar({ cases }: { cases: SMECase[] }) {
  const counts: Record<ClearanceStatus, number> = {
    cleared: 0, conditional: 0, deferred: 0, "not-cleared": 0, incomplete: 0, pending: 0,
  };
  cases.forEach(c => {
    JOB_TYPES.forEach(j => {
      counts[deriveStatus(c, j.id)]++;
    });
  });

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {(Object.entries(counts) as [ClearanceStatus, number][])
        .filter(([, n]) => n > 0)
        .map(([status, n]) => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          return (
            <div
              key={status}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "8px",
                background: meta.bg,
                border: `1px solid ${meta.color}20`,
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.72)",
                fontWeight: 600,
              }}
            >
              <Icon size={13} />
              <span style={{ fontSize: "1rem", fontWeight: 800 }}>{n}</span>
              <span style={{ opacity: 0.75, fontSize: "0.6875rem" }}>{meta.label}</span>
            </div>
          );
        })}
    </div>
  );
}

export default function ClearanceMatrix({ cases }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ClearanceStatus | "all">("all");
  const [selectedCase, setSelectedCase] = useState<SMECase | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return cases.filter(c => {
      const matchSearch = !search ||
        c.examineeName.toLowerCase().includes(search.toLowerCase()) ||
        c.caseId.toLowerCase().includes(search.toLowerCase()) ||
        c.jobTitle.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filterStatus !== "all") {
        const hasStatus = JOB_TYPES.some(j => deriveStatus(c, j.id) === filterStatus);
        if (!hasStatus) return false;
      }

      return true;
    });
  }, [cases, search, filterStatus]);

  const getCaseRiskBadge = (c: SMECase) => {
    const s = maxScore(c);
    if (s !== null) return { label: `Score ${s}`, color: "#b4d7d0" };
    return { label: "Unscored", color: "#94a3b8" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "1rem" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              Clearance Matrix
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", margin: "0.25rem 0 0", lineHeight: 1.5 }}>
              Cross-case fitness overview by exam type.
            </p>
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5rem 0.875rem",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            padding: "0.5rem 0.875rem",
            background: "rgba(180,215,208,0.06)",
            border: "1px solid rgba(180,215,208,0.18)",
            borderRadius: "8px",
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.72)",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <Info size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>
            Matrix statuses are <strong>algorithmically derived</strong> from risk scores and documentation status for SME orientation only. 
            Final clearance determinations must be made by a qualified examiner based on full case review.
          </span>
        </div>

        {/* Summary bar */}
        {cases.length > 0 && <SummaryBar cases={filtered} />}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cases, examinee, job title…"
            style={{
              width: "100%",
              paddingLeft: "2.25rem",
              paddingRight: "0.75rem",
              paddingTop: "0.5rem",
              paddingBottom: "0.5rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "0.8125rem",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 0.875rem",
            borderRadius: "8px",
            background: showFilters ? "rgba(180,215,208,0.1)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${showFilters ? "rgba(180,215,208,0.3)" : "rgba(255,255,255,0.1)"}`,
            color: showFilters ? "#b4d7d0" : "rgba(255,255,255,0.6)",
            fontSize: "0.8125rem",
            cursor: "pointer",
          }}
        >
          <Filter size={13} />
          Filters
          <ChevronDown size={12} style={{ transform: showFilters ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
        </button>

        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>
          {filtered.length} case{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {showFilters && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", width: "100%", marginBottom: "0.25rem" }}>Filter by status (any column)</div>
          {(["all", ...Object.keys(STATUS_META)] as (ClearanceStatus | "all")[]).map(s => {
            const active = filterStatus === s;
            const meta = s !== "all" ? STATUS_META[s] : null;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "0.3rem 0.625rem",
                  borderRadius: "6px",
                  background: active ? (meta?.bg ?? "rgba(180,215,208,0.1)") : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? (meta?.color ?? "#b4d7d0") + "50" : "rgba(255,255,255,0.08)"}`,
                  color: active ? (meta?.color ?? "#b4d7d0") : "rgba(255,255,255,0.5)",
                  fontSize: "0.75rem",
                  fontWeight: active ? 700 : 400,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {s === "all" ? "All Statuses" : STATUS_META[s].label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {cases.length === 0 ? (
          <div
            className="glass-card"
            style={{ textAlign: "center", padding: "4rem 2rem" }}
          >
            <Heart size={40} style={{ color: "rgba(255,255,255,0.15)", marginBottom: "1rem" }} />
            <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>
              No cases yet
            </div>
            <div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.25)" }}>
              Create a case from the dashboard to see it in the clearance matrix.
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>
            No cases match your search or filter.
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", minWidth: "200px" }}>
                      Examinee / Case
                    </th>
                    <th style={{ textAlign: "center", padding: "0.75rem 0.75rem", fontWeight: 700, fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      Risk Score
                    </th>
                    {JOB_TYPES.map(j => {
                      const Icon = j.icon;
                      return (
                        <th
                          key={j.id}
                          style={{
                            textAlign: "center",
                            padding: "0.75rem 0.625rem",
                            fontWeight: 700,
                            fontSize: "0.6875rem",
                            color: "rgba(255,255,255,0.4)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                            <Icon size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
                            {j.short}
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ textAlign: "left", padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => {
                    const risk = getCaseRiskBadge(c);
                    const isSelected = selectedCase?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCase(isSelected ? null : c)}
                        style={{
                          background: isSelected
                            ? "rgba(180,215,208,0.05)"
                            : idx % 2 === 0
                            ? "transparent"
                            : "rgba(255,255,255,0.015)",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                      >
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.875rem" }}>{c.examineeName}</div>
                          <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", marginTop: "0.125rem" }}>
                            {c.caseId} · {c.jobTitle}
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 0.75rem", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "5px",
                              background: `${risk.color}15`,
                              border: `1px solid ${risk.color}30`,
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              color: risk.color,
                            }}
                          >
                            {risk.label}
                          </span>
                        </td>
                        {JOB_TYPES.map(j => (
                          <td key={j.id} style={{ padding: "0.5rem 0.625rem", textAlign: "center" }}>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                              <StatusCell status={deriveStatus(c, j.id)} compact />
                            </div>
                          </td>
                        ))}
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "5px",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              color: "rgba(255,255,255,0.5)",
                              textTransform: "capitalize",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Expanded row detail */}
            {selectedCase && (
              <div
                style={{
                  padding: "1.25rem 1.25rem",
                  borderTop: "1px solid rgba(180,215,208,0.2)",
                  background: "rgba(180,215,208,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#fff" }}>{selectedCase.examineeName}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>— Detailed Matrix View</div>
                  <button
                    onClick={() => setSelectedCase(null)}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.75rem" }}
                  >
                    Close ×
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                  {JOB_TYPES.map(j => {
                    const status = deriveStatus(selectedCase, j.id);
                    const meta = STATUS_META[status];
                    const Icon = j.icon;
                    const StatusIcon = meta.icon;
                    return (
                      <div
                        key={j.id}
                        style={{
                          padding: "0.875rem",
                          borderRadius: "10px",
                          background: meta.bg,
                          border: `1px solid ${meta.color}25`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <Icon size={14} style={{ color: meta.color }} />
                          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fff" }}>{j.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <StatusIcon size={13} style={{ color: meta.color }} />
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: meta.color }}>{meta.label}</span>
                        </div>
                        <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", marginTop: "0.375rem" }}>
                          {status === "cleared" && "No major risk factors identified for this category."}
                          {status === "conditional" && "Risk factors present — review documentation before final determination."}
                          {status === "deferred" && "Awaiting additional records or specialist evaluation."}
                          {status === "not-cleared" && "Risk score indicates significant concern. Full SME review required."}
                          {status === "incomplete" && "Case data is incomplete — additional information needed."}
                          {status === "pending" && "Awaiting SME review."}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: "0.875rem",
                    padding: "0.625rem 0.875rem",
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: "7px",
                    fontSize: "0.6875rem",
                    color: "rgba(245,158,11,0.8)",
                    lineHeight: 1.5,
                  }}
                >
                  Statuses above are SME orientation aids derived from risk score and documentation status. They do not constitute final medical clearance determinations. A qualified examiner must review the full case before any determination is made.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="glass-card" style={{ padding: "0.75rem 1rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
          Status Key
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {(Object.entries(STATUS_META) as [ClearanceStatus, typeof STATUS_META[ClearanceStatus]][]).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Icon size={12} style={{ color: meta.color }} />
                <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.45)" }}>{meta.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
