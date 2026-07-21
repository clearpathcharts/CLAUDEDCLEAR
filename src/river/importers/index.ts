export { detectSourceLanguage, isPineSource, languageFileExtension } from "./detectLanguage";
export { translateMql4ToPine } from "./mql4/toPine";
export type { LanguageDetection, ImportTranslationResult, RiverSourceLanguage } from "./types";

import { detectSourceLanguage } from "./detectLanguage";
import { translateMql4ToPine } from "./mql4/toPine";
import type { ImportTranslationResult, RiverSourceLanguage } from "./types";

/** Route detected language to the appropriate importer (v1 — Pine bridge output). */
export function importForeignSource(source: string, language?: RiverSourceLanguage): ImportTranslationResult {
  const detected = language ?? detectSourceLanguage(source).language;

  switch (detected) {
    case "mql4":
    case "mql5":
      return translateMql4ToPine(source);
    case "pine":
      return { ok: true, sourceLanguage: "pine", pineSource: source, warnings: [], errors: [], manualReview: [] };
    default:
      return {
        ok: false,
        sourceLanguage: detected,
        warnings: [],
        errors: [`Importer for ${detected} is not built yet.`],
        manualReview: [
          "Use River Genie to describe what this script should do — we'll add native importers platform by platform.",
        ],
      };
  }
}
