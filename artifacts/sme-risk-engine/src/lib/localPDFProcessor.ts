/**
 * Local-First Document Processing Engine
 *
 * The ingestion path never uploads the original file. Text extraction, OCR, PHI
 * detection, redaction, and first-pass structured parsing all happen in the
 * browser before any downstream AI or case workflow can receive content.
 */

import { createWorker } from "tesseract.js";
import { redactPHI, validateRedaction } from "./phiRedaction";

export type ClinicalDataCategory =
  | "examinee_name"
  | "dob"
  | "sex"
  | "employer"
  | "job_title"
  | "case_id"
  | "agency_standard"
  | "deployment_country"
  | "medical_condition"
  | "lab_value"
  | "medication"
  | "job_duty"
  | "injury"
  | "documentation_gap"
  | "recommendation"
  | "exam_date";

export interface ClinicalDataPoint {
  category: ClinicalDataCategory;
  value: string;
  confidence: number;
  sourceSnippet?: string;
}

export interface LocalProcessingResult {
  originalText: string;
  redactedText: string;
  scrubbedText: string;
  detectedPHI: {
    type: string;
    value: string;
    position: number;
  }[];
  clinicalDataPoints: ClinicalDataPoint[];
  readyForAIAnalysis: boolean;
  sourceFileName: string;
  extractionMethod: "pdf-text" | "image-ocr" | "plain-text" | "fallback";
  redactionConfidence: number;
  warning?: string;
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function decodePdfEscapes(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\b/g, " ")
    .replace(/\\f/g, " ")
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
}

function extractPdfStringsFromChunk(chunk: string): string[] {
  const strings: string[] = [];
  const literalPattern = /\((?:\\.|[^\\()])*\)\s*(?:Tj|'|"|\]|TJ)?/g;
  let literalMatch: RegExpExecArray | null;
  while ((literalMatch = literalPattern.exec(chunk)) !== null) {
    const raw = literalMatch[0].replace(/\)\s*(?:Tj|'|"|\]|TJ)?$/, ")");
    const value = raw.slice(1, -1);
    const decoded = decodePdfEscapes(value);
    if (/[A-Za-z0-9]/.test(decoded)) strings.push(decoded);
  }

  const hexPattern = /<([0-9A-Fa-f\s]{6,})>\s*(?:Tj|'|"|\]|TJ)?/g;
  let hexMatch: RegExpExecArray | null;
  while ((hexMatch = hexPattern.exec(chunk)) !== null) {
    const hex = hexMatch[1].replace(/\s+/g, "");
    if (hex.length % 2 !== 0) continue;
    let decoded = "";
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.slice(i, i + 2), 16);
      if (code >= 9 && code <= 126) decoded += String.fromCharCode(code);
    }
    if (/[A-Za-z0-9]/.test(decoded)) strings.push(decoded);
  }

  return strings;
}

async function inflatePdfStream(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === "undefined") return "";

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  const inflated = await new Response(stream).arrayBuffer();
  return new TextDecoder("latin1").decode(inflated);
}

async function extractTextFromPdfArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer);
  const latin = new TextDecoder("latin1").decode(bytes);
  const chunks: string[] = [latin];

  const streamPattern = /<<(?:.|\n|\r){0,1200}?>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamPattern.exec(latin)) !== null) {
    const dictionaryStart = Math.max(0, match.index - 1200);
    const dictionary = latin.slice(dictionaryStart, match.index + 1200);
    if (!/FlateDecode/i.test(dictionary)) continue;

    const streamStart = match.index + match[0].indexOf(match[1]);
    const streamEnd = streamStart + match[1].length;
    try {
      const inflated = await inflatePdfStream(bytes.slice(streamStart, streamEnd));
      if (inflated) chunks.push(inflated);
    } catch {
      // Some PDFs use PNG/TIFF predictors or non-deflate filters. The raw string
      // extraction fallback below still captures text from uncompressed streams.
    }
  }

  const extracted = chunks.flatMap(extractPdfStringsFromChunk).join("\n");
  const cleaned = normalizeWhitespace(extracted);
  if (cleaned.length > 20) return cleaned;

  const fallback = normalizeWhitespace(
    latin
      .replace(/[^\x09\x0a\x0d\x20-\x7e]+/g, " ")
      .replace(/\b(obj|endobj|xref|trailer|stream|endstream|Length|Filter|FlateDecode)\b/g, " ")
  );

  return fallback.length > 20 ? fallback : "";
}

/** Extract text from a document using browser-local parsing only. */
export async function extractPDFLocally(file: File): Promise<{ text: string; method: LocalProcessingResult["extractionMethod"]; warning?: string }> {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (mimeType.startsWith("image/") || /\.(png|jpe?g|tiff?|bmp|webp)$/.test(fileName)) {
    const worker = await createWorker("eng");
    try {
      const result = await worker.recognize(file);
      return { text: normalizeWhitespace(result.data.text), method: "image-ocr" };
    } finally {
      await worker.terminate();
    }
  }

  if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) {
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromPdfArrayBuffer(arrayBuffer);
    return {
      text,
      method: "pdf-text",
      warning: text ? undefined : "No text layer was found. Scanned PDFs should be converted to images or OCR-enabled before upload.",
    };
  }

  if (mimeType.startsWith("text/") || /\.(txt|csv|md)$/.test(fileName)) {
    return { text: normalizeWhitespace(await file.text()), method: "plain-text" };
  }

  return { text: normalizeWhitespace(await file.text()), method: "fallback" };
}

function addUnique(points: ClinicalDataPoint[], category: ClinicalDataCategory, value: string, confidence: number, sourceSnippet?: string) {
  const cleaned = normalizeWhitespace(value).replace(/^[:\-\s]+/, "").replace(/[.;,\s]+$/, "");
  if (!cleaned || cleaned.length < 2) return;
  const exists = points.some(p => p.category === category && p.value.toLowerCase() === cleaned.toLowerCase());
  if (!exists) points.push({ category, value: cleaned.slice(0, 240), confidence, sourceSnippet });
}

function captureField(points: ClinicalDataPoint[], text: string, category: ClinicalDataCategory, patterns: RegExp[], confidence: number) {
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      addUnique(points, category, match[1] || match[0], confidence, match[0]);
    }
  }
}

/** Extract first-pass clinical and occupational data from the redacted text. */
export function extractClinicalDataLocally(text: string): ClinicalDataPoint[] {
  const dataPoints: ClinicalDataPoint[] = [];

  captureField(dataPoints, text, "examinee_name", [/(?:Patient|Examinee|Employee|Candidate|Name)\s*[:\-]\s*([^\n]{2,80})/gi], 0.72);
  captureField(dataPoints, text, "dob", [/(?:DOB|Date of Birth|Birth Date)\s*[:\-]\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/gi], 0.85);
  captureField(dataPoints, text, "sex", [/(?:Sex|Gender)\s*[:\-]\s*(Male|Female|Non-binary|Other|M|F)\b/gi], 0.78);
  captureField(dataPoints, text, "employer", [/(?:Employer|Company|Agency)\s*[:\-]\s*([^\n]{2,90})/gi], 0.72);
  captureField(dataPoints, text, "job_title", [/(?:Job Title|Position|Occupation|Role)\s*[:\-]\s*([^\n]{2,90})/gi], 0.8);
  captureField(dataPoints, text, "case_id", [/(?:Case ID|Case Number|Claim Number|File Number)\s*[:\-]\s*([A-Z0-9\-_.]{3,40})/gi], 0.88);
  captureField(dataPoints, text, "agency_standard", [/(?:Standard|Applicable Standard|Guideline|Regulation)\s*[:\-]\s*([^\n]{2,120})/gi, /\b(NFPA\s*1582|DOT\/?FMCSA|FAA|OSHA|NIOSH|MOD\s*17|POST)\b/gi], 0.82);
  captureField(dataPoints, text, "deployment_country", [/(?:Deployment Country|Country|Location|AOR)\s*[:\-]\s*([^\n]{2,80})/gi], 0.68);
  captureField(dataPoints, text, "exam_date", [/(?:Exam Date|Date of Exam|Evaluation Date)\s*[:\-]\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/gi], 0.82);

  const conditionNames = "Hypertension|Diabetes|Asthma|COPD|Coronary artery disease|Heart disease|Seizure|Epilepsy|Sleep apnea|Depression|Anxiety|PTSD|Arthritis|Back pain|Migraine|Kidney disease|Cancer|Obesity";
  captureField(dataPoints, text, "medical_condition", [new RegExp(`\\b(${conditionNames})\\b`, "gi"), /(?:diagnosed with|history of|assessment\s*[:\-]|condition\s*[:\-])\s*([^\n.;]{3,90})/gi], 0.84);
  captureField(dataPoints, text, "lab_value", [/(?:A1C|HbA1c|Hemoglobin A1c)\s*[:=]?\s*([0-9.]+\s*%?)/gi, /(?:Blood Pressure|BP)\s*[:=]?\s*(\d{2,3}\s*\/\s*\d{2,3})/gi, /(?:Glucose|Creatinine|eGFR|LDL|HDL|Triglycerides)\s*[:=]?\s*([0-9.]+\s*(?:mg\/dL|mL\/min|%)?)/gi], 0.9);
  captureField(dataPoints, text, "medication", [/(?:Medication|Medications|Taking|Prescribed)\s*[:\-]?\s*([^\n.;]{3,140})/gi, /\b(Metformin|Lisinopril|Atorvastatin|Aspirin|Insulin|Albuterol|Warfarin|Eliquis|Ozempic|Semaglutide|CPAP)\b/gi], 0.8);
  captureField(dataPoints, text, "job_duty", [/(?:Essential Functions|Job Duties|Physical Demands|Responsibilities)\s*[:\-]\s*([^\n]{3,180})/gi, /\b(lifting|carrying|standing|walking|climbing|driving|confined space|respirator|firefighting|law enforcement|flight duty|weapon handling)\b/gi], 0.76);
  captureField(dataPoints, text, "injury", [/(?:Injury|Surgery|Fracture|Sprain|Strain)\s*[:\-]?\s*([^\n.;]{3,120})/gi], 0.74);
  captureField(dataPoints, text, "documentation_gap", [/(?:missing|needs?|requires?|obtain)\s+([^\n.;]{3,140}(?:record|records|clearance|test|documentation|note|results))/gi], 0.72);
  captureField(dataPoints, text, "recommendation", [/(?:Recommendation|Disposition|Assessment Plan)\s*[:\-]\s*([^\n]{3,180})/gi], 0.7);

  return dataPoints;
}

export function createScrubbedText(redactedText: string, clinicalDataPoints: ClinicalDataPoint[]): string {
  const grouped = clinicalDataPoints.reduce<Record<string, ClinicalDataPoint[]>>((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const section = (title: string, category: ClinicalDataCategory) => {
    const items = grouped[category] || [];
    return `${title}:\n${items.length ? items.map((d) => `- ${d.value} (${Math.round(d.confidence * 100)}%)`).join("\n") : "- Not found"}`;
  };

  return normalizeWhitespace(`
CLINICAL/OCCUPATIONAL INTELLIGENCE SUMMARY
All direct identifiers redacted locally before this summary is used downstream.

${section("Demographics", "examinee_name")}
${section("Date of Birth", "dob")}
${section("Job Title", "job_title")}
${section("Employer", "employer")}
${section("Applicable Standard", "agency_standard")}
${section("Deployment Country", "deployment_country")}
${section("Medical Conditions", "medical_condition")}
${section("Lab Values", "lab_value")}
${section("Current Medications", "medication")}
${section("Injuries / Surgeries", "injury")}
${section("Job Duties", "job_duty")}
${section("Documentation Gaps", "documentation_gap")}
${section("Recommendations", "recommendation")}

Redacted source excerpt:
${redactedText.slice(0, 3000)}
`);
}

export async function processDocumentLocally(file: File): Promise<LocalProcessingResult> {
  const extraction = await extractPDFLocally(file);
  const originalText = extraction.text || `[No extractable text found in ${file.name}]`;
  const redaction = redactPHI(originalText);
  const validation = validateRedaction(originalText, redaction.redactedText);
  const clinicalDataPoints = extractClinicalDataLocally(redaction.redactedText);
  const scrubbedText = createScrubbedText(redaction.redactedText, clinicalDataPoints);

  return {
    originalText,
    redactedText: redaction.redactedText,
    scrubbedText,
    detectedPHI: redaction.detectedPHI,
    clinicalDataPoints,
    readyForAIAnalysis: validation.isValid,
    sourceFileName: file.name,
    extractionMethod: extraction.method,
    redactionConfidence: validation.confidence,
    warning: extraction.warning,
  };
}

export function verifyScrubbed(text: string): { isSafe: boolean; suspiciousPatterns: string[] } {
  const suspiciousPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/,
    /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    /\b(?:MRN|Medical Record|Chart #)[\s:]*[A-Z0-9]{6,12}/i,
    /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct)\b/i,
  ];

  const found: string[] = [];
  for (const pattern of suspiciousPatterns) {
    const matches = text.match(pattern);
    if (matches) found.push(...matches);
  }

  return {
    isSafe: found.length === 0,
    suspiciousPatterns: found,
  };
}
