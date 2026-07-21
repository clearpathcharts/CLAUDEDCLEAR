// Primary Pine pipeline — full interpreter (any indicator script).
export { tokenizePine, PineLexer, type LexResult } from './lexer';
export { parsePine, PineParser } from './parser';
export { PineInterpreter, type Value } from './interpreter';
export { TokenType, PineError, type Token } from './tokens';
export type {
  Script,
  Stmt,
  Expr,
  Call,
  IfExpr,
  SwitchExpr,
  FunctionDecl,
} from './ast';

// Legacy RIR pipeline — Gold Bar pattern matching + community catalog bytecode.
export {
  compilePineScript,
  goldBarParamsFromCompile,
  getAssignments,
  getStatements,
  type PineCompileResult,
  type PineCompileSummary,
} from '../pine-legacy/compile';
export { lexPineScript } from '../pine-legacy/lexer';
export { parsePineTokens, PineParser as LegacyPineParser } from '../pine-legacy/parser';
export {
  PineTokenType,
  type PineToken,
  type PineLexError,
  type PineLexResult,
} from '../pine-legacy/token';
export type {
  PineProgram,
  PineStmt,
  PineExpr,
  PineAssignStmt,
  PineParseResult,
  PineParseError,
} from '../pine-legacy/ast';
export type { RirProgram, RirLowerResult } from '../rir';
export { lowerPineToRir, rirBytecodeId } from '../rir';
