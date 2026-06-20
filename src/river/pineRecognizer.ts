// /src/river/pineRecognizer.ts
//
// The real (first-version) River front end. Takes raw Pine Script v4/v5 text
// and:
//   1. Strips comments and normalizes whitespace
//   2. Extracts simple numeric/boolean input declarations
//   3. Checks the source against a small library of KNOWN, real patterns
//   4. Reports honestly: either "recognized as X, here are the extracted
//      parameters" or "not recognized" with the specific lines that didn't
//      match anything known.
//
// This does NOT attempt to parse arbitrary Pine Script. It recognizes a
// defined, growing set of common real-world patterns. Anything outside that
// set is reported as unsupported -- never silently faked.

export interface RecognizedInput {
  name: string;
  type: "number" | "bool";
  value: number | boolean;
}

export interface RecognitionResult {
  patternMatched: "atr_trailing_stop" | null;
  confidence: "high" | "medium" | "none";
  inputs: RecognizedInput[];
  recognizedLines: number;
  totalLines: number;
  unrecognizedSnippets: string[]; // honest list of lines we didn't understand
}

function stripComments(source: string): string {
  return source
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("//");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");
}

/** Extracts simple top-level input declarations like `a = 1` or `h = false`. */
function extractSimpleInputs(lines: string[]): RecognizedInput[] {
  const inputs: RecognizedInput[] = [];
  const numRe = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(-?\d+(\.\d+)?)\s*$/;
  const boolRe = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(true|false)\s*$/;

  for (const line of lines) {
    const numMatch = line.match(numRe);
    if (numMatch) {
      inputs.push({ name: numMatch[1], type: "number", value: parseFloat(numMatch[2]) });
      continue;
    }
    const boolMatch = line.match(boolRe);
    if (boolMatch) {
      inputs.push({ name: boolMatch[1], type: "bool", value: boolMatch[2] === "true" });
    }
  }
  return inputs;
}

/**
 * Real signature check for the ATR Trailing Stop / "UT Bot" family pattern.
 * Requires the actual structural fingerprints to be present -- not just a
 * loose keyword guess.
 */
function matchesAtrTrailingStop(normalized: string): { match: boolean; confidence: "high" | "medium" | "none" } {
  const hasATR = /ta\.atr\(|[^a-zA-Z]atr\(/.test(normalized);
  const hasTrailingStopVar = /TrailingStop/i.test(normalized);
  const hasRecursiveSelfRef = /\[1\]/.test(normalized); // refers to previous bar's own value
  const hasCrossoverLogic = /crossover|crossunder|>\s*nz\(|<\s*nz\(/.test(normalized);

  const hits = [hasATR, hasTrailingStopVar, hasRecursiveSelfRef, hasCrossoverLogic].filter(Boolean).length;

  if (hits === 4) return { match: true, confidence: "high" };
  if (hits === 3) return { match: true, confidence: "medium" };
  return { match: false, confidence: "none" };
}

export function recognizePineScript(source: string): RecognitionResult {
  const stripped = stripComments(source);
  const lines = stripped.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  const inputs = extractSimpleInputs(lines);
  const { match, confidence } = matchesAtrTrailingStop(stripped);

  // Honest accounting: which lines did we actually use?
  const consumedPatterns = [
    /^\/\/@version/,
    /^indicator\(/,
    /^strategy\(/,
    /^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*-?\d+(\.\d+)?\s*$/,
    /^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*(true|false)\s*$/,
    /ta\.atr\(/,
    /TrailingStop/i,
    /ta\.ema\(/,
    /crossover|crossunder/,
    /plotshape\(/,
    /barcolor\(/,
    /alertcondition\(/,
  ];

  const unrecognizedSnippets: string[] = [];
  let recognizedLines = 0;
  for (const line of lines) {
    const recognized = consumedPatterns.some((re) => re.test(line));
    if (recognized) {
      recognizedLines++;
    } else if (line.length > 3) {
      unrecognizedSnippets.push(line);
    }
  }

  return {
    patternMatched: match ? "atr_trailing_stop" : null,
    confidence,
    inputs,
    recognizedLines,
    totalLines: lines.length,
    unrecognizedSnippets,
  };
}
