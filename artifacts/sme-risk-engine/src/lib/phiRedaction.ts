/**
 * PHI (Protected Health Information) Redaction Engine
 * 
 * Automatically detects and redacts sensitive information from medical documents
 * to ensure HIPAA compliance while preserving clinical intelligence.
 */

export interface PHIPattern {
  name: string;
  pattern: RegExp;
  replacement: string;
  category: "name" | "ssn" | "address" | "phone" | "email" | "mrn" | "date" | "employer";
}

export interface RedactionResult {
  originalText: string;
  redactedText: string;
  detectedPHI: {
    type: string;
    value: string;
    position: number;
  }[];
  redactionScore: number; // 0-100, higher = more PHI detected and redacted
}

/**
 * Comprehensive PHI detection patterns
 */
const PHI_PATTERNS: PHIPattern[] = [
  // Social Security Numbers (XXX-XX-XXXX)
  {
    name: "SSN",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN REDACTED]",
    category: "ssn",
  },
  // Medical Record Numbers (various formats)
  {
    name: "MRN",
    pattern: /(?:MRN|Medical Record|Chart #)[\s:]*([A-Z0-9]{6,12})/gi,
    replacement: "[MRN REDACTED]",
    category: "mrn",
  },
  // Phone Numbers (XXX-XXX-XXXX or (XXX) XXX-XXXX)
  {
    name: "Phone",
    pattern: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    replacement: "[PHONE REDACTED]",
    category: "phone",
  },
  // Email Addresses
  {
    name: "Email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: "[EMAIL REDACTED]",
    category: "email",
  },
  // Street Addresses (simplified)
  {
    name: "Address",
    pattern: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct)\b/gi,
    replacement: "[ADDRESS REDACTED]",
    category: "address",
  },
  // Zip Codes
  {
    name: "Zip Code",
    pattern: /\b\d{5}(?:-\d{4})?\b/g,
    replacement: "[ZIP REDACTED]",
    category: "address",
  },
  // Dates (MM/DD/YYYY or MM-DD-YYYY)
  {
    name: "Date",
    pattern: /\b(?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])[-/](?:19|20)\d{2}\b/g,
    replacement: "[DATE REDACTED]",
    category: "date",
  },
  // Full Names (common patterns)
  {
    name: "Name",
    pattern: /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
    replacement: "[NAME REDACTED]",
    category: "name",
  },
  // Employer/Company Names (heuristic)
  {
    name: "Employer",
    pattern: /(?:Employer|Company|Works at|Employed by)[\s:]*([A-Z][A-Za-z\s&,.-]+)/gi,
    replacement: "[EMPLOYER REDACTED]",
    category: "employer",
  },
];

/**
 * Detect and redact PHI from text
 */
export function redactPHI(text: string): RedactionResult {
  let redactedText = text;
  const detectedPHI: RedactionResult["detectedPHI"] = [];
  let redactionCount = 0;

  for (const pattern of PHI_PATTERNS) {
    const matches = text.matchAll(pattern.pattern);
    for (const match of matches) {
      detectedPHI.push({
        type: pattern.category,
        value: match[0],
        position: match.index || 0,
      });
      redactionCount++;
    }
    redactedText = redactedText.replace(pattern.pattern, pattern.replacement);
  }

  const redactionScore = Math.min(100, (redactionCount / 10) * 100);

  return {
    originalText: text,
    redactedText,
    detectedPHI,
    redactionScore,
  };
}

/**
 * Detect PHI in a document without redacting
 */
export function detectPHI(text: string): RedactionResult["detectedPHI"] {
  const detected: RedactionResult["detectedPHI"] = [];

  for (const pattern of PHI_PATTERNS) {
    const matches = text.matchAll(pattern.pattern);
    for (const match of matches) {
      detected.push({
        type: pattern.category,
        value: match[0],
        position: match.index || 0,
      });
    }
  }

  return detected;
}

/**
 * Generate a summary of detected PHI
 */
export function generatePHISummary(detected: RedactionResult["detectedPHI"]): {
  [key: string]: number;
} {
  const summary: { [key: string]: number } = {};

  for (const item of detected) {
    summary[item.type] = (summary[item.type] || 0) + 1;
  }

  return summary;
}

/**
 * Validate that text has been sufficiently redacted
 */
export function validateRedaction(
  originalText: string,
  redactedText: string,
  threshold: number = 0.8
): { isValid: boolean; confidence: number } {
  const originalPHI = detectPHI(originalText);
  const redactedPHI = detectPHI(redactedText);

  const redactionRate = 1 - redactedPHI.length / Math.max(1, originalPHI.length);
  const isValid = redactionRate >= threshold;

  return {
    isValid,
    confidence: redactionRate,
  };
}
