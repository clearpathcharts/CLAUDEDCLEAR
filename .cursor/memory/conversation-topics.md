# Conversation topics (founder memory)

Saved 2026-09-01 from the desk color-chart thread. Agents should treat these as standing product decisions unless the founder changes them.

## Desk visual design — color chart

The founder asked to code a TradingView-style color chart onto all four trader desks:

- Retail Trader
- Fundamental Trader
- Institutional Trader
- Neurodivergent Traders

**Tabs stay outside the chart** (desk chrome, not over candles).

**Paint targets**

| Tab | What it colors |
| --- | --- |
| Background | Desk paper / shell |
| Chart | Price-plot fill, text, grid |
| Candle ↑ | Bullish body, wick, border |
| Candle ↓ | Bearish body, wick, border |
| Indicators | Every overlay and oscillator |
| Bento | Panel cards and container fills |

Neurodivergent also shows a **soft pastel** row (lower stimulation).

## Color save — explicit, not silent

The first ship wrote picks straight to `localStorage` with no Save button. On Fundamental, Indicator / Chart / Candle picks looked lost because **that desk has no price plot**.

Standing rules:

1. A swatch is a **live preview** only (`Unsaved changes`).
2. **Save colors** persists the current desk on this device.
3. **Save to all desks** copies the same palette to all four desks (use this so Fundamental plot colors actually reach Retail / Institutional / Neuro charts).
4. **Discard** reverts unsaved preview.
5. **Reset desk** clears that desk’s saved colors.

Storage key: `clearpath_desk_color_chart_v1` (device-local, per desk). Not account/cloud unless the founder later asks.

## Files

- `src/lib/deskColorChart.ts` — palette, store, save/copy helpers
- `src/components/desks/ColorChartPicker.tsx` — chart UI + Save bar
- `src/components/desks/DeskAppearanceContext.tsx` — draft vs saved
- `src/components/desks/TraderDeskChrome.tsx` — Colors toggle in chrome
- `src/components/desks/colorChart.css`
- `src/components/charts/LightweightCandles.tsx` — `visualPaint` for chart / candles / indicators
- Tests: `npm run test:desk-color-chart`, `npm run test:trader-desks`

## Related PRs

- Color chart on four desks: #215 (merged)
- Explicit Save / Save to all desks: #216
