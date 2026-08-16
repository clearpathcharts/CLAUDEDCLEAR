import {
  EDUCATIONAL_DISCLAIMER,
  STRUCTURE_READ_LABEL,
  STRUCTURE_READ_MENTOR_LABEL,
  emptyStructureReadLine,
  formatResolutionBias,
} from './complianceCopy';
import type { FormingStructureBrief } from './forming';
import type { DetectedPattern } from './types';
import type { PatternLifecycleStatus } from './lifecycle';
import type { MarketStructureState } from './marketState';
import type { MtfAlignment } from './mtfAlign';

export interface StructureRead {
  label: string;
  headline: string;
  patternLabel: string | null;
  resolutionBias: string | null;
  geometricFitPct: number | null;
  lifecycle: PatternLifecycleStatus | null;
  marketStateLabel: string | null;
  mtfBadge: string | null;
  disclaimer: string;
  empty: boolean;
}

function pickPrimaryPattern(patterns: DetectedPattern[]): DetectedPattern | null {
  const chart = patterns
    .filter((p) => p.category === 'chart')
    .sort((a, b) => b.confidence - a.confidence || b.endIndex - a.endIndex);
  if (chart[0]) return chart[0];
  const any = [...patterns].sort((a, b) => b.confidence - a.confidence);
  return any[0] ?? null;
}

/**
 * One-line educational synthesis of live pattern literacy.
 * Never a buy/sell recommendation.
 */
export function synthesizeStructureRead(
  patterns: DetectedPattern[],
  forming: FormingStructureBrief | null,
  extras?: {
    marketState?: MarketStructureState | null;
    mtf?: MtfAlignment | null;
  },
): StructureRead {
  const disclaimer = EDUCATIONAL_DISCLAIMER;
  const marketStateLabel = extras?.marketState
    ? extras.marketState.displayLabel
    : null;
  const mtfBadge = extras?.mtf?.badge ?? null;

  const primary = pickPrimaryPattern(patterns);
  if (primary) {
    const pct = Math.round(primary.confidence * 100);
    const bias = formatResolutionBias(primary.direction);
    const lifecycle = primary.lifecycle ?? null;
    const lifecycleBit = lifecycle
      ? ` · ${lifecycle.charAt(0).toUpperCase()}${lifecycle.slice(1)}`
      : '';
    const headline = `${primary.label} · ${bias} · ${pct}% geometric fit${lifecycleBit}`;
    return {
      label: STRUCTURE_READ_LABEL,
      headline,
      patternLabel: primary.label,
      resolutionBias: bias,
      geometricFitPct: pct,
      lifecycle,
      marketStateLabel,
      mtfBadge,
      disclaimer,
      empty: false,
    };
  }

  const top = forming?.possibilities?.[0];
  if (top) {
    const pct = Math.round(top.probability * 100);
    const headline = `${top.label} · ${top.status} · ${pct}% geometric fit`;
    return {
      label: STRUCTURE_READ_LABEL,
      headline,
      patternLabel: top.label,
      resolutionBias: null,
      geometricFitPct: pct,
      lifecycle: top.status === 'watch' ? 'possible' : (top.status as PatternLifecycleStatus),
      marketStateLabel,
      mtfBadge,
      disclaimer,
      empty: false,
    };
  }

  return {
    label: STRUCTURE_READ_LABEL,
    headline: emptyStructureReadLine(),
    patternLabel: null,
    resolutionBias: null,
    geometricFitPct: null,
    lifecycle: null,
    marketStateLabel,
    mtfBadge,
    disclaimer,
    empty: true,
  };
}

export function formatStructureReadForMentor(read: StructureRead): string {
  const bits = [`${STRUCTURE_READ_MENTOR_LABEL} ${read.headline}`];
  if (read.marketStateLabel) bits.push(`Market structure state: ${read.marketStateLabel}`);
  if (read.mtfBadge) bits.push(read.mtfBadge);
  bits.push(read.disclaimer);
  return bits.join('\n');
}
