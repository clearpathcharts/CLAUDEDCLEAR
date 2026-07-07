import { IndicatorBank } from '../../core/engine/IndicatorBank';
import { IndicatorRegistry } from '../../core/registry/IndicatorRegistry';
import { OSS_INDICATOR_SPECS } from './catalog';
import type { Candle } from '../../types/indicators';

const data: Candle[] = Array.from({ length: 200 }, (_, i) => ({
  time: 1_700_000_000 + i * 3600,
  open: 100 + i * 0.2,
  high: 102 + i * 0.2,
  low: 98 + i * 0.2,
  close: 100 + i * 0.2 + Math.sin(i / 8),
  volume: 1000 + i * 10,
}));

let failed = 0;

for (const spec of OSS_INDICATOR_SPECS) {
  const fn = IndicatorBank[spec.abbr];
  if (!fn) {
    console.error(`MISSING BANK: ${spec.abbr}`);
    failed++;
    continue;
  }
  try {
    const r = fn(data);
    if (!Array.isArray(r) || r.length === 0) {
      console.error(`EMPTY: ${spec.abbr}`);
      failed++;
      continue;
    }
    console.log(`OK ${spec.abbr} points=${r.length}`);
  } catch (e) {
    console.error(`ERR ${spec.abbr}:`, (e as Error).message);
    failed++;
  }
}

const registryAbbrs = new Set(IndicatorRegistry.map((i) => i.abbr));
for (const spec of OSS_INDICATOR_SPECS) {
  if (!registryAbbrs.has(spec.abbr)) {
    console.error(`MISSING REGISTRY: ${spec.abbr}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`${failed} OSS indicator check(s) failed`);
  process.exit(1);
}

console.log(`All ${OSS_INDICATOR_SPECS.length} OSS indicators OK (${IndicatorRegistry.length} total live)`);
