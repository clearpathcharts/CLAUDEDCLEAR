import { FundamentalRegistry, FundamentalDefinition } from "../registry/FundamentalRegistry";

export class FundamentalBank {
  static getFundamental(idOrAbbr: string): FundamentalDefinition | undefined {
    return FundamentalRegistry.find(
      (f) => f.id === idOrAbbr.toLowerCase() || f.abbr.toUpperCase() === idOrAbbr.toUpperCase()
    );
  }

  static getAll(): FundamentalDefinition[] {
    return FundamentalRegistry;
  }

  static getByCategory(category: string): FundamentalDefinition[] {
    return FundamentalRegistry.filter((f) => f.category === category);
  }
}
