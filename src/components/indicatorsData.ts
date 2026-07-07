export const INDICATOR_NAMES = [
  "Acceleration Bands", "Accumulation/Distribution Line", "Advance/Decline Line", "Advance-Decline Ratio",
  "ADX (Average Directional Index)", "Alligator Indicator", "Alpha", "Andrews Pitchfork", "Aroon Indicator",
  "Aroon Oscillator", "ATR (Average True Range)", "Average Price", "Average Volume",
  "Balance of Power", "Beta", "Bid-Ask Spread", "Bollinger Bands", "Bollinger Band Width", "Breadth Thrust",
  "Bull Bear Power", "Bull Market Support Band",
  "Camarilla Pivot Points", "Candlestick Pattern Index", "CCI (Commodity Channel Index)", "Center of Gravity",
  "Chaikin Money Flow", "Chaikin Oscillator", "Chande Forecast Oscillator", "Chande Momentum Oscillator",
  "Channel Index", "Closing Price Location Value", "Commitment of Traders (COT)", "Commodity Selection Index",
  "Composite Index", "Connors RSI", "Coppock Curve", "Correlation Coefficient", "Cumulative Delta",
  "Detrended Price Oscillator", "Demand Index", "DeMarker Indicator", "Directional Movement Index (DMI)",
  "Donchian Channels", "Downside Deviation", "DPO",
  "Ease of Movement", "Elder Force Index", "Elder Ray", "Elliott Wave Oscillator", "EMA (Exponential Moving Average)",
  "Envelope Indicator",
  "Fair Value Gap", "Fast Stochastic", "Fibonacci Arcs", "Fibonacci Channels", "Fibonacci Expansion",
  "Fibonacci Fan", "Fibonacci Retracement", "Fisher Transform", "Force Index", "Fractal Indicator",
  "Gann Fan", "Gann Grid", "Gann Square", "Golden Cross", "Gravity Center", "Gross Domestic Product (GDP)",
  "Harmonic Patterns", "Heikin Ashi", "Historical Volatility", "Hull Moving Average",
  "Ichimoku Cloud", "Implied Volatility", "Inflation Rate", "Interest Coverage Ratio", "Interest Rate Differential",
  "Internal Bar Strength",
  "Jurik Moving Average",
  "Kairi Relative Index", "Keltner Channels", "Know Sure Thing (KST)",
  "Lagging Span", "Linear Regression", "Linear Regression Channel", "Liquidity Void", "Local Volatility", "Log Return",
  "MACD", "MACD Histogram", "Market Breadth", "Market Facilitation Index", "Market Profile", "Market Sentiment Index",
  "Mass Index", "McClellan Oscillator", "McClellan Summation Index", "Median Price", "Momentum", "Money Flow Index",
  "Moving Average", "Moving Average Envelope",
  "Nasdaq Advance Decline", "Negative Volume Index", "Net Change", "New High New Low Index", "NFP (Non-Farm Payrolls)",
  "OBV (On Balance Volume)", "Open Interest", "Option Delta", "Option Gamma", "Option Theta", "Option Vega",
  "Oscillator of Moving Average",
  "Parabolic SAR", "Percent B", "Percent Price Oscillator", "Pivot Points", "Positive Volume Index", "PPO",
  "Price Action Channel", "Price Oscillator", "Price Rate of Change", "Price Volume Trend", "Put Call Ratio",
  "Qstick Indicator", "Quadrant Lines",
  "Rate of Change", "Relative Strength Index (RSI)", "Relative Vigor Index", "Renko Trend", "Risk Reward Ratio",
  "ROC", "Rolling Volatility",
  "Schaff Trend Cycle", "Seasonal Index", "Sharpe Ratio", "Slow Stochastic", "SMA (Simple Moving Average)",
  "Smoothed Moving Average", "Sortino Ratio", "Spread Indicator", "Standard Deviation", "Standard Error",
  "Stochastic Momentum Index", "Stochastic RSI", "SuperTrend", "Support and Resistance", "Swing Index",
  "T3 Moving Average", "TEMA", "Tick Index", "Time Segmented Volume", "TRIN (Arms Index)", "Triple EMA",
  "Triple Top Bottom", "True Strength Index", "Turtle Channels",
  "Ulcer Index", "Ultimate Oscillator", "Unemployment Rate", "Upside Downside Ratio",
  "Value Area", "Variable Moving Average", "Vertical Horizontal Filter", "VIX", "Volume", "Volume Delta",
  "Volume Oscillator", "Volume Profile", "Volume Rate of Change", "Volume Weighted Average Price (VWAP)",
  "Vortex Indicator",
  "Weighted Moving Average", "Williams %R", "Williams Accumulation Distribution", "Wolfe Waves",
  "XTL Trend Indicator",
  "Yield Curve", "Yield Spread",
  "Zig Zag Indicator", "Z-Score", "Zero Lag EMA", "Zero Line Cross", "ZLEMA"
];

const FUNDAMENTAL = new Set([
  "Gross Domestic Product (GDP)",
  "Unemployment Rate",
  "NFP (Non-Farm Payrolls)",
  "Inflation Rate",
  "Interest Coverage Ratio",
  "Interest Rate Differential",
  "Yield Curve",
  "Yield Spread",
  "Alpha",
  "Beta",
  "Sharpe Ratio",
  "Sortino Ratio",
]);

export function buildIndicators() {
  const tagPool = ["volatility", "volume", "institutional", "retail", "high-frequency", "oscillator", "overlay", "momentum"];

  const items = [];
  for (let i = 0; i < INDICATOR_NAMES.length; i++) {
    const name = INDICATOR_NAMES[i];
    const isFundamental = FUNDAMENTAL.has(name);
    const category = isFundamental ? "Fundamental" : "Technical";
    
    const hasVideo = i % 5 === 0;
    const videoUrl = hasVideo ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" : null;
    
    let complexity = Math.round(2 + ((i * 13) % 18) / 10);
    if(complexity > 5) complexity = 5;
    if(complexity < 1) complexity = 1;

    const tags = [
      isFundamental ? "macro" : tagPool[i % tagPool.length],
      isFundamental ? "economic" : tagPool[(i + 3) % tagPool.length],
      category.toLowerCase()
    ];

    items.push({
      id: `ind${i + 1}`,
      name: name,
      description: isFundamental ? `Macro-economic or fundamental indicator for ${name.toLowerCase()}` : `Technical analysis model measuring the ${name.toLowerCase()}`,
      category,
      complexity,
      hasVideo,
      tags,
      videoUrl
    });
  }
  return items;
}
