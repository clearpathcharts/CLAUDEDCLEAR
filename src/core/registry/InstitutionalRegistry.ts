import { InstitutionalCategory } from "./CategoryRegistry";

export interface InstitutionalDefinition {
  id: string;
  name: string;
  abbr: string;
  category: InstitutionalCategory;
  description: string;
  sourceFile: string;
}

export const InstitutionalRegistry: InstitutionalDefinition[] = [
  {
    id: "bos",
    name: "Break of Structure",
    abbr: "BOS",
    category: InstitutionalCategory.MarketStructure,
    description: "Confirms trend continuation when prior swing highs or lows are broken with high volume.",
    sourceFile: "institutional/marketstructure/BOS.ts"
  },
  {
    id: "choch",
    name: "Change of Character",
    abbr: "CHOCH",
    category: InstitutionalCategory.MarketStructure,
    description: "Indicates an initial structural trend reversal when current flows break the opposite swing level.",
    sourceFile: "institutional/marketstructure/CHOCH.ts"
  },
  {
    id: "fvg",
    name: "Fair Value Gap",
    abbr: "FVG",
    category: InstitutionalCategory.SmartMoney,
    description: "Detects 3-candle price imbalances where aggressive orders leave inefficiency gaps.",
    sourceFile: "institutional/smartmoney/FairValueGap.ts"
  },
  {
    id: "ob",
    name: "Institutional Order Block",
    abbr: "OB",
    category: InstitutionalCategory.SmartMoney,
    description: "Identifies heavy central bank buy/sell footprints where massive orders were consolidated.",
    sourceFile: "institutional/smartmoney/OrderBlock.ts"
  },
  {
    id: "sweeps",
    name: "Liquidity Sweep Indicator",
    abbr: "SWEEPS",
    category: InstitutionalCategory.Liquidity,
    description: "Highlights when stop-losses are gathered beyond standard support/resistance before reversal.",
    sourceFile: "institutional/liquidity/LiquiditySweep.ts"
  },
  {
    id: "vol_profile",
    name: "Volume Profile Range",
    abbr: "VP",
    category: InstitutionalCategory.Profile,
    description: "Renders horizontal bar charts representing historical trading volume occurred at specific price levels.",
    sourceFile: "institutional/profile/VolumeProfile.ts"
  },
  {
    id: "cum_delta",
    name: "Cumulative Volume Delta (CVD)",
    abbr: "CVD",
    category: InstitutionalCategory.OrderFlow,
    description: "Calculates the dynamic net buy/sell volume pressure on bid and ask order queues.",
    sourceFile: "institutional/orderflow/CumulativeDelta.ts"
  }
];
