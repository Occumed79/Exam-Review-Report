import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Calculator,
  ChevronDown,
  ChevronRight,
  Droplets,
  Heart,
  Info,
  RefreshCw,
  Scale,
  Zap,
} from 'lucide-react';
import './clinical-calculator.css';

type CalcField = {
  key: string;
  label: string;
  unit?: string;
  type: 'number' | 'select';
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

const yesNo = [
  { label: 'No', value: '0' },
  { label: 'Yes', value: '1' },
];

const sexOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

function number(values: Record<string, string>, key: string): number {
  return Number.parseFloat(values[key] || '');
}

function calcBMI(values: Record<string, string>): CalcResult | null {
  const weight = number(values, 'weight_kg');
  const heightM = number(values, 'height_cm') / 100;
  if (!weight || !heightM) return null;
  const bmi = weight / (heightM * heightM);
  const interpretation = bmi < 18.5
    ? 'Underweight'
    : bmi < 25
      ? 'Normal weight'
      : bmi < 30
        ? 'Overweight'
        : bmi < 35
          ? 'Obese Class I'
          : bmi < 40
            ? 'Obese Class II'
            : 'Obese Class III';
  return { label: 'BMI', value: bmi.toFixed(1), interpretation, reference: 'WHO BMI classification' };
}

function calcEGFR(values: Record<string, string>): CalcResult | null {
  const creatinine = number(values, 'creatinine');
  const age = number(values, 'age');
  if (!creatinine || !age) return null;
  const female = values.sex === 'female';
  const kappa = female ? 0.7 : 0.9;
  const alpha = female ? -0.241 : -0.302;
  const sexMultiplier = female ? 1.012 : 1;
  const ratio = creatinine / kappa;
  const egfr = 142
    * Math.pow(Math.min(ratio, 1), alpha)
    * Math.pow(Math.max(ratio, 1), -1.2)
    * Math.pow(0.9938, age)
    * sexMultiplier;
  const interpretation = egfr >= 90
    ? 'G1 — Normal or high'
    : egfr >= 60
      ? 'G2 — Mildly decreased'
      : egfr >= 45
        ? 'G3a — Mildly to moderately decreased'
        : egfr >= 30
          ? 'G3b — Moderately to severely decreased'
          : egfr >= 15
            ? 'G4 — Severely decreased'
            : 'G5 — Kidney failure range';
  return {
    label: 'eGFR',
    value: `${egfr.toFixed(0)} mL/min/1.73m²`,
    interpretation,
    reference: 'CKD-EPI 2021 creatinine equation',
  };
}

function calcASCVD(values: Record<string, string>): CalcResult | null {
  const age = number(values, 'age');
  const totalChol = number(values, 'total_chol');
  const hdl = number(values, 'hdl');
  const sbp = number(values, 'sbp');
  if (!age || !totalChol || !hdl || !sbp || !values.sex || !values.race) return null;

  const treated = Number(values.bp_treated || '0');
  const diabetes = Number(values.diabetes || '0');
  const smoker = Number(values.smoker || '0');
  const lnAge = Math.log(age);
  const lnTc = Math.log(totalChol);
  const lnHdl = Math.log(hdl);
  const lnSbp = Math.log(sbp);
  let coefficient: number;
  let baseline: number;
  let mean: number;

  if (values.sex === 'male' && values.race === 'aa') {
    coefficient = 2.469 * lnAge + 0.302 * lnTc - 0.307 * lnHdl
      + (treated ? 1.916 * lnSbp : 1.809 * lnSbp)
      + 0.549 * smoker + 0.645 * diabetes;
    baseline = 0.8954;
    mean = 19.54;
  } else if (values.sex === 'female' && values.race === 'aa') {
    coefficient = 17.1141 * lnAge + 0.9396 * lnTc - 18.9196 * lnHdl
      + 4.4748 * Math.log(Math.log(age)) * lnHdl
      + 29.2907 * Math.log(Math.log(age)) * Math.log(sbp) * (treated ? 1 : 0)
      - 6.4321 * Math.log(Math.log(age)) * Math.log(sbp) * (treated ? 0 : 1)
      + 0.8738 * smoker - 0.8738 * Math.log(age) * smoker + 0.8647 * diabetes;
    baseline = 0.9533;
    mean = 86.61;
  } else if (values.sex === 'female') {
    coefficient = -29.799 * lnAge + 4.884 * lnAge * lnAge
      + 13.54 * lnTc - 3.114 * lnAge * lnTc
      - 13.578 * lnHdl + 3.149 * lnAge * lnHdl
      + (treated ? 2.019 * lnSbp : -2.996 * lnSbp)
      + 7.574 * smoker - 1.665 * lnAge * smoker + 0.661 * diabetes;
    baseline = 0.9665;
    mean = -29.18;
  } else {
    coefficient = 12.344 * lnAge + 11.853 * lnTc - 2.664 * lnAge * lnTc
      - 7.99 * lnHdl + 1.769 * lnAge * lnHdl
      + (treated ? 1.797 * lnSbp : 1.764 * lnSbp)
      + 7.837 * smoker - 1.795 * lnAge * smoker + 0.658 * diabetes;
    baseline = 0.9144;
    mean = 61.18;
  }

  const rawRisk = (1 - Math.pow(baseline, Math.exp(coefficient - mean))) * 100;
  const risk = Math.min(Math.max(rawRisk, 0), 100);
  const interpretation = risk < 5
    ? 'Low risk (<5%)'
    : risk < 7.5
      ? 'Borderline risk (5–7.5%)'
      : risk < 20
        ? 'Intermediate risk (7.5–20%)'
        : 'High risk (≥20%)';
  return {
    label: '10-year ASCVD risk',
    value: `${risk.toFixed(1)}%`,
    interpretation,
    reference: 'ACC/AHA Pooled Cohort Equations',
  };
}

function calcFramingham(values: Record<string, string>): CalcResult | null {
  const age = number(values, 'age');
  const totalChol = number(values, 'total_chol');
  const hdl = number(values, 'hdl');
  const sbp = number(values, 'sbp');
  if (!age || !totalChol || !hdl || !sbp || !values.sex) return null;
  const smoker = Number(values.smoker || '0');
  const diabetes = Number(values.diabetes || '0');
  let points = 0;

  if (values.sex === 'male') {
    points += age < 35 ? -9 : age < 40 ? -4 : age < 45 ? 0 : age < 50 ? 3 : age < 55 ? 6 : age < 60 ? 8 : age < 65 ? 10 : age < 70 ? 11 : 12;
    points += totalChol < 160 ? 0 : totalChol < 200 ? 4 : totalChol < 240 ? 7 : totalChol < 280 ? 9 : 11;
    points += hdl >= 60 ? -2 : hdl >= 50 ? 0 : hdl >= 45 ? 1 : 2;
    points += sbp < 120 ? 0 : sbp < 130 ? 1 : sbp < 140 ? 2 : sbp < 160 ? 2 : 3;
    if (smoker) points += 4;
    if (diabetes) points += 3;
  } else {
    points += age < 35 ? -7 : age < 40 ? -3 : age < 45 ? 0 : age < 50 ? 3 : age < 55 ? 6 : age < 60 ? 8 : age < 65 ? 10 : age < 70 ? 12 : 14;
    points += totalChol < 160 ? 0 : totalChol < 200 ? 4 : totalChol < 240 ? 8 : totalChol < 280 ? 11 : 13;
    points += hdl >= 60 ? -2 : hdl >= 50 ? 0 : hdl >= 45 ? 1 : hdl >= 35 ? 2 : 3;
    points += sbp < 120 ? -3 : sbp < 130 ? 0 : sbp < 140 ? 1 : sbp < 150 ? 2 : sbp < 160 ? 4 : 5;
    if (smoker) points += 3;
    if (diabetes) points += 4;
  }

  const tables: Record<string, number[]> = {
    male: [1, 1, 1, 2, 2, 2, 3, 4, 4, 5, 6, 8, 10, 12, 16, 20, 25],
    female: [1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 6, 8, 9, 11, 14, 17, 22],
  };
  const table = tables[values.sex];
  const index = Math.max(0, Math.min(points + 1, table.length - 1));
  const risk = table[index];
  return {
    label: '10-year Framingham CHD risk',
    value: `${risk}%`,
    interpretation: risk < 10 ? 'Low risk (<10%)' : risk < 20 ? 'Moderate risk (10–20%)' : 'High risk (≥20%)',
    reference: 'Framingham Heart Study risk-factor score',
  };
}

function calcMETs(values: Record<string, string>): CalcResult | null {
  const distance = number(values, 'distance_m');
  const time = number(values, 'time_min');
  const grade = number(values, 'grade_pct') || 0;
  if (!distance || !time) return null;
  const speedMetersPerMinute = distance / time;
  const vo2 = (0.1 * speedMetersPerMinute) + (1.8 * speedMetersPerMinute * (grade / 100)) + 3.5;
  const mets = vo2 / 3.5;
  return {
    label: 'Estimated METs',
    value: mets.toFixed(1),
    interpretation: mets < 4
      ? 'Poor functional capacity (<4 METs)'
      : mets < 7
        ? 'Moderate functional capacity (4–7 METs)'
        : mets < 10
          ? 'Good functional capacity (7–10 METs)'
          : 'Excellent functional capacity (>10 METs)',
    reference: 'ACSM metabolic equation',
  };
}

const CALCULATORS: CalcDefinition[] = [
  {
    id: 'ascvd',
    label: 'ASCVD 10-yr Risk',
    description: 'Pooled Cohort Equation inputs',
    icon: Heart,
    fields: [
      { key: 'age', label: 'Age', unit: 'years', type: 'number', min: 40, max: 79, step: 1 },
      { key: 'sex', label: 'Sex', type: 'select', options: sexOptions },
      { key: 'race', label: 'Equation group', type: 'select', options: [{ label: 'White / Other', value: 'white' }, { label: 'African American', value: 'aa' }] },
      { key: 'total_chol', label: 'Total cholesterol', unit: 'mg/dL', type: 'number', min: 100, max: 400, step: 1 },
      { key: 'hdl', label: 'HDL-C', unit: 'mg/dL', type: 'number', min: 20, max: 150, step: 1 },
      { key: 'sbp', label: 'Systolic BP', unit: 'mmHg', type: 'number', min: 90, max: 220, step: 1 },
      { key: 'bp_treated', label: 'BP treatment', type: 'select', options: yesNo },
      { key: 'diabetes', label: 'Diabetes', type: 'select', options: yesNo },
      { key: 'smoker', label: 'Current smoker', type: 'select', options: yesNo },
    ],
    calculate: calcASCVD,
  },
  {
    id: 'bmi',
    label: 'BMI',
    description: 'Weight / height²',
    icon: Scale,
    fields: [
      { key: 'weight_kg', label: 'Weight', unit: 'kg', type: 'number', min: 20, max: 300, step: 0.1 },
      { key: 'height_cm', label: 'Height', unit: 'cm', type: 'number', min: 100, max: 250, step: 0.5 },
    ],
    calculate: calcBMI,
  },
  {
    id: 'egfr',
    label: 'eGFR',
    description: 'CKD-EPI creatinine estimate',
    icon: Droplets,
    fields: [
      { key: 'creatinine', label: 'Serum creatinine', unit: 'mg/dL', type: 'number', min: 0.3, max: 15, step: 0.01 },
      { key: 'age', label: 'Age', unit: 'years', type: 'number', min: 18, max: 100, step: 1 },
      { key: 'sex', label: 'Sex', type: 'select', options: sexOptions },
    ],
    calculate: calcEGFR,
  },
  {
    id: 'framingham',
    label: 'Framingham',
    description: '10-year CHD risk-factor score',
    icon: Activity,
    fields: [
      { key: 'age', label: 'Age', unit: 'years', type: 'number', min: 30, max: 74, step: 1 },
      { key: 'sex', label: 'Sex', type: 'select', options: sexOptions },
      { key: 'total_chol', label: 'Total cholesterol', unit: 'mg/dL', type: 'number', min: 100, max: 400, step: 1 },
      { key: 'hdl', label: 'HDL-C', unit: 'mg/dL', type: 'number', min: 20, max: 150, step: 1 },
      { key: 'sbp', label: 'Systolic BP', unit: 'mmHg', type: 'number', min: 90, max: 220, step: 1 },
      { key: 'smoker', label: 'Current smoker', type: 'select', options: yesNo },
      { key: 'diabetes', label: 'Diabetes', type: 'select', options: yesNo },
    ],
    calculate: calcFramingham,
  },
  {
    id: 'mets',
    label: 'METs Estimate',
    description: 'Exercise metabolic-equivalent estimate',
    icon: Zap,
    fields: [
      { key: 'distance_m', label: 'Distance', unit: 'meters', type: 'number', min: 1, max: 10000, step: 10 },
      { key: 'time_min', label: 'Time', unit: 'minutes', type: 'number', min: 1, max: 60, step: 0.5 },
      { key: 'grade_pct', label: 'Grade / incline', unit: '%', type: 'number', min: 0, max: 30, step: 0.5 },
    ],
    calculate: calcMETs,
  },
];

const REFERENCES = [
  'ASCVD — ACC/AHA Pooled Cohort Equations',
  'BMI — WHO classification',
  'eGFR — CKD-EPI 2021 creatinine equation',
  'Framingham — Framingham Heart Study risk-factor score',
  'METs — ACSM metabolic equation',
];

export default function ClinicalCalculatorV2() {
  const [activeId, setActiveId] = useState('ascvd');
  const [valuesByCalculator, setValuesByCalculator] = useState<Record<string, Record<string, string>>>({});
  const [result, setResult] = useState<CalcResult | null>(null);
  const [showReferences, setShowReferences] = useState(false);
  const active = CALCULATORS.find((item) => item.id === activeId) ?? CALCULATORS[0];
  const values = valuesByCalculator[active.id] ?? {};

  const missing = useMemo(() => active.fields.filter((field) => !values[field.key]).map((field) => field.label), [active, values]);

  function setValue(key: string, value: string) {
    setValuesByCalculator((current) => ({
      ...current,
      [active.id]: { ...(current[active.id] ?? {}), [key]: value },
    }));
    setResult(null);
  }

  function calculate() {
    setResult(active.calculate(values));
  }

  function clear() {
    setValuesByCalculator((current) => ({ ...current, [active.id]: {} }));
    setResult(null);
  }

  return (
    <div className="clinical-workbench" data-testid="clinical-calculators">
      <header className="clinical-header">
        <div>
          <div className="clinical-kicker">CLINICAL / CALCULATORS</div>
          <h1>Clinical Calculators</h1>
          <p>Select the calculation, enter only the required values, and get the estimate immediately. No case record or document upload.</p>
        </div>
        <div className="clinical-scope"><Calculator size={15} /><span>5 focused calculators</span></div>
      </header>

      <div className="clinical-layout">
        <aside className="clinical-nav">
          <div className="clinical-nav-label">CALCULATORS</div>
          {CALCULATORS.map((calculator) => {
            const Icon = calculator.icon;
            const selected = calculator.id === active.id;
            return (
              <button key={calculator.id} className={selected ? 'active' : ''} onClick={() => { setActiveId(calculator.id); setResult(null); }}>
                <Icon size={15} />
                <span><strong>{calculator.label}</strong><small>{calculator.description}</small></span>
              </button>
            );
          })}
        </aside>

        <main className="clinical-panel" onKeyDown={(event) => { if (event.key === 'Enter' && missing.length === 0) calculate(); }}>
          <div className="clinical-panel-head">
            <div>
              <span>ACTIVE CALCULATION</span>
              <h2>{active.label}</h2>
              <p>{active.description}</p>
            </div>
            <div className="clinical-required">{active.fields.length} inputs</div>
          </div>

          <div className="clinical-fields">
            {active.fields.map((field) => (
              <label key={field.key} className="clinical-field">
                <span>{field.label}{field.unit ? <small>{field.unit}</small> : null}</span>
                {field.type === 'select' ? (
                  <select value={values[field.key] ?? ''} onChange={(event) => setValue(field.key, event.target.value)}>
                    <option value="">Select…</option>
                    {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={values[field.key] ?? ''}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onChange={(event) => setValue(field.key, event.target.value)}
                    placeholder="Enter value"
                  />
                )}
              </label>
            ))}
          </div>

          <div className="clinical-actions">
            <button className="primary" disabled={missing.length > 0} onClick={calculate}><Calculator size={14} /> Calculate</button>
            <button onClick={clear}><RefreshCw size={14} /> Clear</button>
            {missing.length > 0 && <span>Needs: {missing.join(' · ')}</span>}
          </div>

          {result && (
            <section className="clinical-result">
              <div>
                <span>{result.label}</span>
                <strong>{result.value}</strong>
                <p>{result.interpretation}</p>
              </div>
              <div className="clinical-result-reference"><Info size={13} /><span>{result.reference}</span></div>
            </section>
          )}

          <div className="clinical-disclaimer"><AlertTriangle size={13} /><span>Decision-support estimate only. Confirm the method and applicability before relying on the result for a medical or fitness determination.</span></div>

          <section className="clinical-reference">
            <button onClick={() => setShowReferences((value) => !value)}><Info size={13} /> Method references {showReferences ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</button>
            {showReferences && <div>{REFERENCES.map((reference) => <p key={reference}>{reference}</p>)}</div>}
          </section>
        </main>
      </div>
    </div>
  );
}
