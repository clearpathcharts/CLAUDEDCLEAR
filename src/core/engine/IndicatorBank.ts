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
import { calculateWMA } from "../../indicators/trend/WMA";
import { calculateVWMA } from "../../indicators/trend/VWMA";
import { calculateDEMA } from "../../indicators/trend/DEMA";
import { calculateTEMA } from "../../indicators/trend/TEMA";
import { calculateHMA } from "../../indicators/trend/HMA";
import { calculateLRC } from "../../indicators/trend/LRC";
import { calculatePSAR } from "../../indicators/trend/PSAR";
import { calculateSupertrend } from "../../indicators/trend/Supertrend";
import { calculateZigZag } from "../../indicators/trend/ZigZag";
import { calculatePivotPoints } from "../../indicators/trend/PivotPoints";
import { calculateDMI } from "../../indicators/trend/DMI";
import { calculateROC } from "../../indicators/momentum/ROC";
import { calculateCCI } from "../../indicators/momentum/CCI";
import { calculateWilliamsR } from "../../indicators/momentum/WilliamsR";
import { calculateCMO } from "../../indicators/momentum/CMO";
import { calculateDPO } from "../../indicators/momentum/DPO";
import { calculateStochastic } from "../../indicators/momentum/Stochastic";
import { calculateStochRSI } from "../../indicators/momentum/StochRSI";
import { calculatePPO } from "../../indicators/momentum/PPO";
import { calculateAO } from "../../indicators/momentum/AO";
import { calculateRVI } from "../../indicators/momentum/RVI";
import { calculateTRIX } from "../../indicators/momentum/TRIX";
import { calculateTSI } from "../../indicators/momentum/TSI";
import { calculateUO } from "../../indicators/momentum/UltimateOscillator";
import { calculateKST } from "../../indicators/momentum/KST";
import { calculateFisherTransform } from "../../indicators/momentum/FisherTransform";
import { calculateCoppock } from "../../indicators/momentum/Coppock";
import { calculateBBWidth } from "../../indicators/volatility/BBWidth";
import { calculateDonchian } from "../../indicators/volatility/Donchian";
import { calculateKeltner } from "../../indicators/volatility/Keltner";
import { calculateHV } from "../../indicators/volatility/HistoricalVolatility";
import { calculateChaikinVolatility } from "../../indicators/volatility/ChaikinVolatility";
import { calculateADL } from "../../indicators/volume/ADL";
import { calculateCMF } from "../../indicators/volume/CMF";
import { calculateMFI } from "../../indicators/volume/MFI";
import { calculateEFI } from "../../indicators/volume/EFI";
import { calculateEOM } from "../../indicators/volume/EOM";
import {
  calculateVolume,
  calculateNetVolume,
  calculateVolumeOscillator,
} from "../../indicators/volume/Volume";
import { calculateCOT } from "../../indicators/sentiment/COT";

/** All live chart indicators — every key has real math (no placeholders). */
export const IndicatorBank: Record<string, Function> = {
  EMA: calculateEMA,
  SMA: calculateSMA,
  WMA: calculateWMA,
  VWMA: calculateVWMA,
  DEMA: calculateDEMA,
  TEMA: calculateTEMA,
  HMA: calculateHMA,
  LRC: calculateLRC,
  PSAR: calculatePSAR,
  SUPERTREND: calculateSupertrend,
  ZZ: calculateZigZag,
  PIVOT: calculatePivotPoints,
  DMI: calculateDMI,
  ICHIMOKU: calculateIchimoku,
  RSI: calculateRSI,
  MACD: calculateMACD,
  ROC: calculateROC,
  CCI: calculateCCI,
  WPR: calculateWilliamsR,
  CMO: calculateCMO,
  DPO: calculateDPO,
  STOCH: calculateStochastic,
  STOCHRSI: calculateStochRSI,
  PPO: calculatePPO,
  AO: calculateAO,
  RVI: calculateRVI,
  TRIX: calculateTRIX,
  TSI: calculateTSI,
  UO: calculateUO,
  KST: calculateKST,
  FT: calculateFisherTransform,
  CC: calculateCoppock,
  ATR: calculateATR,
  BB: calculateBollingerBands,
  BBW: calculateBBWidth,
  DC: calculateDonchian,
  KC: calculateKeltner,
  HV: calculateHV,
  CHV: calculateChaikinVolatility,
  VWAP: calculateVWAP,
  OBV: calculateOBV,
  AD: calculateADL,
  "A/D": calculateADL,
  CMF: calculateCMF,
  MFI: calculateMFI,
  EFI: calculateEFI,
  EOM: calculateEOM,
  VOL: calculateVolume,
  NETVOL: calculateNetVolume,
  VO: calculateVolumeOscillator,
  ADX: calculateADX,
  COT: calculateCOT,
};
