// Pine Script v5 lexer — Layer 1 of The River compiler.
// Turns raw Pine source into an honest token stream. No parsing, no faking.

import {
  PineLexError,
  PineLexResult,
  PineToken,
  PineTokenType,
} from './token';

const KEYWORDS: Record<string, PineTokenType> = {
  indicator: PineTokenType.INDICATOR,
  strategy: PineTokenType.STRATEGY,
  library: PineTokenType.LIBRARY,
  true: PineTokenType.TRUE,
  false: PineTokenType.FALSE,
  and: PineTokenType.AND,
  or: PineTokenType.OR,
  not: PineTokenType.NOT,
  na: PineTokenType.NA,
  if: PineTokenType.IF,
  else: PineTokenType.ELSE,
  for: PineTokenType.FOR,
  while: PineTokenType.WHILE,
  var: PineTokenType.VAR,
  varip: PineTokenType.VARIP,
  import: PineTokenType.IMPORT,
  export: PineTokenType.EXPORT,
};

const SIGNIFICANT = new Set<PineTokenType>([
  PineTokenType.NUMBER,
  PineTokenType.STRING,
  PineTokenType.IDENTIFIER,
  PineTokenType.INDICATOR,
  PineTokenType.STRATEGY,
  PineTokenType.LIBRARY,
  PineTokenType.TRUE,
  PineTokenType.FALSE,
  PineTokenType.AND,
  PineTokenType.OR,
  PineTokenType.NOT,
  PineTokenType.NA,
  PineTokenType.IF,
  PineTokenType.ELSE,
  PineTokenType.FOR,
  PineTokenType.WHILE,
  PineTokenType.VAR,
  PineTokenType.VARIP,
  PineTokenType.IMPORT,
  PineTokenType.EXPORT,
  PineTokenType.COLON_ASSIGN,
  PineTokenType.EQUAL,
  PineTokenType.EQUAL_EQUAL,
  PineTokenType.BANG_EQUAL,
  PineTokenType.GREATER,
  PineTokenType.GREATER_EQUAL,
  PineTokenType.LESS,
  PineTokenType.LESS_EQUAL,
  PineTokenType.PLUS,
  PineTokenType.MINUS,
  PineTokenType.STAR,
  PineTokenType.SLASH,
  PineTokenType.PERCENT,
  PineTokenType.QUESTION,
  PineTokenType.COLON,
  PineTokenType.BANG,
  PineTokenType.LEFT_PAREN,
  PineTokenType.RIGHT_PAREN,
  PineTokenType.LEFT_BRACKET,
  PineTokenType.RIGHT_BRACKET,
  PineTokenType.COMMA,
  PineTokenType.DOT,
  PineTokenType.SEMICOLON,
  PineTokenType.VERSION,
]);

export class PineLexer {
  private readonly source: string;
  private readonly tokens: PineToken[] = [];
  private readonly errors: PineLexError[] = [];
  private start = 0;
  private startLine = 1;
  private startColumn = 1;
  private current = 0;
  private line = 1;
  private column = 1;
  private version: number | null = null;

  constructor(source: string) {
    this.source = source;
  }

  scan(): PineLexResult {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startLine = this.line;
      this.startColumn = this.column;
      this.scanToken();
    }

    this.tokens.push(this.makeToken(PineTokenType.EOF, '', null));

    const significantTokenCount = this.tokens.filter((t) => SIGNIFICANT.has(t.type)).length;

    return {
      tokens: this.tokens,
      errors: this.errors,
      version: this.version,
      significantTokenCount,
    };
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      case '(':
        this.addToken(PineTokenType.LEFT_PAREN);
        break;
      case ')':
        this.addToken(PineTokenType.RIGHT_PAREN);
        break;
      case '[':
        this.addToken(PineTokenType.LEFT_BRACKET);
        break;
      case ']':
        this.addToken(PineTokenType.RIGHT_BRACKET);
        break;
      case ',':
        this.addToken(PineTokenType.COMMA);
        break;
      case '.':
        this.addToken(PineTokenType.DOT);
        break;
      case ';':
        this.addToken(PineTokenType.SEMICOLON);
        break;
      case '+':
        this.addToken(PineTokenType.PLUS);
        break;
      case '*':
        this.addToken(PineTokenType.STAR);
        break;
      case '%':
        this.addToken(PineTokenType.PERCENT);
        break;
      case '?':
        this.addToken(PineTokenType.QUESTION);
        break;
      case ':':
        if (this.match('=')) {
          this.addToken(PineTokenType.COLON_ASSIGN);
        } else {
          this.addToken(PineTokenType.COLON);
        }
        break;
      case '-':
        this.addToken(PineTokenType.MINUS);
        break;
      case '/':
        if (this.match('/')) {
          this.lineComment();
        } else {
          this.addToken(PineTokenType.SLASH);
        }
        break;
      case '=':
        if (this.match('=')) {
          this.addToken(PineTokenType.EQUAL_EQUAL);
        } else {
          this.addToken(PineTokenType.EQUAL);
        }
        break;
      case '!':
        if (this.match('=')) {
          this.addToken(PineTokenType.BANG_EQUAL);
        } else {
          this.addToken(PineTokenType.BANG);
        }
        break;
      case '>':
        this.addToken(this.match('=') ? PineTokenType.GREATER_EQUAL : PineTokenType.GREATER);
        break;
      case '<':
        this.addToken(this.match('=') ? PineTokenType.LESS_EQUAL : PineTokenType.LESS);
        break;
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        this.addToken(PineTokenType.NEWLINE, '\n');
        this.line++;
        this.column = 1;
        break;
      case '"':
      case "'":
        this.string(c);
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          this.error(`Unexpected character '${c}'.`);
        }
        break;
    }
  }

  private lineComment(): void {
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }
    const text = this.source.slice(this.start, this.current);

    const versionMatch = /^\/\/@version\s*=\s*(\d+)/.exec(text);
    if (versionMatch) {
      this.version = parseInt(versionMatch[1], 10);
      this.tokens.push({
        type: PineTokenType.VERSION,
        lexeme: text,
        literal: this.version,
        line: this.startLine,
        column: this.startColumn,
      });
    } else {
      this.tokens.push({
        type: PineTokenType.COMMENT,
        lexeme: text,
        literal: null,
        line: this.startLine,
        column: this.startColumn,
      });
    }
  }

  private string(quote: string): void {
    const startLine = this.startLine;
    const startColumn = this.startColumn;

    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      this.errors.push({
        message: 'Unterminated string literal.',
        line: startLine,
        column: startColumn,
      });
      return;
    }

    this.advance(); // closing quote
    const value = this.source.slice(this.start + 1, this.current - 1);
    this.tokens.push({
      type: PineTokenType.STRING,
      lexeme: this.source.slice(this.start, this.current),
      literal: value,
      line: startLine,
      column: startColumn,
    });
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const text = this.source.slice(this.start, this.current);
    this.tokens.push({
      type: PineTokenType.NUMBER,
      lexeme: text,
      literal: parseFloat(text),
      line: this.startLine,
      column: this.startColumn,
    });
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.slice(this.start, this.current);
    const keyword = KEYWORDS[text];
    const type = keyword ?? PineTokenType.IDENTIFIER;

    this.tokens.push({
      type,
      lexeme: text,
      literal: null,
      line: this.startLine,
      column: this.startColumn,
    });
  }

  private error(message: string): void {
    this.errors.push({ message, line: this.line, column: this.column });
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    this.column++;
    return true;
  }

  private advance(): string {
    const c = this.source[this.current++];
    this.column++;
    return c;
  }

  private addToken(type: PineTokenType, lexeme?: string, literal: string | number | boolean | null = null): void {
    const text = lexeme ?? this.source.slice(this.start, this.current);
    this.tokens.push(this.makeToken(type, text, literal));
  }

  private makeToken(
    type: PineTokenType,
    lexeme: string,
    literal: string | number | boolean | null,
  ): PineToken {
    return { type, lexeme, literal, line: this.startLine, column: this.startColumn };
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }
}

/** Public entry point for Layer 1 tokenization. */
export function lexPineScript(source: string): PineLexResult {
  return new PineLexer(source).scan();
}
