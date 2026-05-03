import { useMemo, useState } from "react";
import { Download, BookOpen, ChevronDown, ChevronRight, Search } from "lucide-react";
import type { Guideline, SMECase, RiskCategoryScore } from "@/lib/types";

type CitationRef = {
  title: string;
  usedIn: string[];
  source: string;
};

const RELEVANT_CITATIONS: CitationRef[] = [
  { title: "2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk", usedIn: ["ASCVD", "Cardiovascular risk"], source: "Goff DC Jr et al., Circulation, 2014" },
  { title: "Obesity: Preventing and Managing the Global Epidemic", usedIn: ["BMI"], source: "WHO Technical Report Series 894, 2000" },
  { title: "New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race", usedIn: ["eGFR"], source: "Inker LA et al., NEJM, 2021" },
  { title: "Prediction of Coronary Heart Disease Using Risk Factor Categories", usedIn: ["Framingham"], source: "Wilson PWF et al., Circulation, 1998" },
  { title: "ACSM's Guidelines for Exercise Testing and Prescription", usedIn: ["METs"], source: "ACSM, 2022" },
  { title: "NFPA 1582: Standard on Comprehensive Occupational Medical Program for Fire Departments", usedIn: ["ClearanceMatrix", "Firefighter"], source: "NFPA, 2022" },
  { title: "Medical Examiner Handbook: Physical Qualification Standards for CMV Operators", usedIn: ["ClearanceMatrix", "DOT"], source: "FMCSA, 2015" },
  { title: "Guide for Aviation Medical Examiners", usedIn: ["ClearanceMatrix", "Aviation"], source: "FAA, 2023" },
  { title: "HL7 FHIR Occupational Data for Health Implementation Guide", usedIn: ["FHIR", "ODH", "Job History"], source: "HL7, US ODH" },
  { title: "CDC/NIOSH Workers' Compensation and Occupational Injury Data", usedIn: ["Claims", "Injury Data"], source: "CDC NIOSH" },
  { title: "BLS Occupational Injury and Illness Statistics", usedIn: ["BLS", "Injury Trends"], source: "U.S. Bureau of Labor Statistics" },
  { title: "OSHA and NIOSH Occupational Safety Guidance", usedIn: ["Guidance", "Compliance"], source: "OSHA / NIOSH" },
];

function maxRiskScore(scores: RiskCategoryScore[]) {
  const vals = scores.map(s => s.score).filter((v): v is 0 | 1 | 2 | 3 => v !== "U");
  return vals.length ? Math.max(...vals) : null;
}

export default function ReportBuilder({ caseData, guidelines }: { caseData: SMECase; guidelines: Guideline[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>("summary");

  const topRisk = useMemo(() => {
    const m = maxRiskScore(caseData.riskScores);
    if (m === null) return { label: "Unscored", color: "#94a3b8" };
    if (m === 3) return { label: "Score 3", color: "#b4d7d0" };
    if (m === 2) return { label: "Score 2", color: "#94a3b8" };
    if (m === 1) return { label: "Score 1", color: "#94a3b8" };
    return { label: "Score 0", color: "#b4d7d0" };
  }, [caseData.riskScores]);

  const citations = useMemo(() => {
    if (!search.trim()) return RELEVANT_CITATIONS;
    const q = search.toLowerCase();
    return RELEVANT_CITATIONS.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.usedIn.some(u => u.toLowerCase().includes(q)) ||
      c.source.toLowerCase().includes(q)
    );
  }, [search]);

  const matchedGuidelines = useMemo(() => {
    const terms = [
      caseData.jobTitle,
      ...caseData.medicalConditions.map(item => item.conditionName),
      ...caseData.injuries.map(item => item.injuryType),
      ...caseData.documentationGaps.map(item => item),
      ...caseData.riskScores.map(item => item.category),
    ].join(" ").toLowerCase();
    return guidelines.filter(g => {
      const haystack = [g.sourceName, g.agency, g.summary, g.medicalTriggers, g.jobDutyTriggers, g.documentationNeeded, g.riskConsiderations, g.jobCategory, g.conditionCategory].join(" ").toLowerCase();
      return terms && haystack && (terms.includes(g.conditionCategory.toLowerCase()) || terms.includes(g.jobCategory.toLowerCase()) || haystack.includes(terms.split(" ").slice(0, 4).join(" ")) || terms.split(" ").some(term => term.length > 3 && haystack.includes(term)));
    }).slice(0, 6);
  }, [caseData, guidelines]);

  const exportText = useMemo(() => {
    const lines = [
      `Case: ${caseData.caseId}`,
      `Examinee: ${caseData.examineeName}`,
      `Job Title: ${caseData.jobTitle}`,
      `Overall Risk: ${topRisk.label}`,
      ``,
      `Medical Conditions: ${caseData.medicalConditions.length}`,
      `Injuries: ${caseData.injuries.length}`,
      `Risk Scores: ${caseData.riskScores.length}`,
      `Documentation Gaps: ${caseData.documentationGaps.length}`,
      ``,
      `Matched Guidelines: ${matchedGuidelines.length}`,
      ...matchedGuidelines.map(g => `- ${g.sourceName} (${g.agency})`),
      ``,
      `Citations:`,
      ...citations.map(c => `- ${c.title} (${c.source})`),
    ];
    return lines.join("\n");
  }, [caseData, citations, matchedGuidelines, topRisk]);

  const downloadReport = () => {
    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${caseData.caseId}-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h2 style={{ fontSize: "1.1875rem", fontWeight: 700, color: "#fff", margin: 0 }}>Report Builder</h2>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", margin: "0.25rem 0 0" }}>
          Draft a citation-backed case summary for SME review.
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Case summary</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{caseData.examineeName} · {caseData.caseId}</div>
              </div>
              <button onClick={downloadReport} style={{ display: "flex", gap: "0.375rem", alignItems: "center", padding: "0.6rem 0.875rem", borderRadius: "8px", background: "rgba(180,215,208,0.14)", border: "1px solid rgba(180,215,208,0.3)", color: "#b4d7d0", cursor: "pointer", fontWeight: 700 }}>
                <Download size={14} /> Export
              </button>
            </div>
          </div>

          <Section title="Summary" open={expanded === "summary"} onToggle={() => setExpanded(expanded === "summary" ? null : "summary")}>
            <Grid>
              <Item label="Job Title" value={caseData.jobTitle} />
              <Item label="Employer" value={caseData.employer} />
              <Item label="Exam Type" value={caseData.examType} />
              <Item label="Status" value={caseData.status} />
              <Item label="Top Risk" value={topRisk.label} accent={topRisk.color} />
              <Item label="Documentation Gaps" value={String(caseData.documentationGaps.length)} />
            </Grid>
          </Section>

          <Section title="Clinical / Occupational Findings" open={expanded === "findings"} onToggle={() => setExpanded(expanded === "findings" ? null : "findings")}>
            <div style={{ display: "grid", gap: "0.625rem" }}>
              {caseData.riskScores.slice(0, 6).map((score) => (
                <div key={score.category} style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ fontWeight: 700, color: "#fff" }}>{score.category}</div>
                    <div style={{ color: "#b4d7d0", fontWeight: 700 }}>{score.score}</div>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", marginTop: "0.25rem" }}>{score.whyFlagged}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Citations Used in This Report" open={expanded === "citations"} onToggle={() => setExpanded(expanded === "citations" ? null : "citations")}>
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
              <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter citations…" style={{ width: "100%", padding: "0.55rem 0.75rem 0.55rem 2.25rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", outline: "none" }} />
            </div>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {citations.map(c => (
                <div key={c.title} style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                    <BookOpen size={13} style={{ color: "#b4d7d0" }} />
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>{c.title}</div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>{c.source}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.35rem" }}>
                    {c.usedIn.map(u => <span key={u} style={{ padding: "0.12rem 0.4rem", borderRadius: "4px", background: "rgba(180,215,208,0.08)", border: "1px solid rgba(180,215,208,0.15)", color: "#b4d7d0", fontSize: "0.6rem", fontWeight: 700 }}>{u}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Matched Guidelines" open={expanded === "guidelines"} onToggle={() => setExpanded(expanded === "guidelines" ? null : "guidelines")}>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {matchedGuidelines.length ? matchedGuidelines.map(g => (
                <div key={g.id} style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontWeight: 700, color: "#fff" }}>{g.sourceName}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>{g.agency} · {g.conditionCategory}{g.jobCategory ? ` · ${g.jobCategory}` : ""}</div>
                  <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>{g.summary || g.riskConsiderations}</div>
                </div>
              )) : (
                <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>No guideline matches found for this case.</div>
              )}
            </div>
          </Section>
        </div>

        <div style={{ flex: 1, minWidth: 280, position: "sticky", top: 0 }}>
          <div style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}>
            <div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>Preview</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.75rem", lineHeight: 1.55, color: "rgba(255,255,255,0.72)" }}>{exportText}</pre>
          </div>
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "10px", background: "rgba(180,215,208,0.08)", border: "1px solid rgba(180,215,208,0.18)", color: "rgba(255,255,255,0.68)", fontSize: "0.8125rem" }}>
            Citations are included as supporting references only.
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", overflow: "hidden" }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "0.85rem 1rem", background: "none", border: "none", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: 700 }}>
        <span>{title}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div style={{ padding: "0 1rem 1rem" }}>{children}</div>}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.5rem" }}>{children}</div>;
}

function Item({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ padding: "0.7rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: "0.15rem" }}>{label}</div>
      <div style={{ fontSize: "0.85rem", color: accent || "#fff", fontWeight: 700 }}>{value}</div>
    </div>
  );
}
