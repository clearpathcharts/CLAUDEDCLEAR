// Pine Script v5 token vocabulary for The River compiler pipeline.
// Layer 1: Lexer output. The parser (layer 2) consumes these tokens.

export enum PineTokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',

  // Keywords (Pine v5 subset — grows with each supported layer)
  INDICATOR = 'INDICATOR',
  STRATEGY = 'STRATEGY',
  LIBRARY = 'LIBRARY',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  NA = 'NA',
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  WHILE = 'WHILE',
  VAR = 'VAR',
  VARIP = 'VARIP',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',

  // Operators
  COLON_ASSIGN = 'COLON_ASSIGN', // :=
  EQUAL = 'EQUAL',
  EQUAL_EQUAL = 'EQUAL_EQUAL',
  BANG_EQUAL = 'BANG_EQUAL',
  GREATER = 'GREATER',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LESS = 'LESS',
  LESS_EQUAL = 'LESS_EQUAL',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  PERCENT = 'PERCENT',
  QUESTION = 'QUESTION',
  COLON = 'COLON',
  BANG = 'BANG',

  // Punctuation
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACKET = 'LEFT_BRACKET',
  RIGHT_BRACKET = 'RIGHT_BRACKET',
  COMMA = 'COMMA',
  DOT = 'DOT',
  SEMICOLON = 'SEMICOLON',

  // Directives & comments
  VERSION = 'VERSION',
  COMMENT = 'COMMENT',

  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}

export interface PineToken {
  type: PineTokenType;
  lexeme: string;
  literal: string | number | boolean | null;
  line: number;
  column: number;
}

export interface PineLexError {
  message: string;
  line: number;
  column: number;
}

export interface PineLexResult {
  tokens: PineToken[];
  errors: PineLexError[];
  /** Parsed from //@version=N when present */
  version: number | null;
  /** Non-comment, non-whitespace token count */
  significantTokenCount: number;
}
