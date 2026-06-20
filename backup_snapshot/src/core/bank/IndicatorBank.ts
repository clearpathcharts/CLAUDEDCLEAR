import { IndicatorRegistry } from "../registry/IndicatorRegistry";
import { IndicatorDefinition } from "../../types/indicators";

export class IndicatorBank {
  static getIndicator(idOrAbbr: string): IndicatorDefinition | undefined {
    return IndicatorRegistry.find(
      (ind) => ind.id === idOrAbbr.toLowerCase() || ind.abbr.toUpperCase() === idOrAbbr.toUpperCase()
    );
  }

  static getAll(): IndicatorDefinition[] {
    return IndicatorRegistry;
  }

  static getByCategory(category: string): IndicatorDefinition[] {
    return IndicatorRegistry.filter((ind) => ind.category === category);
  }
}
