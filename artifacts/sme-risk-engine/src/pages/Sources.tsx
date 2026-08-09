import { useState } from "react";
import { Plus, Trash2, Search, ExternalLink, Database, ChevronDown, ChevronUp } from "lucide-react";
import { Source, SourceReliability } from "@/lib/types";
import { generateId } from "@/lib/store";

interface Props { sources: Source[]; onSave: (s: Source) => void; onDelete: (id: string) => void; }

const REL_META: Record<SourceReliability, { color: string }> = {
  High: { color: "#b4d7d0" },
  Moderate: { color: "#a7c7be" },
  Low: { color: "#d6c8aa" },
  Unverified: { color: "#7f9d96" },
};

function blank(): Source {
  return {
    id: generateId(), title: "", organization: "", url: "", publicationDate: "",
    lastReviewed: "", reviewedBy: "", summary: "", relevantConditions: "",
    relevantJobs: "", relevantCountries: "", sourceReliability: "Moderate",
    notes: "", createdAt: new Date().toISOString()
  };
}

export default function Sources({ sources, onSave, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Source | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = sources.filter(s => {
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.organization.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q);
  });

  function save() {
    if (!editing) return;
    onSave(editing);
    setEditing(null);
  }

  function upd(field: keyof Source, value: unknown) {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  }

  const lbl: React.CSSProperties = { display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" };
  const inp = { width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.8125rem" };

  return (
    <div data-testid="sources-page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>Source Library</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)" }}>Reusable agency publications, standards, literature, and reviewer reference sources. No examinee record is stored here.</p>
        </div>
        <button className="glow-btn" onClick={() => setEditing(blank())} data-testid="btn-new-source" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={16} />
          Add Source
        </button>
      </div>

      <div className="glass-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "0.875rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input className="glass-input" style={{ ...inp, paddingLeft: "2.25rem" }} placeholder="Search sources..." value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-sources" />
        </div>
        <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>{filtered.length} of {sources.length} sources</div>
      </div>

      {editing && (
        <div className="glass-card glass-card-active" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "1.25rem" }}>
            {sources.some(s => s.id === editing.id) ? "Edit Source" : "New Source"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div><label style={lbl}>Title</label><input className="glass-input" style={inp} value={editing.title} onChange={e => upd("title", e.target.value)} placeholder="Publication or source title" data-testid="input-source-title" /></div>
            <div><label style={lbl}>Organization</label><input className="glass-input" style={inp} value={editing.organization} onChange={e => upd("organization", e.target.value)} placeholder="Issuing organization" data-testid="input-source-org" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div><label style={lbl}>URL</label><input className="glass-input" style={inp} value={editing.url} onChange={e => upd("url", e.target.value)} placeholder="https://..." data-testid="input-source-url" /></div>
            <div><label style={lbl}>Publication Date</label><input type="date" className="glass-input" style={inp} value={editing.publicationDate} onChange={e => upd("publicationDate", e.target.value)} /></div>
            <div><label style={lbl}>Last Reviewed</label><input type="date" className="glass-input" style={inp} value={editing.lastReviewed} onChange={e => upd("lastReviewed", e.target.value)} /></div>
            <div><label style={lbl}>Reliability</label><select className="glass-input" style={inp} value={editing.sourceReliability} onChange={e => upd("sourceReliability", e.target.value as SourceReliability)} data-testid="select-reliability"><option>High</option><option>Moderate</option><option>Low</option><option>Unverified</option></select></div>
          </div>
          <div style={{ marginBottom: "0.75rem" }}><label style={lbl}>Summary</label><textarea className="glass-input" style={{ ...inp, minHeight: "80px", resize: "vertical" }} value={editing.summary} onChange={e => upd("summary", e.target.value)} data-testid="textarea-source-summary" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div><label style={lbl}>Relevant Conditions</label><input className="glass-input" style={inp} value={editing.relevantConditions} onChange={e => upd("relevantConditions", e.target.value)} placeholder="Cardiovascular, neurologic..." /></div>
            <div><label style={lbl}>Relevant Jobs</label><input className="glass-input" style={inp} value={editing.relevantJobs} onChange={e => upd("relevantJobs", e.target.value)} placeholder="Firefighter, driver..." /></div>
            <div><label style={lbl}>Relevant Countries</label><input className="glass-input" style={inp} value={editing.relevantCountries} onChange={e => upd("relevantCountries", e.target.value)} placeholder="Kuwait, Afghanistan..." /></div>
          </div>
          <div style={{ marginBottom: "1rem" }}><label style={lbl}>Reviewed By</label><input className="glass-input" style={inp} value={editing.reviewedBy} onChange={e => upd("reviewedBy", e.target.value)} /></div>
          <div style={{ marginBottom: "1rem" }}><label style={lbl}>Notes</label><textarea className="glass-input" style={{ ...inp, minHeight: "60px", resize: "vertical" }} value={editing.notes} onChange={e => upd("notes", e.target.value)} /></div>
          <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
            <button className="glow-btn glow-btn-secondary" onClick={() => setEditing(null)} data-testid="btn-cancel-source">Cancel</button>
            <button className="glow-btn" onClick={save} data-testid="btn-save-source">Save Source</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
          <Database size={40} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 1rem" }} />
          <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "0.875rem" }}>No sources found</div>
          <button className="glow-btn" onClick={() => setEditing(blank())} data-testid="btn-add-first-source">Add Source</button>
        </div>
      ) : (
        filtered.map(s => {
          const isOpen = expanded === s.id;
          const rel = REL_META[s.sourceReliability];
          return (
            <div key={s.id} className="glass-card" style={{ marginBottom: "0.75rem", overflow: "hidden" }} data-testid={`source-card-${s.id}`}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem 1.25rem", cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : s.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#fff" }}>{s.title || "Unnamed Source"}</span>
                    <span style={{ fontSize: "0.6875rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: `${rel.color}15`, color: rel.color, fontWeight: 600 }}>{s.sourceReliability}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#b4d7d0" }}>{s.organization}</span>
                    {s.publicationDate && <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{s.publicationDate.split("-")[0]}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button className="glow-btn glow-btn-secondary" onClick={e => { e.stopPropagation(); setEditing({ ...s }); setExpanded(null); }} data-testid={`btn-edit-source-${s.id}`} style={{ padding: "0.3rem 0.625rem", fontSize: "0.75rem" }}>Edit</button>
                  {confirmDelete === s.id ? (
                    <button className="glow-btn glow-btn-danger" onClick={e => { e.stopPropagation(); onDelete(s.id); setConfirmDelete(null); }} style={{ padding: "0.3rem 0.625rem", fontSize: "0.75rem" }}>Delete</button>
                  ) : (
                    <button className="glow-btn glow-btn-secondary" onClick={e => { e.stopPropagation(); setConfirmDelete(s.id); }} data-testid={`btn-delete-source-${s.id}`} style={{ padding: "0.3rem 0.5rem" }}><Trash2 size={12} /></button>
                  )}
                  {isOpen ? <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />}
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.875rem" }}>
                    {[
                      ["Summary", s.summary], ["Relevant Conditions", s.relevantConditions],
                      ["Relevant Jobs", s.relevantJobs], ["Relevant Countries", s.relevantCountries],
                      ["Notes", s.notes],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.25rem" }}>{label}</div>
                        <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.875rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
                    {s.reviewedBy && <span>Reviewed by: {s.reviewedBy}</span>}
                    {s.lastReviewed && <span>Last reviewed: {s.lastReviewed}</span>}
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#b4d7d0", textDecoration: "none" }} data-testid={`link-source-${s.id}`}>
                        <ExternalLink size={12} />
                        Source Link
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
