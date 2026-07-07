import type { IChartApi, ISeriesApi, LineWidth, Time } from 'lightweight-charts';
import { LineSeries, LineStyle } from 'lightweight-charts';
import { getOssSpec, type OssIndicatorSpec } from '../../indicators/oss/catalog';

type AddOscFn = (opts: {
  color: string;
  lineWidth: LineWidth;
  title: string;
}) => ISeriesApi<'Line'>;

export function renderOssIndicator(
  chart: IChartApi,
  spec: OssIndicatorSpec,
  rawData: unknown,
  addOscillatorSeries: AddOscFn,
  fallbackColor: string,
): void {
  const rows = rawData as Record<string, number>[];
  if (!Array.isArray(rows) || rows.length === 0) return;

  const plotLine = (
    key: string,
    label: string,
    color: string,
    onOscillator: boolean,
    lineWidth: LineWidth = 2,
    dashed = false,
  ) => {
    const pts = rows.map((d) => ({ time: d.time as Time, value: d[key] }));
    const opts = {
      color,
      lineWidth,
      title: label,
      ...(dashed ? { lineStyle: LineStyle.Dashed } : {}),
    };
    const series = onOscillator
      ? addOscillatorSeries(opts)
      : chart.addSeries(LineSeries, opts);
    series.setData(pts);
  };

  if (spec.render === 'overlay-line') {
    plotLine('value', spec.abbr, spec.activeColor, false);
    return;
  }

  if (spec.render === 'oscillator-line') {
    plotLine('value', spec.name, spec.activeColor, true);
    return;
  }

  if (spec.render === 'dual-line' || spec.render === 'fisher') {
    for (const s of spec.series ?? []) {
      plotLine(s.key, s.label, s.color ?? fallbackColor, true, (s.lineWidth ?? 2) as LineWidth);
    }
    return;
  }

  if (spec.render === 'bands-3') {
    const keys = spec.series ?? [
      { key: 'upper', label: 'upper', color: '#22C55E' },
      { key: 'lower', label: 'lower', color: '#EF4444' },
      { key: 'basis', label: 'basis', color: fallbackColor },
    ];
    for (const s of keys) {
      plotLine(s.key, s.label, s.color ?? fallbackColor, false, (s.lineWidth ?? 2) as LineWidth, s.dashed);
    }
  }
}

export function tryRenderOssIndicator(
  chart: IChartApi,
  abbr: string,
  rawData: unknown,
  addOscillatorSeries: AddOscFn,
  fallbackColor: string,
): boolean {
  const spec = getOssSpec(abbr);
  if (!spec) return false;
  renderOssIndicator(chart, spec, rawData, addOscillatorSeries, fallbackColor);
  return true;
}

/** Normalize single-series OSS output for generic fallback plotting. */
export function normalizeOssLineData(rawData: unknown): { time: number; value: number }[] {
  if (!Array.isArray(rawData)) return [];
  if (rawData.length === 0) return [];
  const first = rawData[0];
  if (typeof first === 'object' && first !== null && 'value' in first) {
    return rawData as { time: number; value: number }[];
  }
  return [];
}
