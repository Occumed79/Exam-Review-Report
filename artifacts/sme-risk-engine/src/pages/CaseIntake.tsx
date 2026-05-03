import { useState } from "react";
import { useLocation } from "wouter";
import { Save, ArrowLeft, RefreshCw } from "lucide-react";
import { SMECase, ExamType, ApplicableStandards } from "@/lib/types";
import { generateCaseId, generateId } from "@/lib/store";

interface CaseIntakeProps {
  existingCase?: SMECase;
  onSave: (c: SMECase) => void;
}

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: "pre-employment", label: "Pre-Employment" },
  { value: "annual", label: "Annual Medical Surveillance" },
  { value: "deployment", label: "Deployment" },
  { value: "firefighter", label: "Firefighter / NFPA" },
  { value: "aviation", label: "Aviation / FAA" },
  { value: "law-enforcement", label: "Law Enforcement" },
  { value: "dot-fmcsa", label: "DOT / FMCSA" },
  { value: "return-to-work", label: "Return to Work" },
  { value: "fitness-for-duty", label: "Fitness for Duty" },
  { value: "other", label: "Other" },
];

const STANDARD_OPTIONS = [
  "MOD deployment",
  "NFPA firefighter",
  "FAA aviation",
  "DOT/FMCSA",
  "OSHA",
  "NIOSH",
  "BLS",
  "CDC travel health",
  "POST law enforcement",
  "Client-specific",
  "Other",
];

function calcAge(dob: string): number {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const now = new Date().toISOString();

function blankCase(): SMECase {
  return {
    id: generateCaseId(),
    caseId: `SME-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    examineeName: "",
    dob: "",
    age: 0,
    sex: "",
    employer: "",
    jobTitle: "",
    department: "",
    examType: "pre-employment",
    reviewingSME: "",
    caseManager: "",
    dateOfExam: new Date().toISOString().split("T")[0],
    workLocation: "",
    deploymentCountry: "",
    agencyStandard: "",
    standards: { selected: [], customNotes: "" },
    notes: "",
    status: "Draft",
    createdAt: now,
    updatedAt: now,
    medicalConditions: [],
    injuries: [],
    jobDuties: { physicalDemands: [], cognitiveDemands: [], environmentalDemands: [], essentialFunctions: "", clientRequirements: "", agencyStandardNotes: "" },
    countryRisk: null,
    occupationalData: null,
    healthEquity: null,
    riskScores: [],
    documentationGaps: [],
    smeAssessment: {
      clinicalInterpretation: "", occupationalRelevance: "", riskLevel: "", documentationSufficiency: "",
      additionalRecordsNeeded: "", finalRecommendation: "", recommendationFreeText: "",
      smeReviewNotes: "", documentsReviewed: [], dateCompleted: ""
    }
  };
}

export default function CaseIntake({ existingCase, onSave }: CaseIntakeProps) {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<SMECase>(existingCase ?? blankCase());
  const [saved, setSaved] = useState(false);

  function set(field: keyof SMECase, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function setStandards(standards: ApplicableStandards) {
    setForm(prev => ({ ...prev, standards }));
  }

  function toggleStandard(s: string) {
    const sel = form.standards.selected.includes(s)
      ? form.standards.selected.filter(x => x !== s)
      : [...form.standards.selected, s];
    setStandards({ ...form.standards, selected: sel });
  }

  function handleSave() {
    const age = calcAge(form.dob);
    const updated: SMECase = { ...form, age, updatedAt: new Date().toISOString() };
    onSave(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (!existingCase) setLocation(`/case/${form.id}`);
  }

  function regenerateCaseId() {
    set("caseId", `SME-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  }

  const fieldStyle = { marginBottom: "1rem" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "0.375rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" };
  const inputStyle = { width: "100%", padding: "0.6rem 0.875rem", fontSize: "0.875rem" };

  return (
    <div data-testid="case-intake-page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
        <button className="glow-btn glow-btn-secondary" onClick={() => setLocation("/")} data-testid="btn-back-dashboard" style={{ padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem" }}>
          <ArrowLeft size={14} />
          Dashboard
        </button>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            {existingCase ? "Edit Case" : "New Case Intake"}
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>Enter case information and exam details</p>
        </div>
        <button
          className={`glow-btn${saved ? "" : ""}`}
          onClick={handleSave}
          data-testid="btn-save-case"
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Save size={14} />
          {saved ? "Saved!" : "Save Case"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* Case Identification */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Case Identification
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Case ID</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input className="glass-input" style={{ ...inputStyle, flex: 1, fontFamily: "monospace" }} value={form.caseId} onChange={e => set("caseId", e.target.value)} data-testid="input-case-id" />
              <button className="glow-btn glow-btn-secondary" onClick={regenerateCaseId} data-testid="btn-regenerate-id" style={{ padding: "0.5rem 0.75rem" }} title="Regenerate ID">
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Exam Type</label>
              <select className="glass-input" style={inputStyle} value={form.examType} onChange={e => set("examType", e.target.value as ExamType)} data-testid="select-exam-type">
                {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Exam</label>
              <input type="date" className="glass-input" style={inputStyle} value={form.dateOfExam} onChange={e => set("dateOfExam", e.target.value)} data-testid="input-date-exam" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Reviewing SME</label>
              <input className="glass-input" style={inputStyle} value={form.reviewingSME} onChange={e => set("reviewingSME", e.target.value)} placeholder="Dr. Name, Credentials" data-testid="input-reviewing-sme" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Case Manager</label>
              <input className="glass-input" style={inputStyle} value={form.caseManager} onChange={e => set("caseManager", e.target.value)} placeholder="Name" data-testid="input-case-manager" />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Agency / Client Standard</label>
            <input className="glass-input" style={inputStyle} value={form.agencyStandard} onChange={e => set("agencyStandard", e.target.value)} placeholder="e.g. NFPA 1582, MOD 17, Client Contract" data-testid="input-agency-standard" />
          </div>
        </div>

        {/* Examinee Information */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Examinee Information
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Examinee Name / Initials</label>
            <input className="glass-input" style={inputStyle} value={form.examineeName} onChange={e => set("examineeName", e.target.value)} placeholder="For privacy: use initials in demo mode" data-testid="input-examinee-name" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.875rem" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" className="glass-input" style={inputStyle} value={form.dob} onChange={e => { set("dob", e.target.value); set("age", calcAge(e.target.value)); }} data-testid="input-dob" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Age</label>
              <input className="glass-input" style={{ ...inputStyle, opacity: 0.7 }} value={form.age || ""} readOnly data-testid="text-age" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Sex</label>
              <select className="glass-input" style={inputStyle} value={form.sex} onChange={e => set("sex", e.target.value)} data-testid="select-sex">
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Not specified">Not specified</option>
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Employer / Client</label>
            <input className="glass-input" style={inputStyle} value={form.employer} onChange={e => set("employer", e.target.value)} placeholder="Organization name" data-testid="input-employer" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Job Title</label>
              <input className="glass-input" style={inputStyle} value={form.jobTitle} onChange={e => set("jobTitle", e.target.value)} placeholder="Position/role" data-testid="input-job-title" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Department / Contract</label>
              <input className="glass-input" style={inputStyle} value={form.department} onChange={e => set("department", e.target.value)} placeholder="Unit/department" data-testid="input-department" />
            </div>
          </div>
        </div>

        {/* Location + Deployment */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Location & Deployment
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Work Location</label>
            <input className="glass-input" style={inputStyle} value={form.workLocation} onChange={e => set("workLocation", e.target.value)} placeholder="City, State / Region" data-testid="input-work-location" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Deployment Country (if applicable)</label>
            <input className="glass-input" style={inputStyle} value={form.deploymentCountry} onChange={e => set("deploymentCountry", e.target.value)} placeholder="Leave blank if not applicable" data-testid="input-deployment-country" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Case Notes</label>
            <textarea className="glass-input" style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Intake notes, special considerations..." data-testid="textarea-notes" />
          </div>
        </div>

        {/* Standards */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Applicable Standards & Guidelines
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.875rem" }}>
            {STANDARD_OPTIONS.map(s => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.4rem 0.5rem", borderRadius: "8px", background: form.standards.selected.includes(s) ? "rgba(0,212,255,0.08)" : "transparent", border: `1px solid ${form.standards.selected.includes(s) ? "rgba(0,212,255,0.25)" : "transparent"}`, transition: "all 0.15s" }} data-testid={`checkbox-standard-${s.replace(/\s+/g, "-").toLowerCase()}`}>
                <input type="checkbox" checked={form.standards.selected.includes(s)} onChange={() => toggleStandard(s)} style={{ accentColor: "#b4d7d0" }} />
                <span style={{ fontSize: "0.8125rem", color: form.standards.selected.includes(s) ? "#b4d7d0" : "rgba(255,255,255,0.6)", fontWeight: 500 }}>{s}</span>
              </label>
            ))}
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Custom Standard Notes</label>
            <textarea className="glass-input" style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }} value={form.standards.customNotes} onChange={e => setStandards({ ...form.standards, customNotes: e.target.value })} placeholder="Additional standard notes..." data-testid="textarea-standard-notes" />
          </div>
        </div>

      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
        <button className="glow-btn" onClick={handleSave} data-testid="btn-save-case-bottom" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 2rem", fontSize: "0.9375rem" }}>
          <Save size={16} />
          {existingCase ? "Save Changes" : "Create Case & Continue"}
        </button>
      </div>
    </div>
  );
}
