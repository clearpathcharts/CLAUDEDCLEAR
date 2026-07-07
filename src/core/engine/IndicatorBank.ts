import { calculateEMA } from "../../indicators/trend/EMA";
import { calculateSMA } from "../../indicators/trend/SMA";
import { calculateWMA } from "../../indicators/trend/WMA";
import { calculateIchimoku } from "../../indicators/trend/IchimokuCloud";
import { calculateADX } from "../../indicators/trend/ADX";
import { calculateParabolicSAR } from "../../indicators/trend/ParabolicSAR";
import { calculateRSI } from "../../indicators/momentum/RSI";
import { calculateMACD } from "../../indicators/momentum/MACD";
import { calculateStochastic } from "../../indicators/momentum/Stochastic";
import { calculateCCI } from "../../indicators/momentum/CCI";
import { calculateWilliamsR } from "../../indicators/momentum/WilliamsR";
import { calculateROC } from "../../indicators/momentum/ROC";
import { calculateAO } from "../../indicators/momentum/AO";
import { calculateATR } from "../../indicators/volatility/ATR";
import { calculateBollingerBands } from "../../indicators/volatility/BollingerBands";
import { calculateDonchianChannels } from "../../indicators/volatility/DonchianChannels";
import { calculateVWAP } from "../../indicators/volume/VWAP";
import { calculateOBV } from "../../indicators/volume/OBV";
import { calculateMFI } from "../../indicators/volume/MFI";
import { calculateCMF } from "../../indicators/volume/CMF";

export const IndicatorBank: Record<string, Function> = {
  EMA: calculateEMA,
  SMA: calculateSMA,
  WMA: calculateWMA,
  ICHIMOKU: calculateIchimoku,
  ADX: calculateADX,
  PSAR: calculateParabolicSAR,
  RSI: calculateRSI,
  MACD: calculateMACD,
  STOCH: calculateStochastic,
  CCI: calculateCCI,
  WPR: calculateWilliamsR,
  ROC: calculateROC,
  AO: calculateAO,
  ATR: calculateATR,
  BB: calculateBollingerBands,
  DC: calculateDonchianChannels,
  VWAP: calculateVWAP,
  OBV: calculateOBV,
  MFI: calculateMFI,
  CMF: calculateCMF,
};
