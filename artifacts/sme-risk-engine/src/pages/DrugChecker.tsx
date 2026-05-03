import { useState, useMemo } from "react";
import {
  Pill, AlertTriangle, ChevronDown, ChevronRight,
  Info, Search, Plus, X, CheckCircle, AlertCircle,
  Thermometer, Zap, Heart
} from "lucide-react";

interface Drug {
  id: string;
  name: string;
  class: string;
  concerns: string[];
  aorRisks: string[];
  sideEffects: string[];
  refrigeration: boolean;
  sedation: boolean;
  cardiacRisk: boolean;
  heatRisk: boolean;
  altitude: boolean;
  severity: "high" | "moderate" | "low";
}

interface Interaction {
  drugs: [string, string];
  severity: "contraindicated" | "major" | "moderate" | "minor";
  description: string;
  clinicalNotes: string;
}

const DRUG_DB: Drug[] = [
  {
    id: "metformin",
    name: "Metformin",
    class: "Biguanide / T2DM",
    concerns: ["Lactic acidosis in dehydration/contrast settings", "GI side effects limit tolerance", "Renal dose adjustment required"],
    aorRisks: ["Heat stress accelerates dehydration risk", "GI illness in austere setting may compound side effects"],
    sideEffects: ["GI intolerance", "Nausea", "Lactic acidosis (rare)"],
    refrigeration: false,
    sedation: false,
    cardiacRisk: false,
    heatRisk: true,
    altitude: false,
    severity: "low",
  },
  {
    id: "insulin",
    name: "Insulin (various)",
    class: "Antidiabetic / Hormone",
    concerns: ["Refrigeration required (2–8°C)", "Hypoglycemia risk in irregular meal settings", "Cold chain break is immediately dangerous"],
    aorRisks: ["AOR cold chain disruption is a critical risk", "Heat degrades unrefrigerated insulin within hours", "Unpredictable activity patterns alter insulin needs"],
    sideEffects: ["Hypoglycemia", "Injection site reactions", "Weight gain"],
    refrigeration: true,
    sedation: false,
    cardiacRisk: false,
    heatRisk: true,
    altitude: false,
    severity: "high",
  },
  {
    id: "metoprolol",
    name: "Metoprolol",
    class: "Beta-Blocker / Cardiovascular",
    concerns: ["Impairs tachycardic response to heat/exercise", "Masks hypoglycemia symptoms", "Abrupt discontinuation risk"],
    aorRisks: ["Heat illness risk elevated — impaired heat dissipation", "Cannot rely on heart rate as exertion guide", "May cause fatigue at altitude"],
    sideEffects: ["Bradycardia", "Fatigue", "Cold extremities", "Depression"],
    refrigeration: false,
    sedation: false,
    cardiacRisk: true,
    heatRisk: true,
    altitude: true,
    severity: "moderate",
  },
  {
    id: "amlodipine",
    name: "Amlodipine",
    class: "Calcium Channel Blocker",
    concerns: ["Peripheral edema exacerbated by heat", "BP drop risk in hot environments", "Drug interactions with CYP3A4 inhibitors (e.g., clarithromycin)"],
    aorRisks: ["Significant peripheral vasodilation + heat stress = risk of hypotension", "Dependent edema in long flights or sitting"],
    sideEffects: ["Peripheral edema", "Flushing", "Headache", "Hypotension"],
    refrigeration: false,
    sedation: false,
    cardiacRisk: true,
    heatRisk: true,
    altitude: false,
    severity: "moderate",
  },
  {
    id: "warfarin",
    name: "Warfarin",
    class: "Anticoagulant",
    concerns: ["INR monitoring required — challenging in austere settings", "Drug/food interactions alter therapeutic range", "Trauma risk elevated in field settings"],
    aorRisks: ["No INR monitoring in most remote locations", "Dengue/tick-borne illness + anticoagulation = severe hemorrhage risk", "Dietary variation alters INR unpredictably"],
    sideEffects: ["Hemorrhage", "Skin necrosis (rare)", "Hematoma at trauma sites"],
    refrigeration: false,
    sedation: false,
    cardiacRisk: true,
    heatRisk: false,
    altitude: false,
    severity: "high",
  },
  {
    id: "prednisone",
    name: "Prednisone / Prednisolone",
    class: "Corticosteroid",
    concerns: ["Immunosuppression — infection risk elevated", "Adrenal insufficiency on abrupt taper", "BP and glucose dysregulation"],
    aorRisks: ["All infectious-disease AOR events carry elevated risk for immunosuppressed personnel", "Wound healing impaired in austere environments", "Heat and exertion interact with adrenal axis effects"],
    sideEffects: ["Immunosuppression", "Hyperglycemia", "Hypertension", "Mood changes", "Cushing features (chronic)"],
    refrigeration: false,
    sedation: false,
    cardiacRisk: false,
    heatRisk: true,
    altitude: false,
    severity: "high",
  },
  {
    id: "sertraline",
    name: "Sertraline (Zoloft)",
    class: "SSRI / Antidepressant",
    concerns: ["Drug interaction with tramadol (serotonin syndrome)", "QTc prolongation risk with other QT-prolonging agents", "Abrupt discontinuation syndrome"],
    aorRisks: ["Drug availability may be limited at remote AOR pharmacies", "Serotonin syndrome risk if local antimalarials or pain medications used concomitantly"],
    sideEffects: ["GI side effects", "Insomnia / somnolence", "Sexual dysfunction", "Hyponatremia (elderly)"],
    refrigeration: false,
    sedation: false,
    cardiacRisk: false,
    heatRisk: false,
    altitude: false,
    severity: "low",
  },
  {
    id: "gabapentin",
    name: "Gabapentin",
    class: "Anticonvulsant / Neuropathic",
    concerns: ["Sedation — safety-sensitive roles require evaluation", "Dizziness increases fall/accident risk", "Renal dose adjustment required"],
    aorRisks: ["Sedation risk in safety-sensitive operations", "Balance and coordination impairment in challenging terrain"],
    sideEffects: ["Sedation", "Dizziness", "Ataxia", "Peripheral edema"],
    refrigeration: false,
    sedation: true,
    cardiacRisk: false,
    heatRisk: false,
    altitude: false,
    severity: "moderate",
  },
  {
    id: "azithromycin",
    name: "Azithromycin",
    class: "Macrolide Antibiotic",
    concerns: ["QTc prolongation — interaction with other QT-prolonging drugs", "Interaction with warfarin (INR elevation)", "Increasing resistance in many AOR regions"],
    aorRisks: ["Often used as traveler's diarrhea treatment — check regional resistance", "QTc drug interactions heightened if co-administered with antimalarials"],
    sideEffects: ["GI effects", "QTc prolongation", "Hepatotoxicity (rare)"],
    refrigeration: false,
    sedation: false,
    cardiacRisk: true,
    heatRisk: false,
    altitude: false,
    severity: "moderate",
  },
  {
    id: "mefloquine",
    name: "Mefloquine (Lariam)",
    class: "Antimalarial",
    concerns: ["Neuropsychiatric side effects — anxiety, vivid dreams, psychosis (rare)", "Contraindicated with psychiatric history or seizure disorder", "QTc prolongation interaction with azithromycin"],
    aorRisks: ["Neuropsychiatric effects may not be apparent until weeks into deployment", "Strongly consider alternatives (atovaquone-proguanil, doxycycline) for personnel with any psychiatric history"],
    sideEffects: ["Neuropsychiatric effects", "Sleep disturbance", "QTc prolongation", "Dizziness"],
    refrigeration: false,
    sedation: false,
    cardiacRisk: true,
    heatRisk: false,
    altitude: false,
    severity: "high",
  },
  {
    id: "doxycycline",
    name: "Doxycycline",
    class: "Tetracycline / Antibiotic / Antimalarial",
    concerns: ["Photosensitivity — sun exposure in field settings is high risk", "GI irritation if not taken with food/water", "Dairy and antacid absorption interaction"],
    aorRisks: ["Sun exposure in tropical/desert AOR elevates phototoxic reaction risk significantly", "Esophageal irritation risk with inadequate hydration"],
    sideEffects: ["Photosensitivity", "GI upset", "Esophageal irritation", "Vaginal yeast"],
    refrigeration: false,
    sedation: false,
    cardiacRisk: false,
    heatRisk: false,
    altitude: false,
    severity: "low",
  },
  {
    id: "hydrochlorothiazide",
    name: "Hydrochlorothiazide (HCTZ)",
    class: "Thiazide Diuretic",
    concerns: ["Electrolyte depletion — hyponatremia, hypokalemia", "Dehydration risk compounded with heat/exertion", "Photosensitivity"],
    aorRisks: ["Heat + diuretic = accelerated dehydration and electrolyte crisis", "Limited electrolyte monitoring in austere settings"],
    sideEffects: ["Hyponatremia", "Hypokalemia", "Dehydration", "Photosensitivity", "Hyperuricemia"],
    refrigeration: false,
    sedation: false,
    cardiacRisk: false,
    heatRisk: true,
    altitude: false,
    severity: "moderate",
  },
];

const INTERACTIONS: Interaction[] = [
  {
    drugs: ["warfarin", "azithromycin"],
    severity: "major",
    description: "Azithromycin markedly elevates warfarin INR through CYP2C9 inhibition and alteration of gut flora.",
    clinicalNotes: "Monitor INR closely within 3–5 days of starting azithromycin. Dose reduction of warfarin typically required.",
  },
  {
    drugs: ["sertraline", "mefloquine"],
    severity: "contraindicated",
    description: "Serotonin syndrome risk and additive QTc prolongation. Mefloquine also lowers seizure threshold — dangerous with SSRIs.",
    clinicalNotes: "Avoid combination. Use atovaquone-proguanil or doxycycline as antimalarial alternative in patients on SSRIs.",
  },
  {
    drugs: ["metoprolol", "azithromycin"],
    severity: "moderate",
    description: "Azithromycin may prolong QTc; beta-blockers can cause bradycardia. Combined QT prolongation risk.",
    clinicalNotes: "ECG monitoring recommended. Avoid in patients with existing conduction abnormalities.",
  },
  {
    drugs: ["mefloquine", "azithromycin"],
    severity: "major",
    description: "Both drugs prolong QTc interval. Combined use significantly elevates torsade de pointes risk.",
    clinicalNotes: "Combination should be avoided. If co-administration unavoidable, ECG monitoring required. Consult cardiology.",
  },
  {
    drugs: ["gabapentin", "metoprolol"],
    severity: "minor",
    description: "Additive CNS depression possible. Dizziness and sedation may be compounded.",
    clinicalNotes: "Advise patient on combined sedation effects. Avoid operation of heavy machinery or safety-sensitive tasks.",
  },
  {
    drugs: ["prednisone", "metformin"],
    severity: "moderate",
    description: "Corticosteroids induce hyperglycemia, counteracting metformin's glycemic control effect.",
    clinicalNotes: "Monitor blood glucose closely when starting or tapering steroids. May require temporary insulin supplementation.",
  },
  {
    drugs: ["amlodipine", "azithromycin"],
    severity: "moderate",
    description: "Azithromycin inhibits CYP3A4, increasing amlodipine plasma levels and risk of hypotension.",
    clinicalNotes: "BP monitoring recommended during co-administration. Amlodipine dose reduction may be required.",
  },
  {
    drugs: ["warfarin", "doxycycline"],
    severity: "moderate",
    description: "Doxycycline alters gut flora and may reduce vitamin K production, elevating anticoagulation effect.",
    clinicalNotes: "Check INR 3–5 days after initiating doxycycline. Warfarin dose reduction may be needed.",
  },
];

const SEVERITY_META = {
  contraindicated: { color: "#b4d7d0", label: "Contraindicated", bg: "rgba(180,215,208,0.10)" },
  major: { color: "#94a3b8", label: "Major", bg: "rgba(148,163,184,0.10)" },
  moderate: { color: "#94a3b8", label: "Moderate", bg: "rgba(148,163,184,0.08)" },
  minor: { color: "#94a3b8", label: "Minor", bg: "rgba(148,163,184,0.08)" },
};

function DrugCard({ drug, onRemove }: { drug: Drug; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const sevColors = { high: "#b4d7d0", moderate: "#a7c7be", low: "#7f9d96" };

  return (
    <div
      style={{
        borderRadius: "10px",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${expanded ? "rgba(180,215,208,0.2)" : "rgba(255,255,255,0.07)"}`,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.75rem 0.875rem",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: `${sevColors[drug.severity]}18`,
            border: `1px solid ${sevColors[drug.severity]}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Pill size={14} style={{ color: sevColors[drug.severity] }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>{drug.name}</div>
          <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>{drug.class}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {drug.refrigeration && (
            <span title="Refrigeration required" style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", background: "rgba(180,215,208,0.10)", border: "1px solid rgba(180,215,208,0.20)", fontSize: "0.6rem", color: "#b4d7d0", fontWeight: 700 }}>COLD</span>
          )}
          {drug.sedation && (
            <span title="Sedation risk" style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", background: "rgba(148,163,184,0.10)", border: "1px solid rgba(148,163,184,0.20)", fontSize: "0.6rem", color: "#cbd5e1", fontWeight: 700 }}>SED</span>
          )}
          {drug.heatRisk && (
            <span title="Heat risk" style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", background: "rgba(148,163,184,0.10)", border: "1px solid rgba(148,163,184,0.20)", fontSize: "0.6rem", color: "#cbd5e1", fontWeight: 700 }}>HEAT</span>
          )}
          {drug.cardiacRisk && (
            <span title="Cardiac/QT risk" style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", background: "rgba(148,163,184,0.10)", border: "1px solid rgba(148,163,184,0.20)", fontSize: "0.6rem", color: "#cbd5e1", fontWeight: 700 }}>CARD</span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "5px", padding: "0.25rem", cursor: "pointer", color: "#f87171", display: "flex", flexShrink: 0 }}
        >
          <X size={12} />
        </button>
        {expanded ? <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />}
      </div>

      {expanded && (
        <div style={{ padding: "0 0.875rem 0.875rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ paddingTop: "0.75rem", display: "grid", gap: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>
                SME Concerns
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {drug.concerns.map((c, i) => (
                  <li key={i} style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.65)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <AlertCircle size={11} style={{ color: "#94a3b8", flexShrink: 0, marginTop: "2px" }} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>
                AOR / Deployment Risks
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {drug.aorRisks.map((r, i) => (
                  <li key={i} style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.65)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <AlertTriangle size={11} style={{ color: "#94a3b8", flexShrink: 0, marginTop: "2px" }} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>
                Side Effects
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                {drug.sideEffects.map(se => (
                  <span key={se} style={{ padding: "0.15rem 0.45rem", borderRadius: "4px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.6875rem", color: "rgba(255,255,255,0.55)" }}>
                    {se}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InteractionAlert({ interaction, selectedIds }: { interaction: Interaction; selectedIds: string[] }) {
  const meta = SEVERITY_META[interaction.severity];
  const [expanded, setExpanded] = useState(interaction.severity === "contraindicated" || interaction.severity === "major");
  const drugA = DRUG_DB.find(d => d.id === interaction.drugs[0]);
  const drugB = DRUG_DB.find(d => d.id === interaction.drugs[1]);
  if (!drugA || !drugB) return null;
  if (!selectedIds.includes(interaction.drugs[0]) || !selectedIds.includes(interaction.drugs[1])) return null;

  return (
    <div
      style={{
        borderRadius: "10px",
        background: meta.bg,
        border: `1px solid ${meta.color}35`,
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.875rem", cursor: "pointer" }}
      >
        <AlertTriangle size={16} style={{ color: meta.color, flexShrink: 0, marginTop: "1px" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                background: `${meta.color}18`,
                color: meta.color,
                border: `1px solid ${meta.color}35`,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {meta.label}
            </span>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>
              {drugA.name} + {drugB.name}
            </span>
          </div>
          <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
            {interaction.description}
          </div>
        </div>
        {expanded ? <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />}
      </div>

      {expanded && (
        <div
          style={{
            padding: "0.625rem 0.875rem 0.875rem",
            borderTop: `1px solid ${meta.color}20`,
            marginLeft: "2.5rem",
          }}
        >
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>
            Clinical Notes
          </div>
          <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
            {interaction.clinicalNotes}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DrugChecker() {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const matchedDrugs = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return DRUG_DB.filter(
      d =>
        !selectedDrugs.includes(d.id) &&
        (d.name.toLowerCase().includes(q) || d.class.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [search, selectedDrugs]);

  const selectedDrugObjects = useMemo(
    () => DRUG_DB.filter(d => selectedDrugs.includes(d.id)),
    [selectedDrugs]
  );

  const activeInteractions = useMemo(
    () =>
      INTERACTIONS.filter(
        i =>
          selectedDrugs.includes(i.drugs[0]) &&
          selectedDrugs.includes(i.drugs[1])
      ).sort((a, b) => {
        const order = ["contraindicated", "major", "moderate", "minor"];
        return order.indexOf(a.severity) - order.indexOf(b.severity);
      }),
    [selectedDrugs]
  );

  const riskFlags = useMemo(() => {
    const flags: { label: string; icon: typeof Thermometer; color: string; drugs: string[] }[] = [];
    const coldChain = selectedDrugObjects.filter(d => d.refrigeration).map(d => d.name);
    const sedating = selectedDrugObjects.filter(d => d.sedation).map(d => d.name);
    const heatRisk = selectedDrugObjects.filter(d => d.heatRisk).map(d => d.name);
    const cardiacRisk = selectedDrugObjects.filter(d => d.cardiacRisk).map(d => d.name);
    if (coldChain.length) flags.push({ label: "Cold-chain dependency", icon: Thermometer, color: "#b4d7d0", drugs: coldChain });
    if (heatRisk.length) flags.push({ label: "Heat illness risk elevated", icon: Thermometer, color: "#d6c8aa", drugs: heatRisk });
    if (sedating.length) flags.push({ label: "Sedation / safety-sensitive concern", icon: Zap, color: "#a7c7be", drugs: sedating });
    if (cardiacRisk.length) flags.push({ label: "Cardiac / QTc risk", icon: Heart, color: "#7f9d96", drugs: cardiacRisk });
    return flags;
  }, [selectedDrugObjects]);

  const hasContraindicated = activeInteractions.some(i => i.severity === "contraindicated");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "1rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
          Drug & Formulary Checker
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", margin: "0.25rem 0 0.875rem", lineHeight: 1.5 }}>
          Screen medication lists for interactions, AOR-specific risks, and deployment-relevant concerns.
        </p>

          <div
            style={{
              padding: "0.5rem 0.875rem",
              background: "rgba(180,215,208,0.08)",
              border: "1px solid rgba(180,215,208,0.18)",
              borderRadius: "8px",
              fontSize: "0.75rem",
              color: "rgba(244,239,220,0.9)",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
            }}
          >
          <Info size={13} style={{ flexShrink: 0, marginTop: "1px", color: "#b4d7d0" }} />
          <span>
            This tool is an <strong>SME orientation aid only</strong>. It does not replace clinical pharmacist review, prescriber consultation, or full interaction databases (e.g., Lexicomp, Micromedex). Always verify interactions before making deployment recommendations.
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "1rem", flex: 1, minHeight: 0 }}>
        {/* Left: drug selection + list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", minHeight: 0 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search medications to add (e.g., metformin, warfarin, insulin)…"
              style={{
                width: "100%",
                paddingLeft: "2.5rem",
                paddingRight: "0.875rem",
                paddingTop: "0.625rem",
                paddingBottom: "0.625rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {showDropdown && matchedDrugs.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  background: "rgba(10,15,30,0.97)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  overflow: "hidden",
                  zIndex: 100,
                  boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
                }}
              >
                {matchedDrugs.map(d => {
                  const sevColors = { high: "#b4d7d0", moderate: "#d6c8aa", low: "#7f9d96" };
                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDrugs(prev => [...prev, d.id]);
                        setSearch("");
                        setShowDropdown(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.625rem 1rem",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <Pill size={14} style={{ color: sevColors[d.severity], flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{d.name}</div>
                        <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>{d.class}</div>
                      </div>
                      <Plus size={13} style={{ color: "#b4d7d0" }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Common drugs quick-add */}
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>
              Common medications (click to add)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {DRUG_DB.filter(d => !selectedDrugs.includes(d.id)).map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDrugs(prev => [...prev, d.id])}
                  style={{
                    padding: "0.25rem 0.625rem",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(180,215,208,0.08)";
                    e.currentTarget.style.borderColor = "rgba(180,215,208,0.25)";
                    e.currentTarget.style.color = "#b4d7d0";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  }}
                >
                  + {d.name}
                </button>
              ))}
              {DRUG_DB.every(d => selectedDrugs.includes(d.id)) && (
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", padding: "0.25rem 0" }}>All medications added</span>
              )}
            </div>
          </div>

          {/* Selected drugs */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {selectedDrugs.length === 0 ? (
              <div
                className="glass-card"
                style={{ textAlign: "center", padding: "3rem 2rem" }}
              >
                <Pill size={36} style={{ color: "rgba(255,255,255,0.15)", marginBottom: "0.875rem" }} />
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "0.375rem" }}>
                  No medications added
                </div>
                <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)" }}>
                  Search above or click common medications to begin screening.
                </div>
              </div>
            ) : (
              selectedDrugObjects.map(d => (
                <DrugCard
                  key={d.id}
                  drug={d}
                  onRemove={() => setSelectedDrugs(prev => prev.filter(id => id !== d.id))}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: interactions + risk flags */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", minHeight: 0 }}>
          {/* Risk flag summary */}
          {riskFlags.length > 0 && (
            <div className="glass-card" style={{ padding: "1rem" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.625rem" }}>
                AOR Risk Flags
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {riskFlags.map((flag, i) => {
                  const Icon = flag.icon;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "0.625rem 0.75rem",
                        borderRadius: "8px",
                        background: `${flag.color}10`,
                        border: `1px solid ${flag.color}30`,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                      }}
                    >
                      <Icon size={13} style={{ color: flag.color, flexShrink: 0, marginTop: "1px" }} />
                      <div>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: flag.color, marginBottom: "0.2rem" }}>{flag.label}</div>
                        <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.45)" }}>
                          {flag.drugs.join(", ")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactions */}
          <div className="glass-card" style={{ flex: 1, padding: "1rem", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Drug Interactions
              </div>
              {activeInteractions.length > 0 && (
                <span
                  style={{
                    padding: "0.1rem 0.45rem",
                    borderRadius: "4px",
                    background: hasContraindicated ? "rgba(180,215,208,0.12)" : "rgba(214,200,170,0.12)",
                    border: `1px solid ${hasContraindicated ? "rgba(180,215,208,0.3)" : "rgba(214,200,170,0.28)"}`,
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    color: hasContraindicated ? "#b4d7d0" : "#d6c8aa",
                  }}
                >
                  {activeInteractions.length} found
                </span>
              )}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {selectedDrugs.length < 2 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.25)", fontSize: "0.8125rem" }}>
                  Add 2+ medications to check for interactions.
                </div>
              ) : activeInteractions.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1.5rem",
                    background: "rgba(34,197,94,0.07)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: "10px",
                  }}
                >
                  <CheckCircle size={24} style={{ color: "#b4d7d0", marginBottom: "0.5rem" }} />
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#b4d7d0" }}>No known interactions</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "0.25rem", lineHeight: 1.4 }}>
                    No interactions found in this database for the selected medications. Always verify with a comprehensive drug interaction database.
                  </div>
                </div>
              ) : (
                activeInteractions.map((interaction, i) => (
                  <InteractionAlert key={i} interaction={interaction} selectedIds={selectedDrugs} />
                ))
              )}
            </div>
          </div>

          {/* Clear button */}
          {selectedDrugs.length > 0 && (
            <button
              onClick={() => setSelectedDrugs([])}
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171",
                fontSize: "0.8125rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Clear All Medications
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
