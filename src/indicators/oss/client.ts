import { IndicatorsSync } from '@ixjb94/indicators';

let _ta: IndicatorsSync | null = null;

/** Lazy singleton for @ixjb94/indicators sync API. */
export function getOssIndicators(): IndicatorsSync {
  if (!_ta) _ta = new IndicatorsSync();
  return _ta;
}
