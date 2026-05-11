import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Heart, Bone, Briefcase, Shield, Globe, BarChart2,
  Users, TrendingUp, FileSearch, FileText, ChevronRight, Zap
} from "lucide-react";
import { SMECase } from "@/lib/types";
import { MasterDossier } from "./case-tabs/MasterDossier";
import JobDutyMatchMatrix from "./case-tabs/JobDutyMatchMatrix";
import MedicalProfile from "./case-tabs/MedicalProfile";
import InjuryHistory from "./case-tabs/InjuryHistory";
import JobDuties from "./case-tabs/JobDuties";
import EssentialFunctions from "./case-tabs/EssentialFunctions";
import CountryRisk from "./case-tabs/CountryRisk";
import OccupationalData from "./case-tabs/OccupationalData";
import HealthEquity from "./case-tabs/HealthEquity";
import RiskScoring from "./case-tabs/RiskScoring";
import DocumentationGaps from "./case-tabs/DocumentationGaps";
import SMEReport from "./case-tabs/SMEReport";
import ExecutiveIntelligenceReport from "./case-tabs/ExecutiveIntelligenceReport";
import ReportBuilder from "./ReportBuilder";
import CaseIntake from "./CaseIntake";

interface CaseHubProps {
  caseData: SMECase;
  onSave: (c: SMECase) => void;
  guidelines: import("@/lib/types").Guideline[];
}

const TABS = [
  { id: "master", label: "Master Dossier", icon: Zap },
  { id: "matrix", label: "Match Matrix", icon: Shield },
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "intake", label: "Case Info", icon: FileText },
  { id: "medical", label: "Medical Profile", icon: Heart },
  { id: "injuries", label: "Injury History", icon: Bone },
  { id: "job-duties", label: "Job Duties", icon: Briefcase },
  { id: "essential-functions", label: "Essential Functions", icon: Shield },
  { id: "country-risk", label: "Country Risk", icon: Globe },
  { id: "occupational", label: "Occupational Data", icon: BarChart2 },
  { id: "health-equity", label: "Health Equity", icon: Users },
  { id: "risk-scoring", label: "Risk Scoring", icon: TrendingUp },
  { id: "doc-gaps", label: "Doc Gaps", icon: FileSearch },
  { id: "executive", label: "Executive Report", icon: TrendingUp },
  { id: "report", label: "SME Report", icon: FileText },
  { id: "builder", label: "Report Builder", icon: ChevronRight },
];

const STATUS_META: Record<string, { cls: string }> = {
  "Draft": { cls: "badge-draft" },
  "Needs Records": { cls: "badge-needs-records" },
  "Risk Review Needed": { cls: "badge-risk-review" },
  "Ready for SME": { cls: "badge-ready" },
  "SME Reviewed": { cls: "badge-reviewed" },
  "Finalized": { cls: "badge-finalized" },
};

function getTabCompletion(tab: string, c: SMECase): "complete" | "partial" | "empty" {
  switch (tab) {
    case "master": return "complete";
    case "intake": return c.examineeName && c.jobTitle ? "complete" : "partial";
    case "medical": return c.medicalConditions.length > 0 ? "complete" : "empty";
    case "injuries": return c.injuries.length > 0 ? "complete" : "empty";
    case "job-duties": return c.jobDuties.physicalDemands.length > 0 || c.jobDuties.essentialFunctions ? "complete" : "empty";
    case "essential-functions": return c.jobDuties.essentialFunctions ? "complete" : "empty";
    case "country-risk": return c.countryRisk ? "complete" : "empty";
    case "occupational": return c.occupationalData ? "complete" : "empty";
    case "health-equity": return c.healthEquity ? "complete" : "empty";
    case "risk-scoring": return c.riskScores.length > 0 ? "complete" : "empty";
    case "doc-gaps": return c.documentationGaps.length > 0 ? "complete" : "empty";
    case "executive": return c.medicalConditions.length > 0 && c.jobTitle ? "complete" : "partial";
    case "report": return c.smeAssessment.clinicalInterpretation ? "complete" : "empty";
    case "builder": return c.riskScores.length > 0 ? "complete" : "empty";
    default: return "empty";
  }
}

const CASE_STATUSES = ["Draft","Needs Records","Risk Review Needed","Ready for SME","SME Reviewed","Finalized"];

export default function CaseHub({ caseData, onSave, guidelines }: CaseHubProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("master");
  const [localCase, setLocalCase] = useState<SMECase>(caseData);

  function updateCase(updates: Partial<SMECase>) {
    const updated = { ...localCase, ...updates, updatedAt: new Date().toISOString() };
    setLocalCase(updated);
    onSave(updated);
  }

  function renderTab() {
    switch (activeTab) {
      case "master": return <MasterDossier caseData={localCase} />;
      case "matrix": return <JobDutyMatchMatrix caseData={localCase} />;
      case "overview": return <Overview c={localCase} onTabChange={setActiveTab} />;
      case "intake": return <CaseIntake existingCase={localCase} onSave={(c) => { setLocalCase(c); onSave(c); }} />;
      case "medical": return <MedicalProfile caseData={localCase} onUpdate={updateCase} />;
      case "injuries": return <InjuryHistory caseData={localCase} onUpdate={updateCase} />;
      case "job-duties": return <JobDuties caseData={localCase} onUpdate={updateCase} />;
      case "essential-functions": return <EssentialFunctions caseData={localCase} onUpdate={updateCase} />;
      case "standards": return <StandardsTab caseData={localCase} onUpdate={updateCase} />;
      case "country-risk": return <CountryRisk caseData={localCase} onUpdate={updateCase} />;
      case "occupational": return <OccupationalData caseData={localCase} onUpdate={updateCase} />;
      case "health-equity": return <HealthEquity caseData={localCase} onUpdate={updateCase} />;
      case "risk-scoring": return <RiskScoring caseData={localCase} onUpdate={updateCase} />;
      case "doc-gaps": return <DocumentationGaps caseData={localCase} onUpdate={updateCase} />;
      case "executive": return <ExecutiveIntelligenceReport caseData={localCase} onUpdate={updateCase} />;
      case "report": return <SMEReport caseData={localCase} onUpdate={updateCase} />;
      case "builder": return <ReportBuilder caseData={localCase} guidelines={guidelines} />;
      default: return null;
    }
  }

  return (
    <div data-testid="case-hub-page">
      <div className="glass-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <button
          className="glow-btn glow-btn-secondary"
          onClick={() => setLocation("/")}
          data-testid="btn-back-from-case"
          style={{ padding: "0.4rem 0.625rem", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem" }}
        >
          <ArrowLeft size={13} />
          Back
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#fff" }}>{localCase.examineeName || "—"}</span>
            <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>·</span>
            <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>{localCase.jobTitle}</span>
            <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", background: "rgba(180,215,208,0.12)", color: "#b4d7d0", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>{localCase.caseId}</span>
            <span className={STATUS_META[localCase.status]?.cls} style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "0.2rem 0.625rem", borderRadius: "6px" }}>
              {localCase.status}
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "0.125rem" }}>
            {localCase.employer} · {localCase.agencyStandard} {localCase.deploymentCountry ? `· Deployment: ${localCase.deploymentCountry}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <select
            className="glass-input"
            value={localCase.status}
            onChange={e => updateCase({ status: e.target.value as SMECase["status"] })}
            data-testid="select-case-status"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.8125rem", cursor: "pointer" }}
          >
            {CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const comp = getTabCompletion(id, localCase);
          return (
            <button
              key={id}
              className={`tab-btn${activeTab === id ? " active-tab" : ""}`}
              onClick={() => setActiveTab(id)}
              data-testid={`tab-${id}`}
              style={{ display: "flex", alignItems: "center", gap: "0.375rem", position: "relative" }}
            >
              <Icon size={13} />
              {label}
              {comp === "complete" && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#b4d7d0", position: "absolute", top: "4px", right: "4px" }} />}
              {comp === "partial" && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d6c8aa", position: "absolute", top: "4px", right: "4px" }} />}
            </button>
          );
        })}
      </div>

      {renderTab()}
    </div>
  );
}

function Overview({ c, onTabChange }: { c: SMECase; onTabChange: (t: string) => void }) {
  const sections = [
    { tab: "medical", label: "Medical Profile", count: c.medicalConditions.length, unit: "conditions", color: "#b4d7d0" },
    { tab: "injuries", label: "Injury History", count: c.injuries.length, unit: "records", color: "#d6c8aa" },
    { tab: "job-duties", label: "Job Duties", count: c.jobDuties.physicalDemands.length + c.jobDuties.cognitiveDemands.length, unit: "demands", color: "#a7c7be" },
    { tab: "standards", label: "Standards", count: c.standards.selected.length, unit: "selected", color: "#7f9d96" },
    { tab: "country-risk", label: "Country Risk", count: c.countryRisk ? 1 : 0, unit: c.deploymentCountry || "N/A", color: "#d6c8aa" },
    { tab: "risk-scoring", label: "Risk Scores", count: c.riskScores.length, unit: "categories scored", color: "#b4d7d0" },
    { tab: "doc-gaps", label: "Doc Gaps", count: c.documentationGaps.length, unit: "gaps identified", color: "#a7c7be" },
    { tab: "report", label: "SME Report", count: c.smeAssessment.clinicalInterpretation ? 1 : 0, unit: c.smeAssessment.clinicalInterpretation ? "assessment entered" : "not started", color: "#f4efdc" },
  ];

  const highRiskConditions = c.medicalConditions.filter(m => m.status === "active" || m.status === "uncontrolled" || m.incapacitationRisk === "Yes" || m.incapacitationRisk === "Possible");
  const missingDocs = c.medicalConditions.filter(m => !m.providerQuote).length;

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1875rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Case Overview</h2>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
          Quick navigation to all case modules. Green indicator = data entered; amber = partial; none = not started.
        </p>
      </div>

      {highRiskConditions.length > 0 && (
          <div className="risk-flag-card" style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#d6c8aa", marginBottom: "0.5rem" }}>
            Flagged Medical Conditions Requiring SME Review
          </div>
          {highRiskConditions.map(m => (
            <div key={m.id} style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", padding: "0.25rem 0", borderBottom: "1px solid rgba(180,215,208,0.1)" }}>
              <span style={{ fontWeight: 600 }}>{m.conditionName}</span>
              {" — "}Status: {m.status}; Incapacitation risk: {m.incapacitationRisk}
            </div>
          ))}
        </div>
      )}

      {missingDocs > 0 && (
          <div className="risk-flag-amber" style={{ padding: "1rem", borderRadius: "12px", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#f4efdc" }}>
            {missingDocs} medical condition(s) missing provider documentation — may affect documentation confidence score
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem" }}>
        {sections.map(({ tab, label, count, unit, color }) => (
          <div
            key={tab}
            className="glass-card"
            style={{ padding: "1.125rem", cursor: "pointer" }}
            onClick={() => onTabChange(tab)}
            data-testid={`overview-card-${tab}`}
          >
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color, lineHeight: 1, marginBottom: "0.25rem" }}>{count}</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{unit}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.5rem", color: "#b4d7d0", fontSize: "0.75rem", fontWeight: 500 }}>
              Open <ChevronRight size={12} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: "1.25rem", marginTop: "1.25rem" }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "0.875rem" }}>Case Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8125rem" }}>
          {[
            ["Examinee", c.examineeName || "—"],
            ["Job Title", c.jobTitle || "—"],
            ["Employer", c.employer || "—"],
            ["Exam Type", c.examType || "—"],
            ["Date of Exam", c.dateOfExam || "—"],
            ["Reviewing SME", c.reviewingSME || "—"],
            ["Agency Standard", c.agencyStandard || "—"],
            ["Deployment Country", c.deploymentCountry || "N/A"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", minWidth: "140px", fontWeight: 500 }}>{label}</span>
              <span style={{ color: "#fff", fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
        {c.notes && (
          <div style={{ marginTop: "0.875rem", padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)" }}>
            <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>Notes: </span>{c.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function StandardsTab({ caseData, onUpdate }: { caseData: SMECase; onUpdate: (u: Partial<SMECase>) => void }) {
  const STANDARD_OPTIONS = [
    { id: "nfpa-1582", label: "NFPA 1582", desc: "Firefighter medical standard" },
    { id: "fmcsa", label: "FMCSA", desc: "DOT commercial driver standard" },
    { id: "faa-ame", label: "FAA AME", desc: "Aviation medical guide" },
    { id: "mod-deployment", label: "Deployment Standard", desc: "Austere deployment medical guidance" },
  ];

  return (
    <div className="glass-card" style={{ padding: "1.25rem" }}>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>Standards Selection</div>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {STANDARD_OPTIONS.map(opt => (
          <div key={opt.id} style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontWeight: 700, color: "#fff" }}>{opt.label}</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>{opt.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
