export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorDefinition {
  id: string;
  name: string;
  abbr: string;
  category: string;
  activeColor: string;
  sourceFile: string;
  parameters: Record<string, number | string | boolean>;
}
