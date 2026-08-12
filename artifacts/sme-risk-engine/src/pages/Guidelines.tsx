import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Search, ExternalLink, Upload, FileText } from "lucide-react";
import { Guideline, SourceConfidence } from "@/lib/types";
import { generateId } from "@/lib/store";

interface Props { guidelines: Guideline[]; onSave: (g: Guideline) => void; onDelete: (id: string) => void; onImportMany?: (items: Guideline[]) => void; }

const CONF_META: Record<SourceConfidence, { label: string; color: string }> = {
  official: { label: "Official", color: "#b4d7d0" },
  internal: { label: "Internal", color: "#a7c7be" },
  "sme-summary": { label: "Reviewed Summary", color: "#d6c8aa" },
  secondary: { label: "Secondary", color: "#7f9d96" },
  unclear: { label: "Unclear", color: "#f4efdc" },
};

const CAT_OPTIONS = [
  "cardiovascular","respiratory","endocrine-metabolic","neurologic","psychiatric",
  "orthopedic","sleep-disorder","renal","gastrointestinal","hematologic",
  "infectious-disease","immunologic","dermatologic","vision-hearing","other"
];

const JOB_OPTIONS = [
  "Firefighter / First Responder","Aviation Safety-Sensitive","Military / Defense Deployment",
  "Commercial Driver / Vehicle Operator","Heat-Exposed Occupations","Industrial / Firefighter / Construction",
  "Construction / Labor / Physical Trades","Healthcare / Patient Care","Law Enforcement",
  "International Deployment / Travel","Contractor / Client Deployment","General"
];

function blank(): Guideline {
  return {
    id: generateId(), sourceName: "", agency: "", standardType: "", conditionCategory: "cardiovascular",
    jobCategory: "", summary: "", medicalTriggers: "", jobDutyTriggers: "", documentationNeeded: "",
    riskConsiderations: "", sourceLink: "", lastReviewed: "", reviewedBy: "",
    sourceConfidence: "internal", versionDate: "", notes: "", isSample: false
  };
}

export default function Guidelines({ guidelines, onSave, onDelete, onImportMany }: Props) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Guideline | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importNote, setImportNote] = useState<string | null>(null);

  const filtered = guidelines.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = g.sourceName.toLowerCase().includes(q) || g.agency.toLowerCase().includes(q) || g.summary.toLowerCase().includes(q) || g.jobCategory.toLowerCase().includes(q);
    const matchCat = catFilter === "all" || g.conditionCategory === catFilter;
    return matchSearch && matchCat;
  });

  const importPreview = useMemo(() => {
    if (!importText.trim()) return { total: 0, valid: 0 };
    try {
      const parsed = JSON.parse(importText);
      const items = Array.isArray(parsed) ? parsed : parsed.guidelines;
      if (!Array.isArray(items)) return { total: 0, valid: 0 };
      const valid = items.filter(item => item && typeof item === "object" && typeof item.sourceName === "string" && typeof item.agency === "string").length;
      return { total: items.length, valid };
    } catch {
      return { total: 0, valid: 0 };
    }
  }, [importText]);

  function save() {
    if (!editing) return;
    onSave(editing);
    setEditing(null);
  }

  function startNew() {
    setEditing(blank());
  }

  function upd(field: keyof Guideline, value: unknown) {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(importText);
      const items = Array.isArray(parsed) ? parsed : parsed?.guidelines;
      if (!Array.isArray(items)) throw new Error("Invalid format");
      const mapped = items.map((item: Partial<Guideline>) => ({
        id: typeof item.id === "string" && item.id ? item.id : generateId(),
        sourceName: item.sourceName || "",
        agency: item.agency || "",
        standardType: item.standardType || "",
        conditionCategory: item.conditionCategory || "other",
        jobCategory: item.jobCategory || "",
        summary: item.summary || "",
        medicalTriggers: item.medicalTriggers || "",
        jobDutyTriggers: item.jobDutyTriggers || "",
        documentationNeeded: item.documentationNeeded || "",
        riskConsiderations: item.riskConsiderations || "",
        sourceLink: item.sourceLink || "",
        lastReviewed: item.lastReviewed || "",
        reviewedBy: item.reviewedBy || "",
        sourceConfidence: item.sourceConfidence || "internal",
        versionDate: item.versionDate || "",
        notes: item.notes || "",
        isSample: Boolean(item.isSample),
      }));
      if (onImportMany) onImportMany(mapped);
      else mapped.forEach(onSave);
      setImportNote(`Imported ${mapped.length} guidance entries.`);
      setImportText("");
    } catch {
      setImportNote("Paste an array of guidance objects, or {\"guidelines\": [...] }.");
    }
  }

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" };
  const inp = { width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8125rem" };

  return (
    <div data-testid="guidelines-page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>Guideline Editor</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)" }}>
            Maintain reusable occupational-health guidance and source-backed reviewer notes. No examinee record is stored here.
          </p>
        </div>
        <button className="glow-btn" onClick={startNew} data-testid="btn-new-guideline" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={16} />
          Add Guidance
        </button>
      </div>

      <div className="liquid-toolbar liquid-glass" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "0.875rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input className="glass-input" style={{ ...inp, paddingLeft: "2.25rem" }} placeholder="Search guidance..." value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-guidelines" />
        </div>
        <select className="glass-input" style={{ ...inp, width: "200px" }} value={catFilter} onChange={e => setCatFilter(e.target.value)} data-testid="select-cat-filter">
          <option value="all">All Categories</option>
          {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>{filtered.length} of {guidelines.length} entries</div>
      </div>

      <details className="glass-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
        <summary style={{ cursor: "pointer", color: "var(--text-secondary)", fontSize: ".82rem", fontWeight: 700 }}>Advanced · bulk JSON import</summary>
        <div style={{ marginTop: ".9rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.7rem", marginBottom: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><FileText size={15} style={{ color: "#b4d7d0" }} /><strong style={{ fontSize: "0.8rem", color: "#f4efdc" }}>Bulk import guidance</strong></div>
          <button
            className="glow-btn glow-btn-secondary"
            onClick={handleImport}
            disabled={importPreview.valid === 0}
            data-testid="btn-import-guidelines"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: importPreview.valid === 0 ? 0.45 : 1 }}
          >
            <Upload size={14} /> Import queued
          </button>
        </div>
        <textarea className="glass-input" value={importText} onChange={e => { setImportText(e.target.value); setImportNote(null); }} placeholder='Paste a JSON array or {"guidelines": [...]}' style={{ width: "100%", minHeight: "90px", padding: "0.7rem", boxSizing: "border-box", resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginTop: "0.55rem" }}>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>{importPreview.total ? `${importPreview.valid}/${importPreview.total} recognizable entries` : "Nothing queued"}</span>
          {importNote && <span style={{ fontSize: "0.7rem", color: "#b4d7d0" }}>{importNote}</span>}
        </div>
        </div>
      </details>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {filtered.length === 0 && <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.35)" }}>No matching guidance entries.</div>}
        {filtered.map(g => {
          const meta = CONF_META[g.sourceConfidence] || CONF_META.unclear;
          const open = expanded === g.id;
          return <div key={g.id} className="glass-card" style={{ padding: "0.9rem 1rem" }}>
            <button onClick={() => setExpanded(open ? null : g.id)} style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start", background: "none", border: 0, color: "inherit", padding: 0, textAlign: "left", cursor: "pointer" }}>
              <div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}><strong style={{ color: "#fff", fontSize: "0.88rem" }}>{g.sourceName || "Untitled guidance"}</strong><span style={{ color: meta.color, fontSize: "0.62rem", fontWeight: 700 }}>{meta.label}</span></div>
                <div style={{ marginTop: "0.25rem", color: "rgba(255,255,255,0.38)", fontSize: "0.7rem" }}>{g.agency || "No agency"} · {g.conditionCategory} · {g.jobCategory || "General"}</div>
                <div style={{ marginTop: "0.45rem", color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", lineHeight: 1.5 }}>{g.summary || "No summary entered."}</div>
              </div>
              {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {open && <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "grid", gap: "0.65rem" }}>
              {[["Medical triggers",g.medicalTriggers],["Job-duty triggers",g.jobDutyTriggers],["Documentation needed",g.documentationNeeded],["Risk considerations",g.riskConsiderations],["Notes",g.notes]].map(([title,value]) => value ? <div key={title}><div style={lbl}>{title}</div><div style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.75rem", lineHeight: 1.5 }}>{value}</div></div> : null)}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {g.sourceLink && <a href={g.sourceLink} target="_blank" rel="noreferrer" style={{ color: "#b4d7d0", textDecoration: "none", display: "inline-flex", gap: "0.25rem", alignItems: "center", fontSize: "0.7rem" }}>Open source <ExternalLink size={11}/></a>}
                <button onClick={() => setEditing(g)} className="glow-btn glow-btn-secondary" style={{ fontSize: "0.68rem", padding: "0.35rem 0.6rem" }}>Edit</button>
                <button onClick={() => setConfirmDelete(g.id)} style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#ef9a9a", borderRadius: 6, padding: "0.35rem 0.5rem", cursor: "pointer" }}><Trash2 size={12}/></button>
              </div>
              {confirmDelete === g.id && <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}>Delete this entry?<button onClick={() => { onDelete(g.id); setConfirmDelete(null); }} style={{ color: "#ef9a9a", background: "transparent", border: 0, cursor: "pointer" }}>Delete</button><button onClick={() => setConfirmDelete(null)} style={{ color: "#b4d7d0", background: "transparent", border: 0, cursor: "pointer" }}>Cancel</button></div>}
            </div>}
          </div>;
        })}
      </div>

      {editing && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.72)", display: "grid", placeItems: "center", padding: "2rem" }}>
        <div className="glass-card" style={{ width: "min(900px, 92vw)", maxHeight: "90vh", overflow: "auto", padding: "1.2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}><strong style={{ color: "#fff" }}>{editing.sourceName ? "Edit guidance" : "New guidance"}</strong><button onClick={() => setEditing(null)} style={{ background: "transparent", border: 0, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Close</button></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "0.65rem" }}>
            <Field label="Source name" value={editing.sourceName} onChange={v => upd("sourceName",v)} />
            <Field label="Agency" value={editing.agency} onChange={v => upd("agency",v)} />
            <Field label="Standard type" value={editing.standardType} onChange={v => upd("standardType",v)} />
            <div><label style={lbl}>Condition category</label><select className="glass-input" style={inp} value={editing.conditionCategory} onChange={e => upd("conditionCategory",e.target.value)}>{CAT_OPTIONS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={lbl}>Job category</label><select className="glass-input" style={inp} value={editing.jobCategory} onChange={e => upd("jobCategory",e.target.value)}><option value="">General</option>{JOB_OPTIONS.map(c => <option key={c}>{c}</option>)}</select></div>
            <Field label="Source link" value={editing.sourceLink} onChange={v => upd("sourceLink",v)} />
          </div>
          {["summary","medicalTriggers","jobDutyTriggers","documentationNeeded","riskConsiderations","notes"].map(key => <div key={key} style={{ marginTop: "0.65rem" }}><label style={lbl}>{key.replace(/([A-Z])/g," $1")}</label><textarea className="glass-input" style={{ width: "100%", minHeight: key === "summary" ? "90px" : "70px", padding: "0.6rem", boxSizing: "border-box" }} value={String(editing[key as keyof Guideline] || "")} onChange={e => upd(key as keyof Guideline,e.target.value)} /></div>)}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.8rem" }}><button onClick={() => setEditing(null)} className="glow-btn glow-btn-secondary">Cancel</button><button onClick={save} className="glow-btn">Save guidance</button></div>
        </div>
      </div>}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label><input className="glass-input" value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8125rem" }} /></div>;
}
