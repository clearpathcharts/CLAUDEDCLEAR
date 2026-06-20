import { calculateEMA } from "../../indicators/trend/EMA";
import { calculateSMA } from "../../indicators/trend/SMA";
import { calculateIchimoku } from "../../indicators/trend/IchimokuCloud";
import { calculateRSI } from "../../indicators/momentum/RSI";
import { calculateMACD } from "../../indicators/momentum/MACD";
import { calculateATR } from "../../indicators/volatility/ATR";
import { calculateBollingerBands } from "../../indicators/volatility/BollingerBands";
import { calculateVWAP } from "../../indicators/volume/VWAP";
import { calculateOBV } from "../../indicators/volume/OBV";
import { calculateADX } from "../../indicators/trend/ADX";

export const IndicatorBank: Record<string, Function> = {
  EMA: calculateEMA,
  SMA: calculateSMA,
  ICHIMOKU: calculateIchimoku,
  RSI: calculateRSI,
  MACD: calculateMACD,
  ATR: calculateATR,
  BB: calculateBollingerBands,
  VWAP: calculateVWAP,
  OBV: calculateOBV,
  ADX: calculateADX
};
