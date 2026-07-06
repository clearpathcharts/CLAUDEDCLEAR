// /src/river/pine/tokens.ts
//
// Token definitions for The River's Pine Script front end.
// The lexer produces a flat stream of these tokens, including synthetic
// NEWLINE / INDENT / DEDENT tokens (Pine, like Python, is indentation-scoped).

export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  STRING = "STRING",
  COLOR_LITERAL = "COLOR_LITERAL", // #RRGGBB or #RRGGBBAA
  IDENT = "IDENT",

  // Keywords
  VAR = "VAR",       // var
  VARIP = "VARIP",   // varip
  IF = "IF",
  ELSE = "ELSE",
  FOR = "FOR",
  TO = "TO",
  BY = "BY",
  WHILE = "WHILE",
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
  TRUE = "TRUE",
  FALSE = "FALSE",
  BREAK = "BREAK",
  CONTINUE = "CONTINUE",

  // Operators & punctuation
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",
  PERCENT = "PERCENT",
  ASSIGN = "ASSIGN",           // =
  REASSIGN = "REASSIGN",       // :=
  PLUS_ASSIGN = "PLUS_ASSIGN",   // +=
  MINUS_ASSIGN = "MINUS_ASSIGN", // -=
  STAR_ASSIGN = "STAR_ASSIGN",   // *=
  SLASH_ASSIGN = "SLASH_ASSIGN", // /=
  EQ = "EQ",                   // ==
  NEQ = "NEQ",                 // !=
  LT = "LT",
  LTE = "LTE",
  GT = "GT",
  GTE = "GTE",
  QUESTION = "QUESTION",       // ?
  COLON = "COLON",             // :
  COMMA = "COMMA",
  DOT = "DOT",
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  ARROW = "ARROW",             // =>

  // Layout
  NEWLINE = "NEWLINE",
  INDENT = "INDENT",
  DEDENT = "DEDENT",
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  lexeme: string;
  /** Parsed literal value for NUMBER/STRING/COLOR tokens */
  literal?: number | string;
  line: number;
  col: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  var: TokenType.VAR,
  varip: TokenType.VARIP,
  if: TokenType.IF,
  else: TokenType.ELSE,
  for: TokenType.FOR,
  to: TokenType.TO,
  by: TokenType.BY,
  while: TokenType.WHILE,
  and: TokenType.AND,
  or: TokenType.OR,
  not: TokenType.NOT,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  break: TokenType.BREAK,
  continue: TokenType.CONTINUE,
};

/** Error type carrying source position, surfaced verbatim in The River UI. */
export class PineError extends Error {
  line: number;
  col: number;
  constructor(message: string, line: number, col: number = 0) {
    super(message);
    this.name = "PineError";
    this.line = line;
    this.col = col;
  }
}
