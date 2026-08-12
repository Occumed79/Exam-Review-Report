import assert from "node:assert/strict";
import test from "node:test";
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
} from "./clinicalCalculations";
const close = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} != ${expected}`,
  );
test("Mosteller BSA", () => close(mostellerBsa(180, 80), 2));
test("Devine IBW", () => close(devineIdealBodyWeight(177.8, "male"), 73));
test("adjusted body weight", () => close(adjustedBodyWeight(100, 60), 76));
test("Cockcroft-Gault and female adjustment", () => {
  close(cockcroftGault(65, 70, 1, "male"), 72.9167);
  close(cockcroftGault(65, 70, 1, "female"), 61.9792);
});
test("maximum predicted heart rate", () =>
  assert.equal(maximumPredictedHeartRate(40), 180));
test("target heart-rate range", () =>
  assert.deepEqual(targetHeartRateZone(40, 50, 70), { low: 90, high: 126 }));
test("Bazett QTc", () => close(qtcBazett(400, 0.8), 447.2136));
test("Fridericia QTc", () => close(qtcFridericia(400, 0.8), 430.8869));
test("NOAA Rothfusz heat index", () =>
  close(heatIndexFahrenheit(90, 70), 105.922, 0.02));
test("NOAA heat-index low-humidity adjustment", () =>
  close(heatIndexFahrenheit(100, 10), 94.123, 0.02));
test("NWS wind chill", () => close(windChillFahrenheit(30, 10), 21.248, 0.02));
test("equation domains are enforced", () => {
  assert.throws(() => heatIndexFahrenheit(70, 70));
  assert.throws(() => windChillFahrenheit(60, 10));
  assert.throws(() => targetHeartRateZone(40, 80, 60));
});
