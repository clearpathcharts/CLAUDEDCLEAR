// The River Pine compile pipeline — layers 1 + 2 entry point.

import { PineProgram, PineStmt, PineExpr, PineAssignStmt } from './ast';
import { lexPineScript } from './lexer';
import { parsePineTokens } from './parser';
import { PineLexResult } from './token';

export interface PineCompileSummary {
  version: number | null;
  declarationCount: number;
  assignmentCount: number;
  reassignmentCount: number;
  topLevelCalls: string[];
  indicatorTitle: string | null;
  inputBindings: Record<string, number | boolean>;
  hasAtrCall: boolean;
  hasCrossoverCall: boolean;
  hasPlotshape: boolean;
  hasBarcolor: boolean;
  hasGoldBarPattern: boolean;
}

export interface PineCompileResult {
  lex: PineLexResult;
  program: PineProgram | null;
  errors: string[];
  summary: PineCompileSummary | null;
}

function callName(expr: PineExpr): string | null {
  if (expr.kind === 'Call') {
    if (expr.callee.kind === 'Var') return expr.callee.name;
    if (expr.callee.kind === 'Member') return `${callName(expr.callee.object) ?? '?'}.${expr.callee.property}`;
  }
  return null;
}

function memberPath(expr: PineExpr): string | null {
  if (expr.kind === 'Var') return expr.name;
  if (expr.kind === 'Member') {
    const base = memberPath(expr.object);
    return base ? `${base}.${expr.property}` : expr.property;
  }
  return null;
}

function walkCalls(expr: PineExpr, out: string[]): void {
  if (expr.kind === 'Call') {
    const name = memberPath(expr.callee) ?? callName(expr.callee);
    if (name) out.push(name);
    for (const arg of expr.args) walkCalls(arg.value, out);
  }
  if (expr.kind === 'Binary' || expr.kind === 'Logical') {
    walkCalls(expr.left, out);
    walkCalls(expr.right, out);
  }
  if (expr.kind === 'Unary') walkCalls(expr.operand, out);
  if (expr.kind === 'Ternary') {
    walkCalls(expr.condition, out);
    walkCalls(expr.consequent, out);
    walkCalls(expr.alternate, out);
  }
  if (expr.kind === 'Index') {
    walkCalls(expr.object, out);
    walkCalls(expr.index, out);
  }
  if (expr.kind === 'Member') walkCalls(expr.object, out);
  if (expr.kind === 'Grouping') walkCalls(expr.expression, out);
}

function literalValue(expr: PineExpr): number | boolean | null {
  if (expr.kind === 'Number') return expr.value;
  if (expr.kind === 'Bool') return expr.value;
  return null;
}

function summarize(program: PineProgram): PineCompileSummary {
  const topLevelCalls: string[] = [];
  const inputBindings: Record<string, number | boolean> = {};
  let assignmentCount = 0;
  let reassignmentCount = 0;
  let indicatorTitle: string | null = null;
  const allCalls: string[] = [];

  for (const decl of program.declarations) {
    if (decl.kind === 'IndicatorDecl') {
      const titleArg = decl.args.find((a) => a.name === undefined && a.value.kind === 'String');
      if (titleArg && titleArg.value.kind === 'String') indicatorTitle = titleArg.value.value;
      for (const arg of decl.args) walkCalls(arg.value, allCalls);
    }

    if (decl.kind === 'Assign') {
      assignmentCount++;
      if (decl.operator === ':=') reassignmentCount++;
      const lit = literalValue(decl.value);
      if (lit !== null && ['a', 'c', 'h'].includes(decl.name)) {
        inputBindings[decl.name] = lit;
      }
      walkCalls(decl.value, allCalls);
    }

    if (decl.kind === 'ExprStmt') {
      const name = callName(decl.expression);
      if (name) topLevelCalls.push(name);
      walkCalls(decl.expression, allCalls);
    }
  }

  const hasAtrCall = allCalls.some((c) => c === 'ta.atr' || c.endsWith('.atr'));
  const hasCrossoverCall = allCalls.some((c) => c === 'ta.crossover');
  const hasPlotshape = topLevelCalls.includes('plotshape');
  const hasBarcolor = topLevelCalls.includes('barcolor');
  const hasTrailingStop = program.declarations.some(
    (d) => d.kind === 'Assign' && /trailingstop/i.test(d.name),
  );

  return {
    version: program.version,
    declarationCount: program.declarations.length,
    assignmentCount,
    reassignmentCount,
    topLevelCalls,
    indicatorTitle,
    inputBindings,
    hasAtrCall,
    hasCrossoverCall,
    hasPlotshape,
    hasBarcolor,
    hasGoldBarPattern: hasAtrCall && hasCrossoverCall && hasTrailingStop && hasBarcolor,
  };
}

export function compilePineScript(source: string): PineCompileResult {
  const lex = lexPineScript(source);
  const errors: string[] = lex.errors.map((e) => `Lexer line ${e.line}: ${e.message}`);

  if (lex.errors.length > 0) {
    return { lex, program: null, errors, summary: null };
  }

  const parseResult = parsePineTokens(lex.tokens, lex.version);
  errors.push(...parseResult.errors.map((e) => `Parser line ${e.line}: ${e.message}`));

  if (!parseResult.program || parseResult.errors.length > 0) {
    return { lex, program: null, errors, summary: null };
  }

  return {
    lex,
    program: parseResult.program,
    errors,
    summary: summarize(parseResult.program),
  };
}

export function goldBarParamsFromCompile(summary: PineCompileSummary) {
  return {
    sensitivity: typeof summary.inputBindings.a === 'number' ? summary.inputBindings.a : 1,
    atrPeriod: typeof summary.inputBindings.c === 'number' ? summary.inputBindings.c : 10,
    useHeikinAshi: summary.inputBindings.h === true,
  };
}

export function getAssignments(program: PineProgram): PineAssignStmt[] {
  return program.declarations.filter((d): d is PineAssignStmt => d.kind === 'Assign');
}

export function getStatements(program: PineProgram): PineStmt[] {
  return program.declarations;
}
