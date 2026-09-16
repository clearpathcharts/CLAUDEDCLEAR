import { asFinite } from './format';

export type ScenarioInputs = {
  revenueBase: number | null;
  revenueHigh: number | null;
  revenueLow: number | null;
  marginBase: number | null;
  marginHigh: number | null;
  marginLow: number | null;
  fcfConversionBase: number | null;
  fcfConversionHigh: number | null;
  fcfConversionLow: number | null;
};

export type ScenarioOutputs = {
  fcfBase: number | null;
  fcfHigh: number | null;
  fcfLow: number | null;
  ebitBase: number | null;
  ebitHigh: number | null;
  ebitLow: number | null;
};

function product(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  return a * b;
}

/** Pure arithmetic on user-editable assumptions. Never a forecast of actual results. */
export function runScenario(inputs: ScenarioInputs): ScenarioOutputs {
  const ebitBase = product(asFinite(inputs.revenueBase), asFinite(inputs.marginBase));
  const ebitHigh = product(asFinite(inputs.revenueHigh), asFinite(inputs.marginHigh));
  const ebitLow = product(asFinite(inputs.revenueLow), asFinite(inputs.marginLow));
  return {
    ebitBase,
    ebitHigh,
    ebitLow,
    fcfBase: product(ebitBase, asFinite(inputs.fcfConversionBase)),
    fcfHigh: product(ebitHigh, asFinite(inputs.fcfConversionHigh)),
    fcfLow: product(ebitLow, asFinite(inputs.fcfConversionLow)),
  };
}

export const SCENARIO_DISCLAIMER =
  'Model output from user assumptions — not a guaranteed future value and not a price target.';
