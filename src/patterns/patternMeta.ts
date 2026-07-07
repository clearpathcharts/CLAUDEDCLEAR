import type { ChartPatternId } from './types';

export type PatternGroup = 'continuation' | 'reversal' | 'bilateral';

export const PATTERN_GROUP_LABELS: Record<PatternGroup, string> = {
  continuation: 'Continuation',
  reversal: 'Reversal',
  bilateral: 'Bilateral',
};

export const CHART_PATTERN_META: Record<
  ChartPatternId,
  { group: PatternGroup; label: string }
> = {
  bull_flag: { group: 'continuation', label: 'Bull Flag' },
  bear_flag: { group: 'continuation', label: 'Bear Flag' },
  bull_pennant: { group: 'continuation', label: 'Bull Pennant' },
  bear_pennant: { group: 'continuation', label: 'Bear Pennant' },
  cup_and_handle: { group: 'continuation', label: 'Cup and Handle' },
  ascending_triangle: { group: 'continuation', label: 'Ascending Triangle' },
  descending_triangle: { group: 'continuation', label: 'Descending Triangle' },
  rectangle: { group: 'continuation', label: 'Rectangle' },
  head_and_shoulders: { group: 'reversal', label: 'Head and Shoulders' },
  inverse_head_and_shoulders: { group: 'reversal', label: 'Inverse Head and Shoulders' },
  double_top: { group: 'reversal', label: 'Double Top' },
  double_bottom: { group: 'reversal', label: 'Double Bottom' },
  triple_top: { group: 'reversal', label: 'Triple Top' },
  triple_bottom: { group: 'reversal', label: 'Triple Bottom' },
  rising_wedge: { group: 'reversal', label: 'Rising Wedge' },
  falling_wedge: { group: 'reversal', label: 'Falling Wedge' },
  symmetrical_triangle: { group: 'bilateral', label: 'Symmetrical Triangle' },
  broadening_wedge: { group: 'bilateral', label: 'Broadening Wedge' },
};

export function getChartPatternGroup(id: ChartPatternId): PatternGroup {
  return CHART_PATTERN_META[id].group;
}

/** Hot pink + purple neon palette for drawn pattern geometry */
export const NEON_PATTERN_LINE_COLORS = {
  hotPink: '#FF1493',
  magenta: '#FF00CC',
  purple: '#BF00FF',
  violet: '#9D00FF',
  deepPurple: '#7F00FF',
} as const;

export function neonLineColor(role: string, lineIndex: number): string {
  switch (role) {
    case 'upper':
      return NEON_PATTERN_LINE_COLORS.hotPink;
    case 'lower':
      return NEON_PATTERN_LINE_COLORS.purple;
    case 'horizontal':
    case 'neckline':
      return NEON_PATTERN_LINE_COLORS.magenta;
    case 'cup':
      return NEON_PATTERN_LINE_COLORS.violet;
    default:
      return lineIndex % 2 === 0
        ? NEON_PATTERN_LINE_COLORS.hotPink
        : NEON_PATTERN_LINE_COLORS.purple;
  }
}
