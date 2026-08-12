import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calculator,
  ChevronDown,
  ChevronRight,
  Cigarette,
  Droplets,
  ExternalLink,
  Heart,
  Info,
  RefreshCw,
  Scale,
  Zap,
} from "lucide-react";
import "./clinical-calculator.css";
import {
  adjustedBodyWeight,
  cockcroftGault,
  devineIdealBodyWeight,
  heatIndexFahrenheit,
  maximumPredictedHeartRate,
  mostellerBsa,
  qtcBazett,
  qtcFridericia,
  targetHeartRateZone,
  windChillFahrenheit,
  type Sex,
} from "../lib/clinicalCalculations";

type CalcField = {
  key: string;
  label: string;
  unit?: string;
  type: "number" | "select";
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
};

type CalcResult = {
  label: string;
  value: string;
  interpretation: string;
  reference: string;
};

type CalcDefinition = {
  id: string;
  label: string;
  description: string;
  icon: typeof Calculator;
  fields: CalcField[];
  calculate: (values: Record<string, string>) => CalcResult | null;
};

const sexOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

function number(values: Record<string, string>, key: string): number {
  return Number.parseFloat(values[key] || "");
}

function calcBMI(values: Record<string, string>): CalcResult | null {
  const weight = number(values, "weight_kg");
  const heightM = number(values, "height_cm") / 100;
  if (!weight || !heightM) return null;
  const bmi = weight / (heightM * heightM);
  const interpretation =
    bmi < 18.5
      ? "Underweight range"
      : bmi < 25
        ? "Healthy-weight range"
        : bmi < 30
          ? "Overweight range"
          : bmi < 35
            ? "Obesity class 1 range"
            : bmi < 40
              ? "Obesity class 2 range"
              : "Obesity class 3 range";
  return {
    label: "BMI",
    value: bmi.toFixed(1),
    interpretation: `${interpretation}. BMI is a screening measure, not a fitness determination.`,
    reference: "CDC adult BMI categories",
  };
}

function calcEGFR(values: Record<string, string>): CalcResult | null {
  const creatinine = number(values, "creatinine");
  const age = number(values, "age");
  if (!creatinine || !age || !values.sex) return null;
  const female = values.sex === "female";
  const kappa = female ? 0.7 : 0.9;
  const alpha = female ? -0.241 : -0.302;
  const sexMultiplier = female ? 1.012 : 1;
  const ratio = creatinine / kappa;
  const egfr =
    142 *
    Math.pow(Math.min(ratio, 1), alpha) *
    Math.pow(Math.max(ratio, 1), -1.2) *
    Math.pow(0.9938, age) *
    sexMultiplier;
  const interpretation =
    egfr >= 90
      ? "G1 eGFR range — eGFR alone does not establish CKD"
      : egfr >= 60
        ? "G2 eGFR range — eGFR alone does not establish CKD"
        : egfr >= 45
          ? "G3a eGFR range"
          : egfr >= 30
            ? "G3b eGFR range"
            : egfr >= 15
              ? "G4 eGFR range"
              : "G5 eGFR range";
  return {
    label: "eGFR",
    value: `${egfr.toFixed(0)} mL/min/1.73m²`,
    interpretation,
    reference: "CKD-EPI 2021 race-free creatinine equation",
  };
}

function calcMAP(values: Record<string, string>): CalcResult | null {
  const sbp = number(values, "sbp");
  const dbp = number(values, "dbp");
  if (!sbp || !dbp || sbp <= dbp) return null;
  const map = (sbp + 2 * dbp) / 3;
  return {
    label: "Estimated mean arterial pressure",
    value: `${map.toFixed(0)} mmHg`,
    interpretation:
      "Arithmetic estimate from systolic and diastolic pressure. Apply any program-specific BP criteria separately.",
    reference: "MAP ≈ (SBP + 2×DBP) / 3",
  };
}

function calcPackYears(values: Record<string, string>): CalcResult | null {
  const cigarettesPerDay = number(values, "cigarettes_per_day");
  const years = number(values, "years");
  if (
    Number.isNaN(cigarettesPerDay) ||
    Number.isNaN(years) ||
    cigarettesPerDay < 0 ||
    years < 0
  )
    return null;
  const packYears = (cigarettesPerDay / 20) * years;
  return {
    label: "Smoking exposure",
    value: `${packYears.toFixed(1)} pack-years`,
    interpretation:
      "Exposure summary only. Screening or occupational criteria must come from the applicable current standard.",
    reference: "(cigarettes per day ÷ 20) × years smoked",
  };
}

function calcWalkingMETs(values: Record<string, string>): CalcResult | null {
  const speedMph = number(values, "speed_mph");
  const gradePercent = number(values, "grade_pct");
  if (!speedMph || Number.isNaN(gradePercent) || gradePercent < 0) return null;
  const speedMetersPerMinute = speedMph * 26.8224;
  const grade = gradePercent / 100;
  const vo2 =
    0.1 * speedMetersPerMinute + 1.8 * speedMetersPerMinute * grade + 3.5;
  const mets = vo2 / 3.5;
  const speedNote =
    speedMph >= 1.9 && speedMph <= 3.7
      ? "Speed is within the usual walking-equation range."
      : "Speed is outside the usual walking-equation range; use the exercise-test protocol or reported METs when available.";
  return {
    label: "Estimated walking METs",
    value: mets.toFixed(1),
    interpretation: `${speedNote} This is an estimate, not a substitute for METs reported by an exercise test.`,
    reference: "ACSM walking metabolic equation",
  };
}

const result = (
  label: string,
  value: string,
  interpretation: string,
  reference: string,
): CalcResult => ({ label, value, interpretation, reference });
function calcBsa(v: Record<string, string>) {
  return result(
    "Body surface area",
    `${mostellerBsa(number(v, "height_cm"), number(v, "weight_kg")).toFixed(2)} m²`,
    "Body-size estimate; use only where the applicable protocol calls for BSA.",
    "Mosteller: √((height cm × weight kg) ÷ 3600)",
  );
}
function calcIbw(v: Record<string, string>) {
  return result(
    "Ideal body weight",
    `${devineIdealBodyWeight(number(v, "height_cm"), v.sex as Sex).toFixed(1)} kg`,
    "Equation-derived dosing reference, not a target weight or fitness determination.",
    "Devine: male 50 kg / female 45.5 kg + 2.3 kg per inch over 5 ft",
  );
}
function calcAdjBw(v: Record<string, string>) {
  return result(
    "Adjusted body weight",
    `${adjustedBodyWeight(number(v, "actual_kg"), number(v, "ibw_kg")).toFixed(1)} kg`,
    "Use only when an applicable medication or protocol specifies adjusted body weight.",
    "AdjBW = IBW + 0.4 × (actual weight − IBW)",
  );
}
function calcCrCl(v: Record<string, string>) {
  return result(
    "Estimated creatinine clearance",
    `${cockcroftGault(number(v, "age"), number(v, "weight_kg"), number(v, "creatinine"), v.sex as Sex).toFixed(0)} mL/min`,
    "Adult estimate; the clinically appropriate weight and dosing decision remain protocol-specific.",
    "Cockcroft–Gault: ((140 − age) × kg) ÷ (72 × SCr); multiply by 0.85 for female sex",
  );
}
function calcMphr(v: Record<string, string>) {
  return result(
    "Maximum predicted heart rate",
    `${maximumPredictedHeartRate(number(v, "age")).toFixed(0)} bpm`,
    "Population estimate only; it is not an exercise clearance or fitness decision.",
    "MPHR = 220 − age",
  );
}
function calcTarget(v: Record<string, string>) {
  const zone = targetHeartRateZone(
    number(v, "age"),
    number(v, "low_pct"),
    number(v, "high_pct"),
  );
  return result(
    "Target heart-rate zone",
    `${zone.low.toFixed(0)}–${zone.high.toFixed(0)} bpm`,
    `${number(v, "low_pct")}%–${number(v, "high_pct")}% of age-predicted maximum; individual response may differ.`,
    "(220 − age) × selected intensity percentages",
  );
}
function calcBazett(v: Record<string, string>) {
  return result(
    "QTc (Bazett)",
    `${qtcBazett(number(v, "qt_ms"), number(v, "rr_s")).toFixed(0)} ms`,
    "Rate-corrected estimate; interpret in the ECG and clinical context.",
    "QTc = QT ÷ √RR; QT in ms, RR in seconds",
  );
}
function calcFridericia(v: Record<string, string>) {
  return result(
    "QTc (Fridericia)",
    `${qtcFridericia(number(v, "qt_ms"), number(v, "rr_s")).toFixed(0)} ms`,
    "Rate-corrected estimate; interpret in the ECG and clinical context.",
    "QTc = QT ÷ ∛RR; QT in ms, RR in seconds",
  );
}
function calcHeat(v: Record<string, string>) {
  return result(
    "Heat index",
    `${heatIndexFahrenheit(number(v, "temp_f"), number(v, "rh")).toFixed(0)} °F`,
    "Apparent temperature estimate for shaded, light-wind conditions; direct sun can increase heat stress.",
    "NOAA/NWS Rothfusz regression; valid here only for T 80–130 °F and RH 0–100%",
  );
}
function calcWind(v: Record<string, string>) {
  return result(
    "Wind chill",
    `${windChillFahrenheit(number(v, "temp_f"), number(v, "wind_mph")).toFixed(0)} °F`,
    "Apparent cold estimate for exposed skin; clothing and wetness materially affect risk.",
    "NWS formula; valid here only for T −100–50 °F and wind 3–150 mph",
  );
}

const CALCULATORS: CalcDefinition[] = [
  {
    id: "bmi",
    label: "BMI",
    description: "Adult body-mass-index screening value",
    icon: Scale,
    fields: [
      {
        key: "weight_kg",
        label: "Weight",
        unit: "kg",
        type: "number",
        min: 20,
        max: 300,
        step: 0.1,
      },
      {
        key: "height_cm",
        label: "Height",
        unit: "cm",
        type: "number",
        min: 100,
        max: 250,
        step: 0.5,
      },
    ],
    calculate: calcBMI,
  },
  {
    id: "egfr",
    label: "eGFR",
    description: "2021 CKD-EPI creatinine estimate",
    icon: Droplets,
    fields: [
      {
        key: "creatinine",
        label: "Serum creatinine",
        unit: "mg/dL",
        type: "number",
        min: 0.3,
        max: 15,
        step: 0.01,
      },
      {
        key: "age",
        label: "Age",
        unit: "years",
        type: "number",
        min: 18,
        max: 120,
        step: 1,
      },
      {
        key: "sex",
        label: "Sex used by equation",
        type: "select",
        options: sexOptions,
      },
    ],
    calculate: calcEGFR,
  },
  {
    id: "map",
    label: "Mean Arterial Pressure",
    description: "Quick SBP / DBP arithmetic estimate",
    icon: Heart,
    fields: [
      {
        key: "sbp",
        label: "Systolic BP",
        unit: "mmHg",
        type: "number",
        min: 50,
        max: 300,
        step: 1,
      },
      {
        key: "dbp",
        label: "Diastolic BP",
        unit: "mmHg",
        type: "number",
        min: 20,
        max: 200,
        step: 1,
      },
    ],
    calculate: calcMAP,
  },
  {
    id: "pack-years",
    label: "Pack-Years",
    description: "Smoking exposure history",
    icon: Cigarette,
    fields: [
      {
        key: "cigarettes_per_day",
        label: "Cigarettes per day",
        type: "number",
        min: 0,
        max: 200,
        step: 1,
      },
      {
        key: "years",
        label: "Years smoked",
        type: "number",
        min: 0,
        max: 100,
        step: 0.5,
      },
    ],
    calculate: calcPackYears,
  },
  {
    id: "walking-mets",
    label: "Walking METs",
    description: "Treadmill walking-equation estimate",
    icon: Zap,
    fields: [
      {
        key: "speed_mph",
        label: "Treadmill speed",
        unit: "mph",
        type: "number",
        min: 0.1,
        max: 8,
        step: 0.1,
      },
      {
        key: "grade_pct",
        label: "Grade / incline",
        unit: "%",
        type: "number",
        min: 0,
        max: 30,
        step: 0.5,
      },
    ],
    calculate: calcWalkingMETs,
  },
  {
    id: "bsa",
    label: "Body Surface Area",
    description: "Mosteller body surface area",
    icon: Scale,
    fields: [
      {
        key: "height_cm",
        label: "Height",
        unit: "cm",
        type: "number",
        min: 50,
        max: 275,
        step: 0.1,
      },
      {
        key: "weight_kg",
        label: "Weight",
        unit: "kg",
        type: "number",
        min: 2,
        max: 500,
        step: 0.1,
      },
    ],
    calculate: calcBsa,
  },
  {
    id: "ibw",
    label: "Ideal Body Weight",
    description: "Devine equation reference",
    icon: Scale,
    fields: [
      {
        key: "height_cm",
        label: "Height",
        unit: "cm",
        type: "number",
        min: 100,
        max: 250,
        step: 0.1,
      },
      {
        key: "sex",
        label: "Sex used by equation",
        type: "select",
        options: sexOptions,
      },
    ],
    calculate: calcIbw,
  },
  {
    id: "adjbw",
    label: "Adjusted Body Weight",
    description: "IBW-based dosing reference",
    icon: Scale,
    fields: [
      {
        key: "actual_kg",
        label: "Actual weight",
        unit: "kg",
        type: "number",
        min: 2,
        max: 500,
        step: 0.1,
      },
      {
        key: "ibw_kg",
        label: "Ideal body weight",
        unit: "kg",
        type: "number",
        min: 20,
        max: 250,
        step: 0.1,
      },
    ],
    calculate: calcAdjBw,
  },
  {
    id: "crcl",
    label: "Creatinine Clearance",
    description: "Adult Cockcroft–Gault estimate",
    icon: Droplets,
    fields: [
      {
        key: "age",
        label: "Age",
        unit: "years",
        type: "number",
        min: 18,
        max: 120,
        step: 1,
      },
      {
        key: "weight_kg",
        label: "Weight selected for equation",
        unit: "kg",
        type: "number",
        min: 20,
        max: 500,
        step: 0.1,
      },
      {
        key: "creatinine",
        label: "Serum creatinine",
        unit: "mg/dL",
        type: "number",
        min: 0.2,
        max: 20,
        step: 0.01,
      },
      {
        key: "sex",
        label: "Sex adjustment",
        type: "select",
        options: sexOptions,
      },
    ],
    calculate: calcCrCl,
  },
  {
    id: "mphr",
    label: "Maximum Predicted HR",
    description: "Age-predicted maximum",
    icon: Heart,
    fields: [
      {
        key: "age",
        label: "Age",
        unit: "years",
        type: "number",
        min: 1,
        max: 120,
        step: 1,
      },
    ],
    calculate: calcMphr,
  },
  {
    id: "target-hr",
    label: "Target Heart Rate",
    description: "User-selected intensity zone",
    icon: Activity,
    fields: [
      {
        key: "age",
        label: "Age",
        unit: "years",
        type: "number",
        min: 1,
        max: 120,
        step: 1,
      },
      {
        key: "low_pct",
        label: "Low intensity",
        unit: "%",
        type: "number",
        min: 1,
        max: 100,
        step: 1,
      },
      {
        key: "high_pct",
        label: "High intensity",
        unit: "%",
        type: "number",
        min: 1,
        max: 100,
        step: 1,
      },
    ],
    calculate: calcTarget,
  },
  {
    id: "qtc-bazett",
    label: "QTc — Bazett",
    description: "Heart-rate corrected QT",
    icon: Activity,
    fields: [
      {
        key: "qt_ms",
        label: "QT interval",
        unit: "ms",
        type: "number",
        min: 100,
        max: 1000,
        step: 1,
      },
      {
        key: "rr_s",
        label: "RR interval",
        unit: "seconds",
        type: "number",
        min: 0.3,
        max: 2,
        step: 0.01,
      },
    ],
    calculate: calcBazett,
  },
  {
    id: "qtc-fridericia",
    label: "QTc — Fridericia",
    description: "Cube-root corrected QT",
    icon: Activity,
    fields: [
      {
        key: "qt_ms",
        label: "QT interval",
        unit: "ms",
        type: "number",
        min: 100,
        max: 1000,
        step: 1,
      },
      {
        key: "rr_s",
        label: "RR interval",
        unit: "seconds",
        type: "number",
        min: 0.3,
        max: 2,
        step: 0.01,
      },
    ],
    calculate: calcFridericia,
  },
  {
    id: "heat-index",
    label: "Heat Index",
    description: "NOAA apparent heat estimate",
    icon: Zap,
    fields: [
      {
        key: "temp_f",
        label: "Air temperature",
        unit: "°F",
        type: "number",
        min: 80,
        max: 130,
        step: 0.1,
      },
      {
        key: "rh",
        label: "Relative humidity",
        unit: "%",
        type: "number",
        min: 0,
        max: 100,
        step: 1,
      },
    ],
    calculate: calcHeat,
  },
  {
    id: "wind-chill",
    label: "Wind Chill",
    description: "NWS apparent cold estimate",
    icon: Zap,
    fields: [
      {
        key: "temp_f",
        label: "Air temperature",
        unit: "°F",
        type: "number",
        min: -100,
        max: 50,
        step: 0.1,
      },
      {
        key: "wind_mph",
        label: "Wind speed",
        unit: "mph",
        type: "number",
        min: 3,
        max: 150,
        step: 0.1,
      },
    ],
    calculate: calcWind,
  },
];

const REFERENCES = [
  {
    label: "BMI — CDC adult BMI categories",
    url: "https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html",
  },
  {
    label: "eGFR — National Kidney Foundation CKD-EPI 2021 guidance",
    url: "https://www.kidney.org/recommendations-implementing-ckd-epi-2021-race-free-egfr-calculation-guidelines-clinical",
  },
  {
    label: "Current cardiovascular risk — AHA PREVENT",
    url: "https://professional.heart.org/en/guidelines-and-statements/about-prevent-calculator",
  },
];

export default function ClinicalCalculatorV3() {
  const [activeId, setActiveId] = useState("bmi");
  const [valuesByCalculator, setValuesByCalculator] = useState<
    Record<string, Record<string, string>>
  >({});
  const [result, setResult] = useState<CalcResult | null>(null);
  const [validationError, setValidationError] = useState("");
  const [showReferences, setShowReferences] = useState(false);
  const active =
    CALCULATORS.find((item) => item.id === activeId) ?? CALCULATORS[0];
  const values = valuesByCalculator[active.id] ?? {};

  const missing = useMemo(
    () =>
      active.fields
        .filter(
          (field) =>
            values[field.key] === undefined || values[field.key] === "",
        )
        .map((field) => field.label),
    [active, values],
  );

  function setValue(key: string, value: string) {
    setValuesByCalculator((current) => ({
      ...current,
      [active.id]: { ...(current[active.id] ?? {}), [key]: value },
    }));
    setResult(null);
    setValidationError("");
  }

  function calculate() {
    const invalid = active.fields.find((field) => {
      if (field.type !== "number") return false;
      const value = number(values, field.key);
      return (
        !Number.isFinite(value) ||
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max)
      );
    });
    if (invalid) {
      setResult(null);
      setValidationError(
        `${invalid.label} must be within the displayed ${invalid.unit ?? "input"} range (${invalid.min}–${invalid.max}).`,
      );
      return;
    }
    try {
      const calculated = active.calculate(values);
      setResult(calculated);
      setValidationError(
        calculated ? "" : "Enter valid values for every input.",
      );
    } catch (error) {
      setResult(null);
      setValidationError(
        error instanceof Error
          ? error.message
          : "The entered values are not valid for this equation.",
      );
    }
  }

  function clear() {
    setValuesByCalculator((current) => ({ ...current, [active.id]: {} }));
    setResult(null);
    setValidationError("");
  }

  return (
    <div className="clinical-workbench" data-testid="clinical-calculators">
      <header className="clinical-header">
        <div>
          <div className="clinical-kicker">CLINICAL / CALCULATORS</div>
          <h1>Clinical Calculators</h1>
          <p>
            Transparent quick calculations only. Current cardiovascular risk
            assessment is routed to the official AHA PREVENT calculator rather
            than reimplemented here.
          </p>
        </div>
        <a
          href="https://professional.heart.org/en/guidelines-and-statements/about-prevent-calculator"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: ".45rem",
            padding: ".55rem .7rem",
            border: "1px solid rgba(180,215,208,.2)",
            borderRadius: 8,
            color: "#b4d7d0",
            textDecoration: "none",
            fontSize: ".72rem",
            fontWeight: 700,
          }}
        >
          <Heart size={14} /> AHA PREVENT <ExternalLink size={11} />
        </a>
      </header>

      <div className="clinical-layout">
        <aside className="clinical-nav liquid-glass">
          <div className="clinical-nav-label">CALCULATORS</div>
          {CALCULATORS.map((calculator) => {
            const Icon = calculator.icon;
            const selected = calculator.id === active.id;
            return (
              <button
                key={calculator.id}
                className={selected ? "active" : ""}
                onClick={() => {
                  setActiveId(calculator.id);
                  setResult(null);
                  setValidationError("");
                }}
              >
                <Icon size={15} />
                <span>
                  <strong>{calculator.label}</strong>
                  <small>{calculator.description}</small>
                </span>
              </button>
            );
          })}
        </aside>

        <main
          className="clinical-panel"
          onKeyDown={(event) => {
            if (event.key === "Enter" && missing.length === 0) calculate();
          }}
        >
          <div className="clinical-panel-head">
            <div>
              <span>ACTIVE CALCULATION</span>
              <h2>{active.label}</h2>
              <p>{active.description}</p>
            </div>
            <div className="clinical-required">
              {active.fields.length} inputs
            </div>
          </div>

          <div className="clinical-fields">
            {active.fields.map((field) => (
              <label key={field.key} className="clinical-field">
                <span>
                  {field.label}
                  {field.unit ? <small>{field.unit}</small> : null}
                </span>
                {field.type === "select" ? (
                  <select
                    value={values[field.key] ?? ""}
                    onChange={(event) =>
                      setValue(field.key, event.target.value)
                    }
                  >
                    <option value="">Select…</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={values[field.key] ?? ""}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onChange={(event) =>
                      setValue(field.key, event.target.value)
                    }
                    placeholder="Enter value"
                  />
                )}
              </label>
            ))}
          </div>

          <div className="clinical-actions">
            <button
              className="primary"
              disabled={missing.length > 0}
              onClick={calculate}
            >
              <Calculator size={14} /> Calculate
            </button>
            <button onClick={clear}>
              <RefreshCw size={14} /> Clear
            </button>
            {missing.length > 0 && <span>Needs: {missing.join(" · ")}</span>}
          </div>

          {validationError && (
            <div className="clinical-validation" role="alert">
              <AlertTriangle size={13} />
              {validationError}
            </div>
          )}

          {result && (
            <section className="clinical-result">
              <div>
                <span>{result.label}</span>
                <strong>{result.value}</strong>
                <p>{result.interpretation}</p>
              </div>
              <div className="clinical-result-reference">
                <Info size={13} />
                <span>{result.reference}</span>
              </div>
            </section>
          )}

          <div className="clinical-disclaimer">
            <AlertTriangle size={13} />
            <span>
              Decision-support calculation only. Apply the current controlling
              medical or program standard separately; this tool does not produce
              clearance.
            </span>
          </div>

          <section className="clinical-reference">
            <button onClick={() => setShowReferences((value) => !value)}>
              <Info size={13} /> Current source links{" "}
              {showReferences ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </button>
            {showReferences && (
              <div>
                {REFERENCES.map((reference) => (
                  <p key={reference.label}>
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#b4d7d0", textDecoration: "none" }}
                    >
                      {reference.label} <ExternalLink size={9} />
                    </a>
                  </p>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
