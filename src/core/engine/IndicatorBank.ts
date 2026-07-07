import { calculateEMA } from "../../indicators/trend/EMA";
import { calculateSMA } from "../../indicators/trend/SMA";
import { calculateWMA } from "../../indicators/trend/WMA";
import { calculateTEMA } from "../../indicators/trend/TEMA";
import { calculateHMA } from "../../indicators/trend/HMA";
import { calculateSupertrend } from "../../indicators/trend/Supertrend";
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
import { calculateStochRSI } from "../../indicators/momentum/StochRSI";
import { calculateATR } from "../../indicators/volatility/ATR";
import { calculateBollingerBands } from "../../indicators/volatility/BollingerBands";
import { calculateDonchianChannels } from "../../indicators/volatility/DonchianChannels";
import { calculateKeltnerChannels } from "../../indicators/volatility/KeltnerChannels";
import { calculateVWAP } from "../../indicators/volume/VWAP";
import { calculateOBV } from "../../indicators/volume/OBV";
import { calculateMFI } from "../../indicators/volume/MFI";
import { calculateCMF } from "../../indicators/volume/CMF";

export const IndicatorBank: Record<string, Function> = {
  EMA: calculateEMA,
  SMA: calculateSMA,
  WMA: calculateWMA,
  TEMA: calculateTEMA,
  HMA: calculateHMA,
  SUPERTREND: calculateSupertrend,
  ICHIMOKU: calculateIchimoku,
  ADX: calculateADX,
  PSAR: calculateParabolicSAR,
  RSI: calculateRSI,
  MACD: calculateMACD,
  STOCH: calculateStochastic,
  STOCHRSI: calculateStochRSI,
  CCI: calculateCCI,
  WPR: calculateWilliamsR,
  ROC: calculateROC,
  AO: calculateAO,
  ATR: calculateATR,
  BB: calculateBollingerBands,
  DC: calculateDonchianChannels,
  KC: calculateKeltnerChannels,
  VWAP: calculateVWAP,
  OBV: calculateOBV,
  MFI: calculateMFI,
  CMF: calculateCMF,
};
