import { IndicatorBank } from '../../core/engine/IndicatorBank';
import { IndicatorRegistry } from '../../core/registry/IndicatorRegistry';
import type { Candle } from '../../types/indicators';

const data: Candle[] = Array.from({ length: 120 }, (_, i) => ({
  time: 1_700_000_000 + i * 3600,
  open: 100 + i * 0.2,
  high: 102 + i * 0.2,
  low: 98 + i * 0.2,
  close: 100 + i * 0.2 + Math.sin(i / 8),
  volume: 1000 + i * 10,
}));

const NEW = ['DEMA', 'KAMA', 'ULTOSC', 'AROON', 'KST', 'FI'] as const;

for (const key of NEW) {
  const fn = IndicatorBank[key];
  if (!fn) throw new Error(`Missing bank entry: ${key}`);
  const r = fn(data);
  if (!Array.isArray(r) || r.length === 0) throw new Error(`${key} returned empty`);
  console.log(`OK ${key} points=${r.length}`);
}

const registered = IndicatorRegistry.map((i) => i.abbr);
const missing = NEW.filter((k) => !registered.includes(k));
if (missing.length) throw new Error(`Registry missing: ${missing.join(', ')}`);

console.log(`All ${NEW.length} OSS indicators registered (${IndicatorRegistry.length} total live)`);
