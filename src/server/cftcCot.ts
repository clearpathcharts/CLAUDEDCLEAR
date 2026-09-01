/**
 * Compatibility facade. The COT engine lives in `./cot/engine.ts`.
 * CFTC.gov is fetched once per contract by the backend, never by trader browsers.
 */
export {
  buildCftcDatasetUrl,
  buildCftcLegacyUrl,
  clearCotCacheForTest,
  fetchCftcLegacyHistory,
  loadCotEngine,
  peekCotCache,
  resolveCotRequest,
  seedCotCacheForTest,
  CFTC_DATASETS,
  type CotEnginePack,
  type CotHistoryPack,
} from './cot/engine';
export { cftcAnnualZipUrl, ingestAnnualZip } from './cot/rawArchive';
