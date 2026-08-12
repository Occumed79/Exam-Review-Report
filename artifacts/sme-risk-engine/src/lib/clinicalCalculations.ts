export type Sex = "male" | "female";
export type Range = { low: number; high: number };

function finite(value: number, name: string, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max)
    throw new Error(`${name} must be between ${min} and ${max}.`);
}

export function mostellerBsa(heightCm: number, weightKg: number) {
  finite(heightCm, "Height (cm)", 50, 275);
  finite(weightKg, "Weight (kg)", 2, 500);
  return Math.sqrt((heightCm * weightKg) / 3600);
}
export function devineIdealBodyWeight(heightCm: number, sex: Sex) {
  finite(heightCm, "Height (cm)", 100, 250);
  const inchesOverFiveFeet = Math.max(0, heightCm / 2.54 - 60);
  return (sex === "male" ? 50 : 45.5) + 2.3 * inchesOverFiveFeet;
}
export function adjustedBodyWeight(actualKg: number, ibwKg: number) {
  finite(actualKg, "Actual weight (kg)", 2, 500);
  finite(ibwKg, "IBW (kg)", 20, 250);
  if (actualKg < ibwKg)
    throw new Error(
      "Actual weight must be at least the entered IBW for this adjusted-weight equation.",
    );
  return ibwKg + 0.4 * (actualKg - ibwKg);
}
export function cockcroftGault(
  age: number,
  weightKg: number,
  creatinineMgDl: number,
  sex: Sex,
) {
  finite(age, "Age (years)", 18, 120);
  finite(weightKg, "Weight (kg)", 20, 500);
  finite(creatinineMgDl, "Serum creatinine (mg/dL)", 0.2, 20);
  return (
    (((140 - age) * weightKg) / (72 * creatinineMgDl)) *
    (sex === "female" ? 0.85 : 1)
  );
}
export function maximumPredictedHeartRate(age: number) {
  finite(age, "Age (years)", 1, 120);
  return 220 - age;
}
export function targetHeartRateZone(
  age: number,
  lowPercent: number,
  highPercent: number,
): Range {
  const max = maximumPredictedHeartRate(age);
  finite(lowPercent, "Low intensity (%)", 1, 100);
  finite(highPercent, "High intensity (%)", 1, 100);
  if (lowPercent >= highPercent)
    throw new Error("Low intensity must be less than high intensity.");
  return { low: (max * lowPercent) / 100, high: (max * highPercent) / 100 };
}
function qtcInputs(qtMs: number, rrSeconds: number) {
  finite(qtMs, "QT interval (ms)", 100, 1000);
  finite(rrSeconds, "RR interval (seconds)", 0.3, 2);
}
export function qtcBazett(qtMs: number, rrSeconds: number) {
  qtcInputs(qtMs, rrSeconds);
  return qtMs / Math.sqrt(rrSeconds);
}
export function qtcFridericia(qtMs: number, rrSeconds: number) {
  qtcInputs(qtMs, rrSeconds);
  return qtMs / Math.cbrt(rrSeconds);
}
export function heatIndexFahrenheit(tempF: number, relativeHumidity: number) {
  finite(tempF, "Temperature (°F)", 80, 130);
  finite(relativeHumidity, "Relative humidity (%)", 40, 100);
  const t = tempF,
    r = relativeHumidity;
  return (
    -42.379 +
    2.04901523 * t +
    10.14333127 * r -
    0.22475541 * t * r -
    0.00683783 * t * t -
    0.05481717 * r * r +
    0.00122874 * t * t * r +
    0.00085282 * t * r * r -
    0.00000199 * t * t * r * r
  );
}
export function windChillFahrenheit(tempF: number, windMph: number) {
  finite(tempF, "Temperature (°F)", -100, 50);
  finite(windMph, "Wind speed (mph)", 3, 150);
  return (
    35.74 +
    0.6215 * tempF -
    35.75 * Math.pow(windMph, 0.16) +
    0.4275 * tempF * Math.pow(windMph, 0.16)
  );
}
