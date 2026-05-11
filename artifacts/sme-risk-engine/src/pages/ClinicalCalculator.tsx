import { useState, useRef, useCallback } from "react";
import {
  Calculator, Upload, X, ChevronDown, ChevronRight,
  Info, AlertTriangle, CheckCircle, RefreshCw, FileImage,
  Heart, Activity, Droplets, Scale, Zap
} from "lucide-react";
import { createWorker } from "tesseract.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalcField {
  key: string;
  label: string;
  unit?: string;
  type: "number" | "select";
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  extracted?: string;
}

interface CalcResult {
  label: string;
  value: string | number;
  interpretation: string;
  color: string;
  reference: string;
}

// ─── Calculator definitions ───────────────────────────────────────────────────

const CALCS = [
  { id: "bmi", label: "BMI", icon: Scale, desc: "Body Mass Index (weight/height²)" },
  { id: "ascvd", label: "ASCVD 10-yr Risk", icon: Heart, desc: "ACC/AHA Pooled Cohort Equations" },
  { id: "egfr", label: "eGFR (CKD-EPI)", icon: Droplets, desc: "Chronic kidney disease staging" },
  { id: "framingham", label: "Framingham Score", icon: Activity, desc: "10-yr coronary heart disease risk" },
  { id: "mets", label: "METs Estimate", icon: Zap, desc: "Estimated metabolic equivalents from exercise data" },
];

const FIELDS: Record<string, CalcField[]> = {
  bmi: [
    { key: "weight_kg", label: "Weight", unit: "kg", type: "number", min: 20, max: 300, step: 0.1 },
    { key: "height_cm", label: "Height", unit: "cm", type: "number", min: 100, max: 250, step: 0.5 },
  ],
  ascvd: [
    { key: "age", label: "Age", unit: "yrs", type: "number", min: 40, max: 79, step: 1 },
    { key: "sex", label: "Sex", type: "select", options: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }] },
    { key: "race", label: "Race", type: "select", options: [{ label: "White/Other", value: "white" }, { label: "African American", value: "aa" }] },
    { key: "total_chol", label: "Total Cholesterol", unit: "mg/dL", type: "number", min: 100, max: 400, step: 1 },
    { key: "hdl", label: "HDL-C", unit: "mg/dL", type: "number", min: 20, max: 150, step: 1 },
    { key: "sbp", label: "Systolic BP", unit: "mmHg", type: "number", min: 90, max: 220, step: 1 },
    { key: "bp_treated", label: "On BP Treatment?", type: "select", options: [{ label: "No", value: "0" }, { label: "Yes", value: "1" }] },
    { key: "diabetes", label: "Diabetes?", type: "select", options: [{ label: "No", value: "0" }, { label: "Yes", value: "1" }] },
    { key: "smoker", label: "Current Smoker?", type: "select", options: [{ label: "No", value: "0" }, { label: "Yes", value: "1" }] },
  ],
  egfr: [
    { key: "creatinine", label: "Serum Creatinine", unit: "mg/dL", type: "number", min: 0.3, max: 15, step: 0.01 },
    { key: "age", label: "Age", unit: "yrs", type: "number", min: 18, max: 100, step: 1 },
    { key: "sex", label: "Sex", type: "select", options: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }] },
  ],
  framingham: [
    { key: "age", label: "Age", unit: "yrs", type: "number", min: 30, max: 74, step: 1 },
    { key: "sex", label: "Sex", type: "select", options: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }] },
    { key: "total_chol", label: "Total Cholesterol", unit: "mg/dL", type: "number", min: 100, max: 400, step: 1 },
    { key: "hdl", label: "HDL-C", unit: "mg/dL", type: "number", min: 20, max: 150, step: 1 },
    { key: "sbp", label: "Systolic BP", unit: "mmHg", type: "number", min: 90, max: 220, step: 1 },
    { key: "smoker", label: "Current Smoker?", type: "select", options: [{ label: "No", value: "0" }, { label: "Yes", value: "1" }] },
    { key: "diabetes", label: "Diabetes?", type: "select", options: [{ label: "No", value: "0" }, { label: "Yes", value: "1" }] },
  ],
  mets: [
    { key: "distance_m", label: "Distance walked/run", unit: "meters", type: "number", min: 0, max: 10000, step: 10 },
    { key: "time_min", label: "Time", unit: "minutes", type: "number", min: 1, max: 60, step: 0.5 },
    { key: "weight_kg", label: "Body Weight", unit: "kg", type: "number", min: 30, max: 250, step: 0.5 },
    { key: "grade_pct", label: "Grade/Incline", unit: "%", type: "number", min: 0, max: 30, step: 0.5 },
  ],
};

// ─── Calculation functions ────────────────────────────────────────────────────

function calcBMI(vals: Record<string, string>): CalcResult | null {
  const w = parseFloat(vals.weight_kg);
  const h = parseFloat(vals.height_cm) / 100;
  if (!w || !h) return null;
  const bmi = w / (h * h);
  let interp = "", color = "#b4d7d0";
  if (bmi < 18.5) { interp = "Underweight"; color = "#d6c8aa"; }
  else if (bmi < 25) { interp = "Normal weight"; color = "#b4d7d0"; }
  else if (bmi < 30) { interp = "Overweight"; color = "#a7c7be"; }
  else if (bmi < 35) { interp = "Obese Class I"; color = "#7f9d96"; }
  else if (bmi < 40) { interp = "Obese Class II"; color = "#7f9d96"; }
  else { interp = "Obese Class III"; color = "#7f9d96"; }
  return {
    label: "BMI",
    value: bmi.toFixed(1),
    interpretation: interp,
    color,
    reference: "WHO BMI Classification (2000)"
  };
}

function calcASCVD(vals: Record<string, string>): CalcResult | null {
  const age = parseFloat(vals.age);
  const tc = parseFloat(vals.total_chol);
  const hdl = parseFloat(vals.hdl);
  const sbp = parseFloat(vals.sbp);
  if (!age || !tc || !hdl || !sbp) return null;

  const sex = vals.sex || "male";
  const race = vals.race || "white";
  const treated = parseInt(vals.bp_treated || "0");
  const dm = parseInt(vals.diabetes || "0");
  const smoker = parseInt(vals.smoker || "0");

  let ln_age = Math.log(age);
  let ln_tc = Math.log(tc);
  let ln_hdl = Math.log(hdl);
  let ln_sbp = Math.log(sbp);
  let coeff: number;
  let baseline: number;
  let mean: number;

  if (sex === "male" && race === "aa") {
    coeff = 2.469 * ln_age + 0.302 * ln_tc - 0.307 * ln_hdl +
      (treated ? 1.916 * ln_sbp : 1.809 * ln_sbp) +
      0.549 * smoker + 0.645 * dm;
    baseline = 0.8954;
    mean = 19.54;
  } else if (sex === "female" && race === "aa") {
    coeff = 17.1141 * ln_age + 0.9396 * ln_tc - 18.9196 * ln_hdl +
      4.4748 * Math.log(Math.log(age)) * ln_hdl +
      29.2907 * Math.log(Math.log(age)) * Math.log(sbp) * (treated ? 1 : 0) -
      6.4321 * Math.log(Math.log(age)) * Math.log(sbp) * (treated ? 0 : 1) +
      0.8738 * smoker - 0.8738 * Math.log(age) * smoker + 0.8647 * dm;
    baseline = 0.9533;
    mean = 86.61;
  } else if (sex === "female") {
    coeff = -29.799 * ln_age + 4.884 * ln_age * ln_age +
      13.54 * ln_tc - 3.114 * ln_age * ln_tc -
      13.578 * ln_hdl + 3.149 * ln_age * ln_hdl +
      (treated ? 2.019 * ln_sbp : -2.996 * ln_sbp) +
      7.574 * smoker - 1.665 * ln_age * smoker + 0.661 * dm;
    baseline = 0.9665;
    mean = -29.18;
  } else {
    coeff = 12.344 * ln_age + 11.853 * ln_tc - 2.664 * ln_age * ln_tc -
      7.99 * ln_hdl + 1.769 * ln_age * ln_hdl +
      (treated ? 1.797 * ln_sbp : 1.764 * ln_sbp) +
      7.837 * smoker - 1.795 * ln_age * smoker + 0.658 * dm;
    baseline = 0.9144;
    mean = 61.18;
  }

  const risk = (1 - Math.pow(baseline, Math.exp(coeff - mean))) * 100;
  const clamped = Math.min(Math.max(risk, 0), 100);
  let interp = "", color = "#b4d7d0";
  if (clamped < 5) { interp = "Low risk (<5%)"; color = "#b4d7d0"; }
  else if (clamped < 7.5) { interp = "Borderline risk (5–7.5%)"; color = "#d6c8aa"; }
  else if (clamped < 20) { interp = "Intermediate risk (7.5–20%)"; color = "#a7c7be"; }
  else { interp = "High risk (≥20%)"; color = "#7f9d96"; }

  return {
    label: "10-year ASCVD Risk",
    value: clamped.toFixed(1) + "%",
    interpretation: interp,
    color,
    reference: "ACC/AHA 2013 Pooled Cohort Equations (Goff et al., 2014)"
  };
}

function calcEGFR(vals: Record<string, string>): CalcResult | null {
  const scr = parseFloat(vals.creatinine);
  const age = parseFloat(vals.age);
  if (!scr || !age) return null;
  const sex = vals.sex || "male";
  const kappa = sex === "female" ? 0.7 : 0.9;
  const alpha = sex === "female" ? -0.241 : -0.302;
  const sexMult = sex === "female" ? 1.012 : 1.0;
  const ratio = scr / kappa;
  const egfr = 142 * Math.pow(Math.min(ratio, 1), alpha) *
    Math.pow(Math.max(ratio, 1), -1.200) *
    Math.pow(0.9938, age) * sexMult;
  let stage = "", color = "#b4d7d0";
  if (egfr >= 90) { stage = "G1 — Normal or high (≥90)"; color = "#b4d7d0"; }
  else if (egfr >= 60) { stage = "G2 — Mildly decreased (60–89)"; color = "#a7c7be"; }
  else if (egfr >= 45) { stage = "G3a — Mildly-moderately decreased (45–59)"; color = "#d6c8aa"; }
  else if (egfr >= 30) { stage = "G3b — Moderately-severely decreased (30–44)"; color = "#d6c8aa"; }
  else if (egfr >= 15) { stage = "G4 — Severely decreased (15–29)"; color = "#7f9d96"; }
  else { stage = "G5 — Kidney failure (<15)"; color = "#7f9d96"; }
  return {
    label: "eGFR",
    value: egfr.toFixed(0) + " mL/min/1.73m²",
    interpretation: stage,
    color,
    reference: "CKD-EPI 2021 Creatinine Equation (Inker et al., NEJM 2021)"
  };
}

function calcFramingham(vals: Record<string, string>): CalcResult | null {
  const age = parseFloat(vals.age);
  const tc = parseFloat(vals.total_chol);
  const hdl = parseFloat(vals.hdl);
  const sbp = parseFloat(vals.sbp);
  if (!age || !tc || !hdl || !sbp) return null;
  const sex = vals.sex || "male";
  const smoker = parseInt(vals.smoker || "0");
  const dm = parseInt(vals.diabetes || "0");

  let pts = 0;
  if (sex === "male") {
    if (age < 35) pts += -9;
    else if (age < 40) pts += -4;
    else if (age < 45) pts += 0;
    else if (age < 50) pts += 3;
    else if (age < 55) pts += 6;
    else if (age < 60) pts += 8;
    else if (age < 65) pts += 10;
    else if (age < 70) pts += 11;
    else pts += 12;
    if (tc < 160) pts += 0;
    else if (tc < 200) pts += 4;
    else if (tc < 240) pts += 7;
    else if (tc < 280) pts += 9;
    else pts += 11;
    if (hdl >= 60) pts += -2;
    else if (hdl >= 50) pts += 0;
    else if (hdl >= 45) pts += 1;
    else if (hdl >= 35) pts += 2;
    else pts += 2;
    if (sbp < 120) pts += 0;
    else if (sbp < 130) pts += 1;
    else if (sbp < 140) pts += 2;
    else if (sbp < 160) pts += 2;
    else pts += 3;
    if (smoker) pts += 4;
    if (dm) pts += 3;
  } else {
    if (age < 35) pts += -7;
    else if (age < 40) pts += -3;
    else if (age < 45) pts += 0;
    else if (age < 50) pts += 3;
    else if (age < 55) pts += 6;
    else if (age < 60) pts += 8;
    else if (age < 65) pts += 10;
    else if (age < 70) pts += 12;
    else pts += 14;
    if (tc < 160) pts += 0;
    else if (tc < 200) pts += 4;
    else if (tc < 240) pts += 8;
    else if (tc < 280) pts += 11;
    else pts += 13;
    if (hdl >= 60) pts += -2;
    else if (hdl >= 50) pts += 0;
    else if (hdl >= 45) pts += 1;
    else if (hdl >= 35) pts += 2;
    else pts += 3;
    if (sbp < 120) pts += -3;
    else if (sbp < 130) pts += 0;
    else if (sbp < 140) pts += 1;
    else if (sbp < 150) pts += 2;
    else if (sbp < 160) pts += 4;
    else pts += 5;
    if (smoker) pts += 3;
    if (dm) pts += 4;
  }

  const riskTable: Record<string, number[]> = {
    male: [1, 1, 1, 2, 2, 2, 3, 4, 4, 5, 6, 8, 10, 12, 16, 20, 25],
    female: [1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 6, 8, 9, 11, 14, 17, 22],
  };
  const idx = Math.max(0, Math.min(pts + 1, (riskTable[sex].length - 1)));
  const risk = riskTable[sex][idx];
  let interp = "", color = "#b4d7d0";
  if (risk < 10) { interp = "Low risk (<10%)"; color = "#b4d7d0"; }
  else if (risk < 20) { interp = "Moderate risk (10–20%)"; color = "#d6c8aa"; }
  else { interp = "High risk (≥20%)"; color = "#7f9d96"; }
  return {
    label: "10-yr Framingham CHD Risk",
    value: risk + "%",
    interpretation: interp,
    color,
    reference: "Framingham Heart Study (Wilson et al., Circulation 1998)"
  };
}

function calcMETs(vals: Record<string, string>): CalcResult | null {
  const dist = parseFloat(vals.distance_m);
  const time = parseFloat(vals.time_min);
  const weight = parseFloat(vals.weight_kg);
  const grade = parseFloat(vals.grade_pct || "0");
  if (!dist || !time || !weight) return null;
  const speed_mpm = dist / time;
  const speed_mph = speed_mpm * 0.03728;
  const grade_frac = grade / 100;
  const vo2 = (0.1 * speed_mpm) + (1.8 * speed_mpm * grade_frac) + 3.5;
  const mets = vo2 / 3.5;
  let interp = "", color = "#b4d7d0";
  if (mets < 4) { interp = "Poor functional capacity (<4 METs)"; color = "#7f9d96"; }
  else if (mets < 7) { interp = "Moderate functional capacity (4–7 METs)"; color = "#d6c8aa"; }
  else if (mets < 10) { interp = "Good functional capacity (7–10 METs)"; color = "#a7c7be"; }
  else { interp = "Excellent functional capacity (>10 METs)"; color = "#b4d7d0"; }
  return {
    label: "Estimated METs",
    value: mets.toFixed(1),
    interpretation: interp,
    color,
    reference: "ACSM Guidelines for Exercise Testing (ACSM, 2022)"
  };
}

const CALC_FNS: Record<string, (v: Record<string, string>) => CalcResult | null> = {
  bmi: calcBMI,
  ascvd: calcASCVD,
  egfr: calcEGFR,
  framingham: calcFramingham,
  mets: calcMETs,
};

// ─── OCR helpers ──────────────────────────────────────────────────────────────

const OCR_PATTERNS: Record<string, RegExp[]> = {
  age: [/\bage[\s:=]+(\d{1,3})/i, /(\d{2,3})\s*(?:year|yr)s?\s*old/i],
  weight_kg: [/weight[\s:=]+(\d{2,3}(?:\.\d)?)\s*kg/i],
  height_cm: [/height[\s:=]+(\d{2,3}(?:\.\d)?)\s*cm/i, /(\d{1,3})\.(\d)\s*cm/i],
  total_chol: [/(?:total\s*)?chol(?:esterol)?[\s:=]+(\d{2,3})/i, /TC[\s:=]+(\d{2,3})/i],
  hdl: [/HDL[\s:\-=C]+(\d{2,3})/i, /HDL-C[\s:=]+(\d{2,3})/i],
  ldl: [/LDL[\s:\-=C]+(\d{2,3})/i],
  sbp: [/(?:SBP|systolic)[\s:=]+(\d{2,3})/i, /(\d{2,3})\s*\/\s*\d{2,3}/],
  creatinine: [/creatinine[\s:=]+(\d+\.\d+)/i, /Cr[\s:=]+(\d+\.\d+)/i],
  glucose: [/glucose[\s:=]+(\d{2,3})/i, /GLU[\s:=]+(\d{2,3})/i],
  hba1c: [/HbA1c[\s:=]+(\d+\.\d?)/i, /A1C[\s:=]+(\d+\.\d?)/i],
};

function extractFromOCR(text: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const [key, patterns] of Object.entries(OCR_PATTERNS)) {
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) {
        found[key] = m[1];
        break;
      }
    }
  }
  return found;
}

// ─── Components ───────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: CalcResult }) {
  return (
    <div style={{
      padding: "1rem",
      borderRadius: "10px",
      background: `${result.color}0f`,
      border: `1px solid ${result.color}25`,
    }}>
      <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
        {result.label}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, color: result.color, lineHeight: 1.1, marginBottom: "0.25rem" }}>
        {result.value}
      </div>
      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "0.375rem" }}>
        {result.interpretation}
      </div>
      <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
        {result.reference}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  extracted,
  onChange,
}: {
  field: CalcField;
  value: string;
  extracted?: string;
  onChange: (v: string) => void;
}) {
  const hasExtracted = extracted && extracted !== value;
  if (field.type === "select") {
    return (
      <div>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.25rem" }}>
          {field.label}
        </label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "7px",
            color: value ? "#fff" : "rgba(255,255,255,0.35)",
            fontSize: "0.875rem",
            outline: "none",
          }}
        >
          <option value="">Select…</option>
          {field.options!.map(o => (
            <option key={o.value} value={o.value} style={{ background: "#1a2035" }}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {field.label}{field.unit && <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400, textTransform: "none" }}> ({field.unit})</span>}
        </label>
        {extracted && (
          <button
            onClick={() => onChange(extracted)}
            style={{
              fontSize: "0.6rem",
              padding: "0.1rem 0.4rem",
              borderRadius: "4px",
              background: "rgba(180,215,208,0.12)",
              border: "1px solid rgba(180,215,208,0.25)",
              color: "#b4d7d0",
              cursor: "pointer",
              fontWeight: 700,
            }}
            title={`OCR detected: ${extracted}`}
          >
            OCR: {extracted} ↑
          </button>
        )}
      </div>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={hasExtracted ? `Detected: ${extracted}` : "Enter value…"}
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${extracted && !value ? "rgba(180,215,208,0.3)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "7px",
          color: "#fff",
          fontSize: "0.875rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClinicalCalculator() {
  const [activeCalc, setActiveCalc] = useState("ascvd");
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [result, setResult] = useState<CalcResult | null>(null);
  const [ocr, setOcr] = useState<{ status: "idle" | "running" | "done"; extracted: Record<string, string>; text: string }>({ status: "idle", extracted: {}, text: "" });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const getVal = (calcId: string, key: string) => values[calcId]?.[key] ?? "";
  const setVal = (calcId: string, key: string, v: string) =>
    setValues(prev => ({ ...prev, [calcId]: { ...(prev[calcId] ?? {}), [key]: v } }));

  const runCalc = useCallback(() => {
    const fn = CALC_FNS[activeCalc];
    if (!fn) return;
    const r = fn(values[activeCalc] ?? {});
    setResult(r);
  }, [activeCalc, values]);

  const handleFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setOcr({ status: "running", extracted: {}, text: "" });
    try {
      const { createWorker: cw } = await import("tesseract.js");
      const worker = await cw("eng");
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      const extracted = extractFromOCR(text);
      setOcr({ status: "done", extracted, text });
      // Auto-fill fields that were detected
      setValues(prev => {
        const next = { ...prev };
        for (const [key, val] of Object.entries(extracted)) {
          for (const calcId of Object.keys(FIELDS)) {
            const fieldExists = FIELDS[calcId].some(f => f.key === key);
            if (fieldExists) {
              next[calcId] = { ...(next[calcId] ?? {}), [key]: val };
            }
          }
        }
        return next;
      });
    } catch {
      setOcr({ status: "idle", extracted: {}, text: "" });
    }
  }, []);

  const fields = FIELDS[activeCalc] ?? [];
  const activeCalcMeta = CALCS.find(c => c.id === activeCalc)!;
  const ActiveIcon = activeCalcMeta.icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "1rem" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.625rem" }}>
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              Clinical Calculators
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", margin: "0.25rem 0 0" }}>
              ASCVD, BMI, eGFR, Framingham, METs — with OCR auto-fill from lab screenshots.
            </p>
          </div>
        </div>
        {/* Disclaimer */}
        <div style={{ padding: "0.5rem 0.875rem", background: "rgba(180,215,208,0.06)", border: "1px solid rgba(180,215,208,0.18)", borderRadius: "8px", fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <Info size={13} style={{ color: "#b4d7d0", flexShrink: 0, marginTop: "1px" }} />
          <span>These calculators provide <strong>decision-support estimates only</strong>. Results must be verified by a qualified clinician before being used in fitness determinations.</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flex: 1, minHeight: 0 }}>
        {/* Left: Calculator selector + OCR */}
        <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Calc tabs */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              Calculators
            </div>
            {CALCS.map(c => {
              const Icon = c.icon;
              const active = activeCalc === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => { setActiveCalc(c.id); setResult(null); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    padding: "0.625rem 0.75rem",
                    background: active ? "rgba(180,215,208,0.08)" : "transparent",
                    border: "none",
                    borderLeft: active ? "2px solid #b4d7d0" : "2px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Icon size={14} style={{ color: active ? "#b4d7d0" : "rgba(255,255,255,0.35)", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: active ? "#fff" : "rgba(255,255,255,0.55)" }}>{c.label}</div>
                    <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{c.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* OCR upload */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              OCR Auto-Fill
            </div>
            <div style={{ padding: "0.75rem" }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px dashed rgba(180,215,208,0.3)",
                  borderRadius: "8px",
                  background: ocr.status === "running" ? "rgba(180,215,208,0.05)" : "transparent",
                  color: "#b4d7d0",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                }}
              >
                {ocr.status === "running" ? (
                  <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />Scanning…</>
                ) : (
                  <><Upload size={13} />Upload Lab Screenshot</>
                )}
              </button>
              {imagePreview && (
                <div style={{ marginTop: "0.5rem", position: "relative" }}>
                  <img src={imagePreview} alt="OCR preview" style={{ width: "100%", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", opacity: 0.85 }} />
                  <button
                    onClick={() => { setImagePreview(null); setOcr({ status: "idle", extracted: {}, text: "" }); }}
                    style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#fff", cursor: "pointer", padding: "2px 4px", display: "flex" }}
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
              {ocr.status === "done" && Object.keys(ocr.extracted).length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.3)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Detected values</div>
                  {Object.entries(ocr.extracted).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0.125rem 0", color: "rgba(255,255,255,0.6)" }}>
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>{k}</span>
                      <span style={{ color: "#b4d7d0", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {ocr.status === "done" && Object.keys(ocr.extracted).length === 0 && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
                  No lab values detected. Enter manually.
                </div>
              )}
              <div style={{ marginTop: "0.625rem", fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
                Upload a screenshot of a lab report or vitals summary. Detected values auto-fill fields above.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Calculator form + result */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto" }}>
          {/* Calculator form */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(180,215,208,0.1)", border: "1px solid rgba(180,215,208,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ActiveIcon size={16} style={{ color: "#b4d7d0" }} />
              </div>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{activeCalcMeta.label}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{activeCalcMeta.desc}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
              {fields.map(f => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={getVal(activeCalc, f.key)}
                  extracted={ocr.extracted[f.key]}
                  onChange={v => setVal(activeCalc, f.key, v)}
                />
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.625rem" }}>
              <button
                onClick={runCalc}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  background: "rgba(180,215,208,0.15)",
                  border: "1px solid rgba(180,215,208,0.35)",
                  color: "#b4d7d0",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Calculator size={14} />
                Calculate
              </button>
              <button
                onClick={() => { setValues(prev => ({ ...prev, [activeCalc]: {} })); setResult(null); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={14} />
                Clear
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div>
              <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Result</div>
              <ResultCard result={result} />
              <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "7px", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "flex", gap: "0.375rem", alignItems: "flex-start" }}>
                <AlertTriangle size={11} style={{ color: "#94a3b8", flexShrink: 0, marginTop: "1px" }} />
                This result is a <strong style={{ color: "rgba(255,255,255,0.6)" }}>decision-support estimate</strong>. It must be verified by a licensed clinician. Not a substitute for full clinical evaluation.
              </div>
            </div>
          )}

          {/* OCR Raw Text Toggle */}
          {ocr.text && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", overflow: "hidden" }}>
              <button
                onClick={() => setExpanded(expanded === "ocr" ? null : "ocr")}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.875rem", background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: "0.8125rem", cursor: "pointer" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <FileImage size={13} />
                  Raw OCR Text
                </span>
                {expanded === "ocr" ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              {expanded === "ocr" && (
                <pre style={{ margin: 0, padding: "0.75rem", fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", overflow: "auto", maxHeight: "150px", borderTop: "1px solid rgba(255,255,255,0.05)", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}>
                  {ocr.text}
                </pre>
              )}
            </div>
          )}

          {/* Reference info */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", overflow: "hidden" }}>
            <button
              onClick={() => setExpanded(expanded === "refs" ? null : "refs")}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.875rem", background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: "0.8125rem", cursor: "pointer" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Info size={13} />
                Calculator Sources & Methodology
              </span>
              {expanded === "refs" ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {expanded === "refs" && (
              <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { name: "ASCVD (Pooled Cohort)", ref: "Goff DC Jr et al. 2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk. Circulation. 2014;129(25 Suppl 2):S49-73." },
                  { name: "BMI Classification", ref: "World Health Organization. Obesity: preventing and managing the global epidemic. Report of a WHO Consultation. WHO Technical Report Series 894. Geneva: WHO, 2000." },
                  { name: "eGFR (CKD-EPI 2021)", ref: "Inker LA et al. New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race. N Engl J Med. 2021;385(19):1737-1749." },
                  { name: "Framingham CHD", ref: "Wilson PWF et al. Prediction of Coronary Heart Disease Using Risk Factor Categories. Circulation. 1998;97(18):1837-1847." },
                  { name: "METs (ACSM)", ref: "American College of Sports Medicine. ACSM's Guidelines for Exercise Testing and Prescription, 11th ed. Lippincott Williams & Wilkins, 2022." },
                ].map(r => (
                  <div key={r.name} style={{ fontSize: "0.75rem" }}>
                    <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{r.name}: </span>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>{r.ref}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
