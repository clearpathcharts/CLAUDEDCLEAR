import { InstitutionalRegistry, InstitutionalDefinition } from "../registry/InstitutionalRegistry";

export class InstitutionalBank {
  static getInstitutional(idOrAbbr: string): InstitutionalDefinition | undefined {
    return InstitutionalRegistry.find(
      (inst) => inst.id === idOrAbbr.toLowerCase() || inst.abbr.toUpperCase() === idOrAbbr.toUpperCase()
    );
  }

  static getAll(): InstitutionalDefinition[] {
    return InstitutionalRegistry;
  }

  static getByCategory(category: string): InstitutionalDefinition[] {
    return InstitutionalRegistry.filter((inst) => inst.category === category);
  }
}
