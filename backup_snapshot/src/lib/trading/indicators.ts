export function EMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];

  data.forEach((price, i) => {
    if (i === 0) {
      ema.push(price);
    } else {
      ema.push(price * k + ema[i - 1] * (1 - k));
    }
  });

  return ema;
}

export function RSI_Array(data: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  if (data.length <= period) return new Array(data.length).fill(50);

  for (let i = 0; i < data.length; i++) {
    if (i <= period) {
      rsi.push(50);
      continue;
    }

    let gains = 0;
    let losses = 0;

    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j] - data[j - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    if (losses === 0) {
      rsi.push(100);
    } else {
      const rs = gains / losses;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

export function MACD_Detailed(data: number[]) {
  const ema12 = EMA(data, 12);
  const ema26 = EMA(data, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = EMA(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);

  return { macdLine, signalLine, histogram };
}
