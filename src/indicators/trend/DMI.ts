import { Candle } from "../../types/indicators";
import { calculateADX, ADXOutput } from "./ADX";

/** DMI exposes +DI / −DI / ADX from the same Wilder engine. */
export function calculateDMI(data: Candle[], period: number = 14): ADXOutput[] {
  return calculateADX(data, period);
}
