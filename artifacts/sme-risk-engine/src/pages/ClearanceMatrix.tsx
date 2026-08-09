import { useMemo, useState } from "react";
import { BookOpen, Briefcase, Flame, Plane, Search, Shield, Truck } from "lucide-react";

const FRAMEWORKS = [
  {
    id: "firefighter",
    label: "Firefighter",
    standard: "NFPA 1582",
    icon: Flame,
    source: "NFPA",
    sourceUrl: "https://www.nfpa.org/codes-and-standards/nfpa-1582-standard-development/1582",
    useFor: "Fire service medical review and duty-specific occupational demands.",
    lenses: ["Sudden incapacitation", "Extreme exertion", "SCBA / respirator tolerance", "Heat stress", "Emergency response duties"],
  },
  {
    id: "dot",
    label: "Commercial Driver",
    standard: "DOT / FMCSA",
    icon: Truck,
    source: "FMCSA",
    sourceUrl: "https://www.fmcsa.dot.gov/medical/driver-medical-requirements/driver-medical-fitness-duty",
    useFor: "Commercial motor vehicle medical qualification and safety-sensitive driving.",
    lenses: ["Loss of consciousness", "Vision / hearing", "Medication effects", "Sleep / alertness", "Cardiovascular stability"],
  },
  {
    id: "aviation",
    label: "Aviation",
    standard: "FAA Medical Guidance",
    icon: Plane,
    source: "FAA",
    sourceUrl: "https://www.faa.gov/ame_guide",
    useFor: "Aviation medical review where cognitive performance and incapacitation risk matter.",
    lenses: ["Sudden incapacitation", "Cognition / reaction time", "Medication acceptability", "Neurologic stability", "Vision / hearing"],
  },
  {
    id: "law-enforcement",
    label: "Law Enforcement",
    standard: "Agency / POST Standards",
    icon: Shield,
    source: "Agency-specific",
    sourceUrl: "",
    useFor: "Safety-sensitive law-enforcement duties that depend heavily on agency and jurisdiction requirements.",
    lenses: ["Emergency driving", "Use of force", "Weapon handling", "Stress tolerance", "Physical confrontation"],
  },
  {
    id: "deployment",
    label: "Deployment",
    standard: "Client / Contract / Theater Requirements",
    icon: Briefcase,
    source: "Program-specific",
    sourceUrl: "",
    useFor: "Remote, international, austere, or contract-specific deployment medical review.",
    lenses: ["Medical access", "Medication supply", "Evacuation delay", "Climate exposure", "Specialty follow-up feasibility"],
  },
];

export default function ClearanceMatrix() {
  const [search, setSearch] = useState("");
  const [reviewFinding, setReviewFinding] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FRAMEWORKS;
    return FRAMEWORKS.filter((item) =>
      [item.label, item.standard, item.useFor, ...item.lenses].join(" ").toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.4rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.55rem", color: "#fff", fontWeight: 800 }}>Standards Matrix</h1>
        <p style={{ margin: "0.4rem 0 0", color: "rgba(255,255,255,0.46)", fontSize: "0.86rem", lineHeight: 1.6, maxWidth: 800 }}>
          Compare the review lenses that matter across common occupational contexts. This is a reference tool — it does not calculate or declare clearance.
        </p>
      </div>

      <div className="glass-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "rgba(255,255,255,0.36)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "0.45rem" }}>
          Finding you are reviewing
        </label>
        <input
          value={reviewFinding}
          onChange={(e) => setReviewFinding(e.target.value)}
          placeholder="Example: seizure history, insulin use, uncontrolled hypertension, shoulder restriction…"
          className="glass-input"
          style={{ width: "100%", padding: "0.65rem 0.8rem" }}
        />
        <div style={{ marginTop: "0.55rem", color: "rgba(255,255,255,0.38)", fontSize: "0.72rem" }}>
          The matrix does not score this finding; it helps you remember which questions to ask in each occupational context.
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <Search size={14} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter frameworks or review lenses…"
          className="glass-input"
          style={{ width: "100%", padding: "0.6rem 0.8rem 0.6rem 2.35rem" }}
        />
      </div>

      <div style={{ display: "grid", gap: "0.9rem" }}>
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="glass-card" style={{ padding: "1rem 1.1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr) 250px", gap: "1rem", alignItems: "start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.4rem" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(180,215,208,0.08)", border: "1px solid rgba(180,215,208,0.14)" }}>
                      <Icon size={17} style={{ color: "#b4d7d0" }} />
                    </div>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.92rem" }}>{item.label}</div>
                      <div style={{ color: "#b4d7d0", fontSize: "0.72rem", fontWeight: 700 }}>{item.standard}</div>
                    </div>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.42)", fontSize: "0.75rem", lineHeight: 1.5 }}>{item.useFor}</div>
                </div>

                <div>
                  <div style={{ fontSize: "0.66rem", fontWeight: 800, color: "rgba(255,255,255,0.34)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "0.45rem" }}>
                    Reviewer lenses
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {item.lenses.map((lens) => (
                      <span key={lens} style={{ padding: "0.28rem 0.5rem", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.68)", fontSize: "0.72rem" }}>
                        {lens}
                      </span>
                    ))}
                  </div>
                  {reviewFinding.trim() && (
                    <div style={{ marginTop: "0.7rem", padding: "0.65rem 0.75rem", borderRadius: 8, background: "rgba(180,215,208,0.05)", border: "1px solid rgba(180,215,208,0.12)", color: "rgba(255,255,255,0.62)", fontSize: "0.76rem", lineHeight: 1.5 }}>
                      For <strong style={{ color: "#f4efdc" }}>{reviewFinding}</strong>, review the finding against these lenses and the current source standard rather than assuming the same answer applies across jobs.
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: "0.66rem", fontWeight: 800, color: "rgba(255,255,255,0.34)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "0.45rem" }}>
                    Source starting point
                  </div>
                  {item.sourceUrl ? (
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#b4d7d0", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700 }}>
                      <BookOpen size={14} /> {item.source}
                    </a>
                  ) : (
                    <div style={{ color: "rgba(255,255,255,0.48)", fontSize: "0.76rem", lineHeight: 1.5 }}>{item.source}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
