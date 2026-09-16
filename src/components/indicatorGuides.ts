/**
 * Educational how-to-read copy for every Encyclopedia of Indicators entry.
 * Live-overlay names get exact bank formulas; everything else still gets a
 * complete study card (formula, reading rules, limitations, settings).
 */

export type IndicatorGuide = {
  formula: string;
  howToRead: string;
  limitations: string;
  typicalSettings: string;
};

const LIVE_GUIDES: Record<string, IndicatorGuide> = {
  "SMA (Simple Moving Average)": {
    formula: "SMA_n = (P_t + P_{t-1} + … + P_{t-n+1}) / n",
    howToRead: "Price above a rising SMA favors an uptrend; below a falling SMA favors a downtrend. The slope matters more than a single cross.",
    limitations: "Lags price. Whipsaws in ranges. Does not measure volatility or volume.",
    typicalSettings: "20 (swing), 50 (intermediate), 200 (long-term trend)",
  },
  "Moving Average": {
    formula: "MA_n = average of the last n closes (SMA, EMA, or WMA depending on type)",
    howToRead: "Treat as a dynamic trend filter and support/resistance. Crosses of a faster MA through a slower MA mark regime shifts.",
    limitations: "Any MA is a lagging smoother. Fast lengths fake out; slow lengths miss turns.",
    typicalSettings: "20 / 50 / 200 depending on timeframe",
  },
  "EMA (Exponential Moving Average)": {
    formula: "EMA_t = k·P_t + (1−k)·EMA_{t-1},  k = 2/(n+1)",
    howToRead: "Responds faster than SMA. Price/EMA relationship plus EMA slope define the trend. EMA crossovers are classic timing signals.",
    limitations: "Still lags. More sensitive to last bars, so noisier than SMA of the same length.",
    typicalSettings: "12 & 26 (MACD pair), 21, 50",
  },
  "Weighted Moving Average": {
    formula: "WMA_n = Σ(i·P_i) / Σ(i) for i = 1…n (recent bars weighted more)",
    howToRead: "Sits between SMA and EMA: recent price counts more, older price still in the average. Use like any trend MA.",
    limitations: "Lags and still whipsaws. Not volume-weighted.",
    typicalSettings: "20 or 50",
  },
  "Volume Weighted Moving Average": {
    formula: "VWMA_n = Σ(P_i·V_i) / Σ(V_i) over n bars",
    howToRead: "When VWMA sits away from a same-length SMA, high-volume bars are dominating the average — often institutional participation.",
    limitations: "Needs honest volume. Thin or synthetic volume (some FX/crypto feeds) distorts it.",
    typicalSettings: "20",
  },
  "Double EMA": {
    formula: "DEMA = 2·EMA(n) − EMA(EMA(n))",
    howToRead: "Lower-lag trend line. Use like EMA but expect earlier turns and slightly more noise.",
    limitations: "Can overshoot. Not a standalone overbought/oversold tool.",
    typicalSettings: "21",
  },
  TEMA: {
    formula: "TEMA = 3·EMA − 3·EMA(EMA) + EMA(EMA(EMA))",
    howToRead: "Very responsive trend overlay. Price holding above TEMA in an uptrend is constructive.",
    limitations: "Over-responsive in chop. Triple smoothing can still overshoot spikes.",
    typicalSettings: "21",
  },
  "Triple EMA": {
    formula: "TEMA = 3·EMA − 3·EMA(EMA) + EMA(EMA(EMA))",
    howToRead: "Same family as TEMA — a low-lag moving average for trend following.",
    limitations: "Whipsaws faster than SMA/EMA of equal length.",
    typicalSettings: "21",
  },
  "Hull Moving Average": {
    formula: "HMA = WMA( 2·WMA(n/2) − WMA(n), √n )",
    howToRead: "Color/slope changes flag trend flips with less lag than SMA. Designed to stay smooth while turning sooner.",
    limitations: "Can still flip in ranges. Not a volatility stop.",
    typicalSettings: "16 or 21",
  },
  "Linear Regression": {
    formula: "Least-squares line: P ≈ a + b·t  over the lookback window",
    howToRead: "Slope b is drift. Price far above/below the line is statistically stretched versus the fitted trend.",
    limitations: "Refits every bar (the line moves). Not a crystal ball for the next close.",
    typicalSettings: "20 or 50",
  },
  "Linear Regression Channel": {
    formula: "Regression midline ± k·standard error of residuals",
    howToRead: "Outer rails frame typical travel. Touches of the outer channel can mark stretch; midline is the fair-trend magnet.",
    limitations: "Assumes roughly linear drift. Breaks during regime changes.",
    typicalSettings: "100 period, 2σ channel",
  },
  "Parabolic SAR": {
    formula: "SAR_{t+1} = SAR_t + AF·(EP − SAR_t); AF steps from 0.02 toward 0.20",
    howToRead: "Dots below price = long regime; above = short. Flip when price crosses the SAR — used as a trailing stop.",
    limitations: "Gets chopped in ranges. Acceleration factor is sensitive.",
    typicalSettings: "AF 0.02, max 0.20",
  },
  SuperTrend: {
    formula: "Bands = HL2 ± m·ATR(n); SuperTrend trails the active band and flips on close-through",
    howToRead: "Line below price and green = uptrend; above and red = downtrend. Flip is the regime change.",
    limitations: "ATR multiples lag violent spikes. Choppy markets produce many flips.",
    typicalSettings: "ATR 10, multiplier 3",
  },
  "Ichimoku Cloud": {
    formula: "Tenkan=(9-high+9-low)/2; Kijun=(26-high+26-low)/2; Span A=(Tenkan+Kijun)/2; Span B=(52-high+52-low)/2; Chikou=close plotted −26",
    howToRead: "Price above a green cloud is bullish structure; below a red cloud is bearish. Tenkan/Kijun crosses and Chikou vs past price confirm.",
    limitations: "Busy overlay. Default 9/26/52 assumes a Tokyo-session day count, not magic numbers.",
    typicalSettings: "9 / 26 / 52",
  },
  "Lagging Span": {
    formula: "Chikou = Close_t plotted at t−26",
    howToRead: "Chikou above price 26 bars ago supports bullish momentum; below supports bearish. Used with the full Ichimoku system.",
    limitations: "By design it looks backward. Do not treat as a leading oscillator.",
    typicalSettings: "26-bar displacement",
  },
  "Zig Zag Indicator": {
    formula: "Connect swings that move at least p% (or ATR multiple) from the last confirmed pivot",
    howToRead: "Clarifies swing structure for Fibonacci, waves, or market-structure labels.",
    limitations: "Repaints until a swing is confirmed. Never a live entry signal by itself.",
    typicalSettings: "5% or 2×ATR",
  },
  "Pivot Points": {
    formula: "PP=(H+L+C)/3; R1=2·PP−L; S1=2·PP−H; R2=PP+(H−L); S2=PP−(H−L)",
    howToRead: "Intraday magnet and S/R. Opens above PP often lean toward R levels; below toward S levels.",
    limitations: "Daily pivots reset; they are not a trend system. Less useful on strong trend days that ignore levels.",
    typicalSettings: "Classic floor-trader (prior day H/L/C)",
  },
  "Camarilla Pivot Points": {
    formula: "R4 = C + (H−L)·1.1/2; R3 = C + (H−L)·1.1/4; S3/S4 mirrored below the close",
    howToRead: "R3/S3 are mean-reversion zones; R4/S4 are breakout levels. Popular for intraday fades.",
    limitations: "Calibrated to typical daily ranges; news days blow through them.",
    typicalSettings: "Prior day H/L/C",
  },
  "ADX (Average Directional Index)": {
    formula: "DX = 100·|+DI − −DI| / (|+DI| + |−DI|); ADX = Wilder smooth of DX",
    howToRead: "ADX rising through ~25 = trend strengthening. ADX does not say up or down — use +DI/−DI (DMI) for direction.",
    limitations: "Lags. High ADX can persist after the move is extended. Low ADX is range, not a buy/sell.",
    typicalSettings: "14",
  },
  "Directional Movement Index (DMI)": {
    formula: "+DM = up-move when it exceeds down-move; −DM opposite; +DI/−DI = 100·smoothed DM / ATR",
    howToRead: "+DI above −DI favors upside direction; reverse favors downside. Pair with ADX for strength.",
    limitations: "Crossovers lag. Weak in tight ranges.",
    typicalSettings: "14",
  },
  "Relative Strength Index (RSI)": {
    formula: "RSI = 100 − 100/(1 + RS), RS = avg gain / avg loss over n (Wilder smoothing)",
    howToRead: "Classic 70/30 (or 80/20 in trends) for stretch. 50 is the momentum midline. Divergence with price can warn of fading thrust.",
    limitations: "Can stay overbought in strong trends. Not a standalone reversal oracle.",
    typicalSettings: "14; 2-period for short-term mean reversion",
  },
  MACD: {
    formula: "MACD = EMA(fast) − EMA(slow); Signal = EMA(MACD, s); Hist = MACD − Signal",
    howToRead: "Histogram expanding = momentum building. Signal-line cross and zero-line cross are the two main timing reads.",
    limitations: "Lags by construction. Double-cross noise in ranges.",
    typicalSettings: "12 / 26 / 9",
  },
  "MACD Histogram": {
    formula: "Histogram = MACD line − signal line",
    howToRead: "Rising histogram (even below zero) is improving momentum; shrinking histogram is fading momentum.",
    limitations: "Same lag as MACD. Tiny histogram wiggles are not signals.",
    typicalSettings: "12 / 26 / 9",
  },
  "Fast Stochastic": {
    formula: "%K = 100·(C − L_n)/(H_n − L_n); %D = SMA(%K, d)",
    howToRead: "High %K (near 80–100) = close near the range high; low (near 0–20) = close near the range low. %K/%D crosses time swings.",
    limitations: "Very noisy. Stays pinned in trends.",
    typicalSettings: "14, 3",
  },
  "Slow Stochastic": {
    formula: "Slow %K = SMA(fast %K); Slow %D = SMA(slow %K)",
    howToRead: "Same 80/20 map as fast stochastic with less jitter. Crosses of %K and %D are the common trigger.",
    limitations: "Still pins in trends. Extra smoothing adds lag.",
    typicalSettings: "14, 3, 3",
  },
  "Stochastic RSI": {
    formula: "StochRSI = (RSI − RSI_low) / (RSI_high − RSI_low) over n",
    howToRead: "A stochastic of RSI — very sensitive timing of RSI stretch. Extremes and crosses are the reads.",
    limitations: "Over-sensitive. Easy to over-trade.",
    typicalSettings: "RSI 14, Stoch 14, 3, 3",
  },
  "CCI (Commodity Channel Index)": {
    formula: "CCI = (TP − SMA(TP)) / (0.015·mean deviation), TP = (H+L+C)/3",
    howToRead: "Zero is the typical-price mean. ±100 are classic stretch bands; zero-line crosses show momentum polarity.",
    limitations: "Unbounded. Extremes can persist in trends.",
    typicalSettings: "20",
  },
  "Williams %R": {
    formula: "%R = −100 · (H_n − C) / (H_n − L_n)",
    howToRead: "Scale is 0 to −100. Readings near 0 = close at highs (stretch up); near −100 = close at lows. Similar to stochastic, inverted.",
    limitations: "Pins in trends. Thresholds (−20/−80) are conventions, not laws.",
    typicalSettings: "14",
  },
  "Rate of Change": {
    formula: "ROC = 100 · (C_t − C_{t-n}) / C_{t-n}",
    howToRead: "Zero-line is unchanged price. Rising ROC = accelerating advance; falling ROC = decelerating or reversing.",
    limitations: "Sensitive to the lookback spike n bars ago (drop-off effect).",
    typicalSettings: "12 or 21",
  },
  ROC: {
    formula: "ROC = 100 · (C_t − C_{t-n}) / C_{t-n}",
    howToRead: "Short name for Rate of Change. Crosses of zero and divergences are the main uses.",
    limitations: "Lookback drop-off can fake signals when an old spike leaves the window.",
    typicalSettings: "12",
  },
  "Price Rate of Change": {
    formula: "ROC = (C_t − C_{t-n}) / C_{t-n}  (percent or raw)",
    howToRead: "Speedometer of price. Use with a trend filter so you are not fading strong thrust.",
    limitations: "Same as ROC — window artifacts and no volume context.",
    typicalSettings: "12",
  },
  "Awesome Oscillator": {
    formula: "AO = SMA(HL2, 5) − SMA(HL2, 34)",
    howToRead: "Histogram above zero = short MA above long MA (bullish momentum). Saucer and twin-peak patterns are the classic Bill Williams reads.",
    limitations: "Histogram patterns are discretionary. Lags like any MA difference.",
    typicalSettings: "5 / 34 on midpoint",
  },
  "Price Oscillator": {
    formula: "PPO-style: 100 · (EMA_fast − EMA_slow) / EMA_slow  or raw MA difference",
    howToRead: "Percentage form lets you compare momentum across different price levels. Read like MACD.",
    limitations: "Same crossover lag as MACD.",
    typicalSettings: "12 / 26",
  },
  PPO: {
    formula: "PPO = 100 · (EMA_fast − EMA_slow) / EMA_slow",
    howToRead: "Percent MACD. Zero-line and signal crosses are the two core signals.",
    limitations: "Lags. Not a volatility tool.",
    typicalSettings: "12 / 26 / 9",
  },
  "Percent Price Oscillator": {
    formula: "PPO = 100 · (EMA_fast − EMA_slow) / EMA_slow",
    howToRead: "MACD expressed as a percent of the slow EMA so a $10 stock and a $200 stock are comparable.",
    limitations: "Still a lagging MA spread.",
    typicalSettings: "12 / 26 / 9",
  },
  "Chande Momentum Oscillator": {
    formula: "CMO = 100 · (Su − Sd) / (Su + Sd)  over n (Su=sum of up closes, Sd=down)",
    howToRead: "Scaled roughly −100 to +100. Zero is balanced pressure. Extremes and a signal MA are common.",
    limitations: "Can remain extreme in trends. Not volume-aware.",
    typicalSettings: "20",
  },
  "Detrended Price Oscillator": {
    formula: "DPO = C_{t − n/2+1} − SMA_n(C_t)",
    howToRead: "Removes a longer cycle so shorter oscillations are easier to see. Peaks/troughs time cycle highs/lows.",
    limitations: "Displaced by design — not a real-time trend overlay.",
    typicalSettings: "20 or 21",
  },
  DPO: {
    formula: "DPO = Close displaced − SMA(n)",
    howToRead: "Cycle highlighter. Use for timing oscillations, not for trend direction.",
    limitations: "Looks slightly backward. Easy to curve-fit cycle length.",
    typicalSettings: "20",
  },
  "Relative Vigor Index": {
    formula: "RVI = SMA(C−O) / SMA(H−L) with a 4-weight smoother; signal is a 4-period SMA of RVI",
    howToRead: "Measures conviction of closes vs the bar range. Signal-line crosses time swings.",
    limitations: "Can stay one-sided in strong trends.",
    typicalSettings: "10",
  },
  TRIX: {
    formula: "TRIX = 1-period rate of change of a triple-smoothed EMA",
    howToRead: "Zero-line and signal-line crosses mark momentum polarity with heavy smoothing.",
    limitations: "Triple EMA adds lag. Misses short swings.",
    typicalSettings: "15, signal 9",
  },
  "True Strength Index": {
    formula: "TSI = 100 · EMA(EMA(ΔC), r) / EMA(EMA(|ΔC|), r)",
    howToRead: "Double-smoothed momentum. Signal-line crosses and divergences time swings with less noise than raw momentum.",
    limitations: "Still lags turning points. Settings are sensitive.",
    typicalSettings: "25 / 13, signal 13",
  },
  "Ultimate Oscillator": {
    formula: "UO = 100 · (4·BP7/TR7 + 2·BP14/TR14 + BP28/TR28) / 7",
    howToRead: "Blends three timeframes of buying pressure. Designed to reduce false RSI-style divergences.",
    limitations: "More parameters to tune. Not a trend overlay.",
    typicalSettings: "7 / 14 / 28",
  },
  "Know Sure Thing (KST)": {
    formula: "Weighted sum of four ROC SMAs (typically 10/15/20/30 ROC smoothed 10/10/10/15)",
    howToRead: "Multi-cycle momentum. Signal-line cross is the main timing event.",
    limitations: "Many moving parts. Long combined lag.",
    typicalSettings: "Pring defaults 10-15-20-30 / 10-10-10-15",
  },
  "Fisher Transform": {
    formula: "Fisher = 0.5 · ln((1+x)/(1−x)) on a normalized price x ∈ (−0.999, 0.999)",
    howToRead: "Turns price into a near-Gaussian series so turning points sharpen. Crosses of Fisher and its trigger flag reversals.",
    limitations: "Can flip often. Normalization window matters.",
    typicalSettings: "10, trigger 1",
  },
  "Coppock Curve": {
    formula: "WMA of (ROC_14 + ROC_11), typically on monthly closes",
    howToRead: "Long-horizon momentum. Historically watched for a turn up from deep negatives as a major equity buy cue — education, not a promise.",
    limitations: "Very slow. Built for monthly indexes, not scalping.",
    typicalSettings: "11 & 14 ROC, 10 WMA, monthly",
  },
  "Bollinger Bands": {
    formula: "Middle = SMA(n); Upper/Lower = Middle ± k·σ(n)",
    howToRead: "Squeeze (narrow width) often precedes expansion. Band walks happen in trends; fades work better in ranges.",
    limitations: "σ assumes a stable distribution. Breakouts can fail; touches are not automatic reversals.",
    typicalSettings: "20, 2σ",
  },
  "Bollinger Band Width": {
    formula: "Width = (Upper − Lower) / Middle",
    howToRead: "Falling width = squeeze; rising width = volatility expansion. Use as a regime flag, not a direction.",
    limitations: "Does not say which way price will break.",
    typicalSettings: "20, 2σ",
  },
  "ATR (Average True Range)": {
    formula: "TR = max(H−L, |H−C_prev|, |L−C_prev|); ATR = Wilder smooth of TR",
    howToRead: "Volatility only. Rising ATR = larger bars. Used for stops (e.g. 2×ATR) and position sizing, not direction.",
    limitations: "No bullish/bearish meaning. Spikes after gaps.",
    typicalSettings: "14",
  },
  "Donchian Channels": {
    formula: "Upper = max(H, n); Lower = min(L, n); Mid = (Upper+Lower)/2",
    howToRead: "Turtle-style breakout: close beyond the channel is a trend-following event. Mid is a mean reference.",
    limitations: "Whipsaws in ranges. Always in the market if you trade every breakout.",
    typicalSettings: "20 entry / 10 exit",
  },
  "Turtle Channels": {
    formula: "Donchian high/low channels (classic 20-day entry, 10-day exit)",
    howToRead: "Breakout trend following. The system is rules, not discretion — study the original Turtle rules as a complete unit.",
    limitations: "Long losing streaks in chop. Needs position sizing.",
    typicalSettings: "20 / 10",
  },
  "Keltner Channels": {
    formula: "Middle = EMA(n); bands = Middle ± m·ATR",
    howToRead: "ATR-scaled envelope. Closes outside can mark trend thrust; fades toward the EMA in quiet markets.",
    limitations: "Multiplier choice changes everything. Not a volume tool.",
    typicalSettings: "EMA 20, ATR 10 × 2",
  },
  "Historical Volatility": {
    formula: "HV = σ(log returns) · √(periods per year)",
    howToRead: "Realized movement. Rising HV = market has been swinging more. Compare to implied vol for options context.",
    limitations: "Backward-looking. A quiet HV does not forbid a jump tomorrow.",
    typicalSettings: "20-day annualized",
  },
  "Chaikin Volatility": {
    formula: "ROC of EMA(H−L)  (how fast the range itself is changing)",
    howToRead: "Rising Chaikin vol = expanding high-low ranges; falling = compressing ranges (often before a break).",
    limitations: "No direction. Range ≠ volume.",
    typicalSettings: "EMA 10, ROC 10",
  },
  "OBV (On Balance Volume)": {
    formula: "OBV_t = OBV_{t-1} + V  if C↑;  −V if C↓;  0 if unchanged",
    howToRead: "Rising OBV with rising price confirms. Price up / OBV flat or down is a divergence warning.",
    limitations: "Uses all volume on the close direction — crude. Needs clean volume data.",
    typicalSettings: "Cumulative; optional SMA smooth",
  },
  "Volume Weighted Average Price (VWAP)": {
    formula: "VWAP = Σ(TP·V) / Σ(V) from session open (TP=(H+L+C)/3)",
    howToRead: "Intraday institutional benchmark. Price above VWAP = buyers paying up vs the average print; below = selling below average.",
    limitations: "Resets each session. Not a daily/weekly trend MA unless you use anchored VWAP.",
    typicalSettings: "Session VWAP; bands optional ±σ",
  },
  "Accumulation/Distribution Line": {
    formula: "MFM = ((C−L)−(H−C))/(H−L); AD = Σ(MFM·V)",
    howToRead: "Closes near highs add volume; near lows subtract. Divergence with price flags flow disagreement.",
    limitations: "Uses H-L location, not true bid/ask aggression. Gaps can distort.",
    typicalSettings: "Cumulative",
  },
  "Chaikin Money Flow": {
    formula: "CMF_n = Σ(MFM·V) / Σ(V) over n",
    howToRead: "Positive CMF = buying pressure over the window; negative = selling pressure. Zero-line is the balance point.",
    limitations: "Window length changes sign often. Needs volume.",
    typicalSettings: "20 or 21",
  },
  "Money Flow Index": {
    formula: "Typical price money flow RSI: MFI = 100 − 100/(1 + positive MF / negative MF)",
    howToRead: "Volume-weighted RSI. 80/20 style extremes; divergences include participation, not just price.",
    limitations: "Still pins in trends. Bad volume feeds ruin it.",
    typicalSettings: "14",
  },
  "Elder Force Index": {
    formula: "FI = (C_t − C_{t-1}) · V; then EMA(FI, n)",
    howToRead: "Zero-line shows whether bulls or bears had force. Divergences and EMA slope are the reads.",
    limitations: "A single huge bar dominates. Needs volume.",
    typicalSettings: "EMA 13 (or 2 for ticks)",
  },
  "Force Index": {
    formula: "FI = ΔClose · Volume, usually EMA-smoothed",
    howToRead: "Same family as Elder Force Index — force of the move, not just direction.",
    limitations: "Spike-sensitive. Not a trend overlay by itself.",
    typicalSettings: "13",
  },
  "Ease of Movement": {
    formula: "EMV = (mid_t − mid_{t-1}) / (V / (H−L)); often SMA-smoothed",
    howToRead: "High EMV = price advanced easily on light volume; low/negative = heavy work to move.",
    limitations: "Division by range/volume can explode on tiny bars.",
    typicalSettings: "14 SMA of EMV",
  },
  Volume: {
    formula: "V_t = traded units in the bar (exchange-reported)",
    howToRead: "Rising volume on a directional close confirms participation. Dry-up can precede breaks; climax spikes can mark exhaustion.",
    limitations: "FX spot volume is often tick volume, not true notional. Compare like-with-like.",
    typicalSettings: "Raw + 20 SMA of volume",
  },
  "Net Volume": {
    formula: "Net = up-volume − down-volume (or close-direction signed volume) for the bar",
    howToRead: "Positive net volume = more volume on up ticks/closes. Useful as a per-bar flow pulse.",
    limitations: "Definition varies by vendor. Not true order-flow delta unless the feed is bid/ask signed.",
    typicalSettings: "Per bar; optional cumulative",
  },
  "Volume Oscillator": {
    formula: "VO = SMA(V, short) − SMA(V, long)  (or percent form)",
    howToRead: "Positive VO = short-term participation above the longer baseline — a surge. Negative = quiet tape.",
    limitations: "No price direction. Surges happen on both panics and breakouts.",
    typicalSettings: "5 / 20",
  },
  "Commitment of Traders (COT)": {
    formula: "Net commercial = commercial long − commercial short. Net large (non-commercial) = noncommercial long − noncommercial short. Held as a weekly step until the next CFTC print.",
    howToRead: "Green commercials vs red large specs. Extremes and divergences versus price are positioning context, not a trade signal. The forming bar is blank by default (incomplete week).",
    limitations: "Weekly CFTC lag. Only futures with a mapped contract. Unmapped symbols and missing FMP keys stay DATA UNAVAILABLE — never invented.",
    typicalSettings: "Legacy CFTC; hide current week on; both nets plotted",
  },
};

function defaultGuide(name: string, category: string, liveAbbr: string | null): IndicatorGuide {
  const overlay = liveAbbr
    ? ` When a live overlay exists, ClearPath charts can plot ${liveAbbr}.`
    : " This entry is a study card — not every encyclopedia model has a live chart overlay.";
  return {
    formula: `${name} is computed from price, volume, breadth, or macro prints depending on class (${category}). See the description for the defining inputs.`,
    howToRead: `Read ${name} as a labeling tool: it describes a condition (trend, stretch, participation, or macro). Confirm with price structure, not the indicator alone.${overlay}`,
    limitations: `${name} can lag, repaint (some drawings), or stay extreme in trends. It is not financial advice and not a broker signal.`,
    typicalSettings: "Use the author's original defaults first; change one parameter at a time.",
  };
}

export function getIndicatorGuide(
  name: string,
  category: string,
  liveAbbr: string | null
): IndicatorGuide {
  return LIVE_GUIDES[name] || defaultGuide(name, category, liveAbbr);
}
