// src/qubit/index.ts
//
// QUBIT — ClearPath Trader's own indicator language pipeline.
//
// This is the real entry point. Call parseQubit(source) with any
// indicator source code and it runs it through:
//   1. Lexer  — converts raw text into tokens
//   2. Parser — builds an Abstract Syntax Tree from tokens
//
// The resulting AST is the universal intermediate representation
// that The River uses to understand what an indicator is doing,
// regardless of which platform it came from.

import { Lexer } from './lexer/lexer';
import { Parser } from './parser/parser';
import { Stmt } from './parser/ast';

export interface QubitResult {
  success: boolean;
  ast: Stmt[];
  tokenCount: number;
  errors: string[];
}

export function parseQubit(source: string): QubitResult {
  const errors: string[] = [];

  // Step 1: Lex
  let tokens;
  try {
    const lexer = new Lexer(source);
    tokens = lexer.scanTokens();
  } catch (err: any) {
    return {
      success: false,
      ast: [],
      tokenCount: 0,
      errors: [`Lexer error: ${err?.message || 'Unknown error'}`],
    };
  }

  // Step 2: Parse
  let ast: Stmt[] = [];
  try {
    const parser = new Parser(tokens);
    ast = parser.parse();
  } catch (err: any) {
    errors.push(`Parser error: ${err?.message || 'Unknown error'}`);
  }

  return {
    success: errors.length === 0,
    ast,
    tokenCount: tokens.length,
    errors,
  };
}

// Re-export everything so other modules can use Qubit types directly
export * from './lexer/token';
export * from './parser/ast';
