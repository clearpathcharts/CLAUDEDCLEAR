/** Supported source platforms for The River liberation pipeline. */

export type RiverSourceLanguage =
  | "pine"
  | "mql4"
  | "mql5"
  | "ninjatrader"
  | "thinkscript"
  | "easylanguage"
  | "powerlanguage"
  | "python_lean"
  | "indie"
  | "gocharting"
  | "probuilder"
  | "afl"
  | "efs"
  | "acsil"
  | "csharp_algo"
  | "unknown";

export interface LanguageDetection {
  language: RiverSourceLanguage;
  label: string;
  confidence: "high" | "medium" | "low";
  /** Human-readable platform name */
  platform: string;
  hints: string[];
}

export interface ImportTranslationResult {
  ok: boolean;
  sourceLanguage: RiverSourceLanguage;
  /** Pine Script v5 target for the interpreter path */
  pineSource?: string;
  warnings: string[];
  errors: string[];
  /** Lines that could not be converted automatically */
  manualReview: string[];
}
