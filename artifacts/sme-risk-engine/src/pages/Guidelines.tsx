import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Search, ExternalLink, Upload, FileText } from "lucide-react";
import { Guideline, SourceConfidence } from "@/lib/types";
import { generateId } from "@/lib/store";

interface Props { guidelines: Guideline[]; onSave: (g: Guideline) => void; onDelete: (id: string) => void; onImportMany: (items: Guideline[]) => void; }

const CONF_META: Record<SourceConfidence, { label: string; color: string }> = {
  official: { label: "Official", color: "#b4d7d0" },
  internal: { label: "Internal", color: "#a7c7be" },
  "sme-summary": { label: "SME Summary", color: "#d6c8aa" },
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

export default function Guidelines({ guidelines, onSave, onDelete }: Props) {
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
      onImportMany(mapped);
      setImportNote(`Imported ${mapped.length} guidelines.`);
      setImportText("");
    } catch {
      setImportNote("Paste an array of guideline objects, or {\"guidelines\": [...] }.");
    }
  }

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" };
  const inp = { width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8125rem" };

  return (
    <div data-testid="guidelines-page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>Guideline Library</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)" }}>
            Occupational health standards, agency guidelines, and SME reference documentation.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="glow-btn glow-btn-secondary" onClick={handleImport} data-testid="btn-import-guidelines" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Upload size={16} />
            Import Guidelines
          </button>
          <button className="glow-btn" onClick={startNew} data-testid="btn-new-guideline" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={16} />
            Add Guideline
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="glass-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "0.875rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input className="glass-input" style={{ ...inp, paddingLeft: "2.25rem" }} placeholder="Search guidelines..." value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-guidelines" />
        </div>
        <select className="glass-input" style={{ ...inp, width: "200px" }} value={catFilter} onChange={e => setCatFilter(e.target.value)} data-testid="select-cat-filter">
          <option value="all">All Categories</option>
          {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>{filtered.length} of {guidelines.length} guidelines</div>
      </div>

      <div className="glass-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem", color: "#fff", fontWeight: 700 }}>
          <FileText size={15} />
          Bulk guideline import
        </div>
        <textarea className="glass-input" style={{ ...inp, minHeight: "120px", resize: "vertical" }} value={importText} onChange={e => setImportText(e.target.value)} placeholder='Paste JSON array or {"guidelines":[...]} here' />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
            {importPreview.total ? `${importPreview.valid} valid of ${importPreview.total} records ready` : "Supports JSON guideline imports only."}
          </div>
          <button className="glow-btn glow-btn-secondary" onClick={handleImport} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Upload size={14} />
            Apply Import
          </button>
        </div>
        {importNote && <div style={{ marginTop: "0.6rem", fontSize: "0.8125rem", color: "#b4d7d0" }}>{importNote}</div>}
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="glass-card glass-card-active" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1.25rem" }}>
            {editing.id && guidelines.some(g => g.id === editing.id) ? "Edit Guideline" : "New Guideline"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div><label style={lbl}>Source / Guideline Name</label><input className="glass-input" style={inp} value={editing.sourceName} onChange={e => upd("sourceName", e.target.value)} placeholder="e.g., NFPA 1582 — Firefighter Cardiovascular Considerations" data-testid="input-guideline-name" /></div>
            <div><label style={lbl}>Agency</label><input className="glass-input" style={inp} value={editing.agency} onChange={e => upd("agency", e.target.value)} placeholder="NFPA, FAA, DOT..." data-testid="input-guideline-agency" /></div>
            <div><label style={lbl}>Standard Type</label><input className="glass-input" style={inp} value={editing.standardType} onChange={e => upd("standardType", e.target.value)} placeholder="Medical standard, guidance, etc." /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div><label style={lbl}>Condition Category</label><select className="glass-input" style={inp} value={editing.conditionCategory} onChange={e => upd("conditionCategory", e.target.value)} data-testid="select-guideline-category">{CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label style={lbl}>Job Category</label><select className="glass-input" style={inp} value={editing.jobCategory} onChange={e => upd("jobCategory", e.target.value)}><option value="">— Select —</option>{JOB_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
            <div><label style={lbl}>Source Confidence</label><select className="glass-input" style={inp} value={editing.sourceConfidence} onChange={e => upd("sourceConfidence", e.target.value as SourceConfidence)}><option value="official">Official</option><option value="internal">Internal</option><option value="sme-summary">SME Summary</option><option value="secondary">Secondary</option><option value="unclear">Unclear</option></select></div>
            <div><label style={lbl}>Version / Date</label><input className="glass-input" style={inp} value={editing.versionDate} onChange={e => upd("versionDate", e.target.value)} placeholder="e.g., 2022, 2024 Ed." /></div>
          </div>
          <div style={{ marginBottom: "0.75rem" }}><label style={lbl}>Summary</label><textarea className="glass-input" style={{ ...inp, minHeight: "80px", resize: "vertical" }} value={editing.summary} onChange={e => upd("summary", e.target.value)} data-testid="textarea-guideline-summary" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div><label style={lbl}>Medical Triggers</label><textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={editing.medicalTriggers} onChange={e => upd("medicalTriggers", e.target.value)} /></div>
            <div><label style={lbl}>Job Duty Triggers</label><textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={editing.jobDutyTriggers} onChange={e => upd("jobDutyTriggers", e.target.value)} /></div>
            <div><label style={lbl}>Documentation Needed</label><textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={editing.documentationNeeded} onChange={e => upd("documentationNeeded", e.target.value)} /></div>
            <div><label style={lbl}>Risk Considerations</label><textarea className="glass-input" style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={editing.riskConsiderations} onChange={e => upd("riskConsiderations", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <div><label style={lbl}>Source Link</label><input className="glass-input" style={inp} value={editing.sourceLink} onChange={e => upd("sourceLink", e.target.value)} placeholder="https://..." /></div>
            <div><label style={lbl}>Reviewed By</label><input className="glass-input" style={inp} value={editing.reviewedBy} onChange={e => upd("reviewedBy", e.target.value)} /></div>
            <div><label style={lbl}>Last Reviewed</label><input type="date" className="glass-input" style={inp} value={editing.lastReviewed} onChange={e => upd("lastReviewed", e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: "1rem" }}><label style={lbl}>Notes</label><textarea className="glass-input" style={{ ...inp, minHeight: "60px", resize: "vertical" }} value={editing.notes} onChange={e => upd("notes", e.target.value)} /></div>
          <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
            <button className="glow-btn glow-btn-secondary" onClick={() => setEditing(null)} data-testid="btn-cancel-guideline">Cancel</button>
            <button className="glow-btn" onClick={save} data-testid="btn-save-guideline">Save Guideline</button>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "0.875rem" }}>No guidelines found</div>
        </div>
      ) : (
        filtered.map(g => {
          const isOpen = expanded === g.id;
          const conf = CONF_META[g.sourceConfidence];
          return (
            <div key={g.id} className="glass-card" style={{ marginBottom: "0.75rem", overflow: "hidden" }} data-testid={`guideline-card-${g.id}`}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem 1.25rem", cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : g.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#fff" }}>{g.sourceName || "Unnamed Guideline"}</span>
                    <span style={{ fontSize: "0.6875rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: `${conf.color}15`, color: conf.color, fontWeight: 600 }}>{conf.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", color: "#b4d7d0" }}>{g.agency}</span>
                    {g.jobCategory && <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{g.jobCategory}</span>}
                    {g.conditionCategory && <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{g.conditionCategory}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button className="glow-btn glow-btn-secondary" onClick={e => { e.stopPropagation(); setEditing({ ...g }); setExpanded(null); }} data-testid={`btn-edit-guideline-${g.id}`} style={{ padding: "0.3rem 0.625rem", fontSize: "0.75rem" }}>Edit</button>
                  {confirmDelete === g.id ? (
                    <button className="glow-btn glow-btn-danger" onClick={e => { e.stopPropagation(); onDelete(g.id); setConfirmDelete(null); }} data-testid={`btn-confirm-delete-guideline-${g.id}`} style={{ padding: "0.3rem 0.625rem", fontSize: "0.75rem" }}>Delete</button>
                  ) : (
                    <button className="glow-btn glow-btn-secondary" onClick={e => { e.stopPropagation(); setConfirmDelete(g.id); }} data-testid={`btn-delete-guideline-${g.id}`} style={{ padding: "0.3rem 0.5rem" }}><Trash2 size={12} /></button>
                  )}
                  {isOpen ? <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />}
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.875rem" }}>
                    {[
                      ["Summary", g.summary], ["Medical Triggers", g.medicalTriggers],
                      ["Job Duty Triggers", g.jobDutyTriggers], ["Documentation Needed", g.documentationNeeded],
                      ["Risk Considerations", g.riskConsiderations],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.25rem" }}>{label}</div>
                        <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {g.sourceLink && (
                    <a href={g.sourceLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", marginTop: "0.875rem", fontSize: "0.8125rem", color: "#b4d7d0", textDecoration: "none" }} data-testid={`link-guideline-source-${g.id}`}>
                      <ExternalLink size={13} />
                      Source Link
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
