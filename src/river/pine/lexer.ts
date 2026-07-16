// /src/river/pine/lexer.ts
//
// The River's Pine Script lexer (tokenizer). Turns raw Pine Script v4/v5/v6
// source text into a token stream the parser can consume.
//
// Pine is indentation-scoped like Python, so beyond classic tokens this lexer
// emits synthetic NEWLINE / INDENT / DEDENT tokens. It also handles the two
// ways Pine lets a logical line span physical lines:
//   1. Inside unclosed ( or [ brackets, newlines are ignored.
//   2. A line whose previous line ended with a binary operator, comma,
//      assignment, '?' , ':' or '=>' is treated as a continuation.

import { Token, TokenType, KEYWORDS, PineError } from "./tokens";

export interface LexResult {
  tokens: Token[];
  /** Declared //@version (4, 5, 6, ...). Defaults to 5 when not declared. */
  version: number;
}

const CONTINUATION_ENDINGS = new Set<TokenType>([
  TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH, TokenType.PERCENT,
  TokenType.ASSIGN, TokenType.REASSIGN,
  TokenType.PLUS_ASSIGN, TokenType.MINUS_ASSIGN, TokenType.STAR_ASSIGN, TokenType.SLASH_ASSIGN,
  TokenType.EQ, TokenType.NEQ, TokenType.LT, TokenType.LTE, TokenType.GT, TokenType.GTE,
  TokenType.AND, TokenType.OR, TokenType.NOT,
  TokenType.COMMA, TokenType.QUESTION, TokenType.COLON,
  TokenType.LPAREN, TokenType.LBRACKET, TokenType.DOT,
]);
// Note: ARROW (`=>`) is intentionally excluded — a newline after `=>` starts the
// function body on the next line, it is NOT a line continuation.

export class PineLexer {
  private src: string;
  private pos = 0;
  private line = 1;
  private col = 1;
  private tokens: Token[] = [];
  private bracketDepth = 0;
  private indentStack: number[] = [0];
  private version = 5;

  constructor(source: string) {
    // Normalize line endings so \r never leaks into tokens.
    this.src = source.replace(/\r\n?/g, "\n");
  }

  tokenize(): LexResult {
    this.readVersionAnnotation();

    let atLineStart = true;

    while (!this.isAtEnd()) {
      if (atLineStart && this.bracketDepth === 0) {
        atLineStart = false;
        const consumed = this.handleIndentation();
        if (consumed) { atLineStart = true; continue; }
      }

      const c = this.peek();

      if (c === "\n") {
        this.advance();
        if (this.bracketDepth > 0 || this.lastTokenIsContinuation()) {
          // Logical line continues — swallow the newline entirely.
          atLineStart = this.bracketDepth === 0;
          continue;
        }
        this.pushSimple(TokenType.NEWLINE, "\\n");
        atLineStart = true;
        continue;
      }

      if (c === " " || c === "\t") { this.advance(); continue; }

      if (c === "/" && this.peek(1) === "/") { this.skipComment(); continue; }

      this.scanToken();
    }

    // Close any open blocks at EOF.
    if (this.lastToken()?.type !== TokenType.NEWLINE && this.tokens.length > 0) {
      this.pushSimple(TokenType.NEWLINE, "\\n");
    }
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.pushSimple(TokenType.DEDENT, "");
    }
    this.pushSimple(TokenType.EOF, "");

    return { tokens: this.tokens, version: this.version };
  }

  // ---------------------------------------------------------------- helpers

  private readVersionAnnotation() {
    const m = this.src.match(/^\s*\/\/@version\s*=\s*(\d+)/m);
    if (m) this.version = parseInt(m[1], 10);
  }

  /**
   * At the start of a physical line: measure leading whitespace and emit
   * INDENT/DEDENT tokens. Returns true if the whole line was blank/comment
   * (in which case indentation must NOT change block structure).
   */
  private handleIndentation(): boolean {
    let width = 0;
    let i = this.pos;
    while (i < this.src.length && (this.src[i] === " " || this.src[i] === "\t")) {
      width += this.src[i] === "\t" ? 4 : 1;
      i++;
    }

    // Blank line or comment-only line: consume it without touching indents.
    if (i >= this.src.length) { this.pos = i; return false; }
    if (this.src[i] === "\n") {
      this.pos = i + 1;
      this.line++; this.col = 1;
      return true;
    }
    if (this.src[i] === "/" && this.src[i + 1] === "/") {
      while (i < this.src.length && this.src[i] !== "\n") i++;
      if (i < this.src.length) { i++; this.line++; }
      this.pos = i; this.col = 1;
      return true;
    }

    // Continuation lines keep the previous logical line going; their odd
    // indentation (Pine wraps must not align to the block grid) is ignored.
    if (this.lastTokenIsContinuation()) {
      this.col += i - this.pos;
      this.pos = i;
      return false;
    }

    this.col += i - this.pos;
    this.pos = i;

    const current = this.indentStack[this.indentStack.length - 1];
    if (width > current) {
      this.indentStack.push(width);
      this.pushSimple(TokenType.INDENT, "");
    } else if (width < current) {
      while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > width) {
        this.indentStack.pop();
        this.pushSimple(TokenType.DEDENT, "");
      }
      if (this.indentStack[this.indentStack.length - 1] !== width) {
        // Tolerate slightly inconsistent dedents (common in hand-edited scripts).
        this.indentStack.push(width);
      }
    }
    return false;
  }

  private lastToken(): Token | undefined {
    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const t = this.tokens[i];
      if (t.type !== TokenType.NEWLINE && t.type !== TokenType.INDENT && t.type !== TokenType.DEDENT) return t;
      if (t.type === TokenType.NEWLINE) return t;
    }
    return undefined;
  }

  private lastTokenIsContinuation(): boolean {
    const t = this.lastToken();
    return !!t && CONTINUATION_ENDINGS.has(t.type);
  }

  private skipComment() {
    while (!this.isAtEnd() && this.peek() !== "\n") this.advance();
  }

  private scanToken() {
    const startLine = this.line;
    const startCol = this.col;
    const c = this.advance();

    switch (c) {
      case "(": this.bracketDepth++; return this.push(TokenType.LPAREN, c, startLine, startCol);
      case ")": this.bracketDepth = Math.max(0, this.bracketDepth - 1); return this.push(TokenType.RPAREN, c, startLine, startCol);
      case "[": this.bracketDepth++; return this.push(TokenType.LBRACKET, c, startLine, startCol);
      case "]": this.bracketDepth = Math.max(0, this.bracketDepth - 1); return this.push(TokenType.RBRACKET, c, startLine, startCol);
      case ",": return this.push(TokenType.COMMA, c, startLine, startCol);
      case ".": return this.push(TokenType.DOT, c, startLine, startCol);
      case "?": return this.push(TokenType.QUESTION, c, startLine, startCol);
      case "%": return this.push(TokenType.PERCENT, c, startLine, startCol);
      case "+":
        if (this.match("=")) return this.push(TokenType.PLUS_ASSIGN, "+=", startLine, startCol);
        return this.push(TokenType.PLUS, c, startLine, startCol);
      case "-":
        if (this.match("=")) return this.push(TokenType.MINUS_ASSIGN, "-=", startLine, startCol);
        return this.push(TokenType.MINUS, c, startLine, startCol);
      case "*":
        if (this.match("=")) return this.push(TokenType.STAR_ASSIGN, "*=", startLine, startCol);
        return this.push(TokenType.STAR, c, startLine, startCol);
      case "/":
        if (this.match("=")) return this.push(TokenType.SLASH_ASSIGN, "/=", startLine, startCol);
        return this.push(TokenType.SLASH, c, startLine, startCol);
      case ":":
        if (this.match("=")) return this.push(TokenType.REASSIGN, ":=", startLine, startCol);
        return this.push(TokenType.COLON, c, startLine, startCol);
      case "=":
        if (this.match("=")) return this.push(TokenType.EQ, "==", startLine, startCol);
        if (this.match(">")) return this.push(TokenType.ARROW, "=>", startLine, startCol);
        return this.push(TokenType.ASSIGN, c, startLine, startCol);
      case "!":
        if (this.match("=")) return this.push(TokenType.NEQ, "!=", startLine, startCol);
        throw new PineError(`Unexpected character '!' (did you mean '!=' or 'not'?)`, startLine, startCol);
      case "<":
        if (this.match("=")) return this.push(TokenType.LTE, "<=", startLine, startCol);
        return this.push(TokenType.LT, c, startLine, startCol);
      case ">":
        if (this.match("=")) return this.push(TokenType.GTE, ">=", startLine, startCol);
        return this.push(TokenType.GT, c, startLine, startCol);
      case '"':
      case "'":
        return this.scanString(c, startLine, startCol);
      case "#":
        return this.scanColor(startLine, startCol);
    }

    if (this.isDigit(c)) return this.scanNumber(startLine, startCol);
    if (this.isIdentStart(c)) return this.scanIdent(startLine, startCol);

    throw new PineError(`Unexpected character '${c}'`, startLine, startCol);
  }

  private scanString(quote: string, line: number, col: number) {
    let value = "";
    while (!this.isAtEnd() && this.peek() !== quote && this.peek() !== "\n") {
      if (this.peek() === "\\" && this.peek(1) === quote) { this.advance(); value += this.advance(); continue; }
      value += this.advance();
    }
    if (this.isAtEnd() || this.peek() === "\n") {
      throw new PineError(`Unterminated string`, line, col);
    }
    this.advance(); // closing quote
    this.push(TokenType.STRING, `${quote}${value}${quote}`, line, col, value);
  }

  private scanColor(line: number, col: number) {
    let hex = "";
    while (!this.isAtEnd() && /[0-9a-fA-F]/.test(this.peek())) hex += this.advance();
    if (hex.length !== 6 && hex.length !== 8) {
      throw new PineError(`Invalid color literal '#${hex}' (expected #RRGGBB or #RRGGBBAA)`, line, col);
    }
    this.push(TokenType.COLOR_LITERAL, `#${hex}`, line, col, `#${hex}`);
  }

  private scanNumber(line: number, col: number) {
    let start = this.pos - 1;
    while (!this.isAtEnd() && this.isDigit(this.peek())) this.advance();
    if (this.peek() === "." && this.isDigit(this.peek(1))) {
      this.advance();
      while (!this.isAtEnd() && this.isDigit(this.peek())) this.advance();
    }
    // Scientific notation: 1e5, 2.5e-3
    if ((this.peek() === "e" || this.peek() === "E") && (this.isDigit(this.peek(1)) || ((this.peek(1) === "+" || this.peek(1) === "-") && this.isDigit(this.peek(2))))) {
      this.advance();
      if (this.peek() === "+" || this.peek() === "-") this.advance();
      while (!this.isAtEnd() && this.isDigit(this.peek())) this.advance();
    }
    const lexeme = this.src.slice(start, this.pos);
    this.push(TokenType.NUMBER, lexeme, line, col, parseFloat(lexeme));
  }

  private scanIdent(line: number, col: number) {
    let start = this.pos - 1;
    while (!this.isAtEnd() && this.isIdentPart(this.peek())) this.advance();
    const lexeme = this.src.slice(start, this.pos);
    const kw = KEYWORDS[lexeme];
    this.push(kw ?? TokenType.IDENT, lexeme, line, col);
  }

  // ------------------------------------------------------------- primitives

  private isAtEnd(): boolean { return this.pos >= this.src.length; }

  private peek(ahead = 0): string { return this.src[this.pos + ahead] ?? "\0"; }

  private advance(): string {
    const c = this.src[this.pos++];
    if (c === "\n") { this.line++; this.col = 1; } else { this.col++; }
    return c;
  }

  private match(expected: string): boolean {
    if (this.peek() !== expected) return false;
    this.advance();
    return true;
  }

  private isDigit(c: string): boolean { return c >= "0" && c <= "9"; }
  private isIdentStart(c: string): boolean { return /[a-zA-Z_]/.test(c); }
  private isIdentPart(c: string): boolean { return /[a-zA-Z0-9_]/.test(c); }

  private push(type: TokenType, lexeme: string, line: number, col: number, literal?: number | string) {
    this.tokens.push({ type, lexeme, literal, line, col });
  }

  private pushSimple(type: TokenType, lexeme: string) {
    this.tokens.push({ type, lexeme, line: this.line, col: this.col });
  }
}

export function tokenizePine(source: string): LexResult {
  return new PineLexer(source).tokenize();
}
