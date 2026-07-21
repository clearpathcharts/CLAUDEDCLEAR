// QUBIT — ClearPath Trader indicator language pipeline
export { Lexer } from './lexer/lexer';
export { Parser, ParseError } from './parser/parser';
export type { Token, TokenType } from './lexer/token';
export type {
  Expr,
  Stmt,
  BinaryExpr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  VariableExpr,
  AssignExpr,
  LogicalExpr,
  CallExpr,
  ExpressionStmt,
  PrintStmt,
  VarStmt,
  BlockStmt,
  IfStmt,
  WhileStmt,
  FunctionStmt,
  ReturnStmt,
} from './parser/ast';

import { Lexer } from './lexer/lexer';
import { Parser } from './parser/parser';
import type { Stmt } from './parser/ast';

export interface QubitResult {
  ok: boolean;
  statements: Stmt[];
  errors: string[];
}

/** Lex and parse QUBIT source into an AST statement list. */
export function parseQubit(source: string): QubitResult {
  try {
    const tokens = new Lexer(source).scanTokens();
    const statements = new Parser(tokens).parse();
    return { ok: true, statements, errors: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, statements: [], errors: [message] };
  }
}
