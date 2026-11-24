"use client";

import {
  CHART_STYLES,
  CHART_STYLE_LABELS,
  type ChartStyle,
} from "@/lib/chartStyle";

type Props = {
  value: ChartStyle;
  onChange: (next: ChartStyle) => void;
  deskTitle: string;
};

export function ChartStyleControls({ value, onChange, deskTitle }: Props) {
  return (
    <div className="chart-style" role="group" aria-label="Chart style">
      <span className="chart-style-label">{deskTitle} chart</span>
      <div className="chart-style-options">
        {CHART_STYLES.map((style) => (
          <button
            key={style}
            type="button"
            aria-pressed={value === style}
            onClick={() => onChange(style)}
          >
            {CHART_STYLE_LABELS[style]}
          </button>
        ))}
      </div>
    </div>
  );
}
