// Lightweight, rules-first Pine v4 → v5 text migrator (best-effort, no AST).

export interface PineMigrationResult {
  migrated: string;
  changes: string[];
}

export function suggestPineMigration(source: string): PineMigrationResult {
  let out = source;
  const changes: string[] = [];

  if (!/\/\/@version\s*=\s*\d+/.test(out)) {
    out = `//@version=5\n${out}`;
    changes.push("Inserted //@version=5 header.");
  } else if (/\/\/@version\s*=\s*4/.test(out)) {
    out = out.replace(/\/\/@version\s*=\s*4/, "//@version=5");
    changes.push("Bumped //@version=4 → //@version=5.");
  }

  if (/\bstudy\s*\(/.test(out)) {
    out = out.replace(/\bstudy\s*\(/g, "indicator(");
    changes.push("Renamed study() → indicator().");
  }

  // security() → comment + close fallback (manual review required)
  if (/\bsecurity\s*\(/.test(out)) {
    out = out.replace(
      /\bsecurity\s*\([^)]*\)/g,
      "close /* TODO: security() removed — The River uses chart close */",
    );
    changes.push("Replaced security() calls with close (review manually).");
  }

  if (/\brequest\.security\s*\(/.test(out)) {
    out = out.replace(
      /\brequest\.security\s*\([^)]*\)/g,
      "close /* TODO: request.security removed */",
    );
    changes.push("Replaced request.security() with close (review manually).");
  }

  // Bare tr → ta.tr (word boundary, not ta.tr already)
  out = out.replace(/(?<![\w.])(tr)(?![\w.])/g, (match, _p1, offset, str) => {
    const before = str.slice(Math.max(0, offset - 3), offset);
    if (before.endsWith("ta.")) return match;
    return "ta.tr";
  });
  if (/\bta\.tr\b/.test(out) && /\btr\b/.test(source)) {
    changes.push("Mapped bare tr → ta.tr where detected.");
  }

  return { migrated: out, changes: [...new Set(changes)] };
}
