// Pine Script v5 parser — Layer 2 of The River compiler.
// Consumes lexer tokens and builds an AST. No execution, no faking.

import {
  PineAssignStmt,
  PineCallArg,
  PineExpr,
  PineParseError,
  PineParseResult,
  PineProgram,
  PineStmt,
} from './ast';
import { PineToken, PineTokenType } from './token';

export class PineParseErrorThrown extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number,
  ) {
    super(message);
    this.name = 'PineParseErrorThrown';
  }
}

export class PineParser {
  private readonly tokens: PineToken[];
  private readonly errors: PineParseError[] = [];
  private current = 0;
  private readonly version: number | null;

  constructor(allTokens: PineToken[], version: number | null) {
    this.version = version;
    this.tokens = allTokens.filter(
      (t) =>
        t.type !== PineTokenType.COMMENT &&
        t.type !== PineTokenType.NEWLINE &&
        t.type !== PineTokenType.VERSION,
    );
  }

  parse(): PineParseResult {
    try {
      const declarations: PineStmt[] = [];
      while (!this.isAtEnd()) {
        const decl = this.declaration();
        if (decl) declarations.push(decl);
      }
      return {
        program: { kind: 'Program', version: this.version, declarations },
        errors: this.errors,
      };
    } catch (err) {
      if (err instanceof PineParseErrorThrown) {
        this.errors.push({ message: err.message, line: err.line, column: err.column });
      } else {
        throw err;
      }
      return { program: null, errors: this.errors };
    }
  }

  private declaration(): PineStmt | null {
    try {
      if (this.match(PineTokenType.INDICATOR)) {
        return this.indicatorDeclaration();
      }

      if (this.check(PineTokenType.IDENTIFIER) && this.isAssignmentAhead()) {
        return this.assignment();
      }

      return this.expressionStatement();
    } catch (err) {
      if (err instanceof PineParseErrorThrown) {
        this.errors.push({ message: err.message, line: err.line, column: err.column });
        this.synchronize();
        return null;
      }
      throw err;
    }
  }

  private indicatorDeclaration(): PineStmt {
    const line = this.previous().line;
    this.consume(PineTokenType.LEFT_PAREN, "Expected '(' after 'indicator'.");
    const args = this.callArguments();
    this.consume(PineTokenType.RIGHT_PAREN, "Expected ')' after indicator arguments.");
    return { kind: 'IndicatorDecl', args, line };
  }

  private assignment(): PineAssignStmt {
    const nameToken = this.consume(PineTokenType.IDENTIFIER, 'Expected variable name.');
    const operator: '=' | ':=' = this.match(PineTokenType.COLON_ASSIGN)
      ? ':='
      : (this.consume(PineTokenType.EQUAL, "Expected '=' or ':='."), '=');
    const value = this.expression();
    return { kind: 'Assign', name: nameToken.lexeme, operator, value, line: nameToken.line };
  }

  private expressionStatement(): PineStmt {
    const expr = this.expression();
    const line = expr.line;
    return { kind: 'ExprStmt', expression: expr, line };
  }

  private expression(): PineExpr {
    return this.ternary();
  }

  private ternary(): PineExpr {
    const line = this.peek().line;
    let expr = this.logicalOr();
    if (this.match(PineTokenType.QUESTION)) {
      const consequent = this.expression();
      this.consume(PineTokenType.COLON, "Expected ':' in ternary expression.");
      const alternate = this.expression();
      expr = { kind: 'Ternary', condition: expr, consequent, alternate, line };
    }
    return expr;
  }

  private logicalOr(): PineExpr {
    let expr = this.logicalAnd();
    while (this.match(PineTokenType.OR)) {
      const line = this.previous().line;
      const right = this.logicalAnd();
      expr = { kind: 'Logical', operator: 'or', left: expr, right, line };
    }
    return expr;
  }

  private logicalAnd(): PineExpr {
    let expr = this.equality();
    while (this.match(PineTokenType.AND)) {
      const line = this.previous().line;
      const right = this.equality();
      expr = { kind: 'Logical', operator: 'and', left: expr, right, line };
    }
    return expr;
  }

  private equality(): PineExpr {
    let expr = this.comparison();
    while (this.match(PineTokenType.BANG_EQUAL, PineTokenType.EQUAL_EQUAL)) {
      const op = this.previous();
      const right = this.comparison();
      expr = { kind: 'Binary', operator: op.lexeme, left: expr, right, line: op.line };
    }
    return expr;
  }

  private comparison(): PineExpr {
    let expr = this.term();
    while (
      this.match(
        PineTokenType.GREATER,
        PineTokenType.GREATER_EQUAL,
        PineTokenType.LESS,
        PineTokenType.LESS_EQUAL,
      )
    ) {
      const op = this.previous();
      const right = this.term();
      expr = { kind: 'Binary', operator: op.lexeme, left: expr, right, line: op.line };
    }
    return expr;
  }

  private term(): PineExpr {
    let expr = this.factor();
    while (this.match(PineTokenType.PLUS, PineTokenType.MINUS)) {
      const op = this.previous();
      const line = op.line;
      const right = this.factor();
      expr = { kind: 'Binary', operator: op.lexeme, left: expr, right, line };
    }
    return expr;
  }

  private factor(): PineExpr {
    let expr = this.unary();
    while (this.match(PineTokenType.STAR, PineTokenType.SLASH, PineTokenType.PERCENT)) {
      const op = this.previous();
      const line = op.line;
      const right = this.unary();
      expr = { kind: 'Binary', operator: op.lexeme, left: expr, right, line };
    }
    return expr;
  }

  private unary(): PineExpr {
    if (this.match(PineTokenType.BANG, PineTokenType.MINUS, PineTokenType.NOT)) {
      const op = this.previous();
      const operand = this.unary();
      return { kind: 'Unary', operator: op.lexeme, operand, line: op.line };
    }
    return this.postfix();
  }

  private postfix(): PineExpr {
    let expr = this.primary();

    for (;;) {
      if (this.match(PineTokenType.LEFT_BRACKET)) {
        const index = this.expression();
        this.consume(PineTokenType.RIGHT_BRACKET, "Expected ']' after index.");
        expr = { kind: 'Index', object: expr, index, line: expr.line };
        continue;
      }

      if (this.match(PineTokenType.DOT)) {
        const property = this.consume(PineTokenType.IDENTIFIER, 'Expected property name after ".".');
        expr = { kind: 'Member', object: expr, property: property.lexeme, line: expr.line };
        continue;
      }

      if (this.match(PineTokenType.LEFT_PAREN)) {
        const args = this.callArguments();
        this.consume(PineTokenType.RIGHT_PAREN, "Expected ')' after arguments.");
        expr = { kind: 'Call', callee: expr, args, line: expr.line };
        continue;
      }

      break;
    }

    return expr;
  }

  private primary(): PineExpr {
    const token = this.peek();

    if (this.match(PineTokenType.NUMBER)) {
      const t = this.previous();
      return { kind: 'Number', value: t.literal as number, line: t.line };
    }

    if (this.match(PineTokenType.STRING)) {
      const t = this.previous();
      return { kind: 'String', value: t.literal as string, line: t.line };
    }

    if (this.match(PineTokenType.TRUE)) {
      return { kind: 'Bool', value: true, line: this.previous().line };
    }

    if (this.match(PineTokenType.FALSE)) {
      return { kind: 'Bool', value: false, line: this.previous().line };
    }

    if (this.match(PineTokenType.NA)) {
      return { kind: 'Na', line: this.previous().line };
    }

    if (this.match(PineTokenType.IDENTIFIER)) {
      return { kind: 'Var', name: this.previous().lexeme, line: this.previous().line };
    }

    if (this.match(PineTokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(PineTokenType.RIGHT_PAREN, "Expected ')' after expression.");
      return { kind: 'Grouping', expression: expr, line: token.line };
    }

    throw new PineParseErrorThrown(
      `Unexpected token '${token.lexeme}'.`,
      token.line,
      token.column,
    );
  }

  private callArguments(): PineCallArg[] {
    const args: PineCallArg[] = [];
    if (this.check(PineTokenType.RIGHT_PAREN)) return args;

    do {
      if (this.check(PineTokenType.IDENTIFIER) && this.isNamedArgAhead()) {
        const name = this.advance().lexeme;
        this.consume(PineTokenType.EQUAL, "Expected '=' after named argument.");
        args.push({ name, value: this.expression() });
      } else {
        args.push({ value: this.expression() });
      }
    } while (this.match(PineTokenType.COMMA));

    return args;
  }

  private isAssignmentAhead(): boolean {
    const next = this.tokens[this.current + 1]?.type;
    return next === PineTokenType.EQUAL || next === PineTokenType.COLON_ASSIGN;
  }

  private isNamedArgAhead(): boolean {
    const next = this.tokens[this.current + 1]?.type;
    return next === PineTokenType.EQUAL;
  }

  private synchronize(): void {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === PineTokenType.SEMICOLON) return;
      if (
        this.peek().type === PineTokenType.INDICATOR ||
        this.peek().type === PineTokenType.IDENTIFIER
      ) {
        return;
      }
      this.advance();
    }
  }

  private match(...types: PineTokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: PineTokenType, message: string): PineToken {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new PineParseErrorThrown(`${message} (line ${token.line})`, token.line, token.column);
  }

  private check(type: PineTokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): PineToken {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === PineTokenType.EOF;
  }

  private peek(): PineToken {
    return this.tokens[this.current];
  }

  private previous(): PineToken {
    return this.tokens[this.current - 1];
  }
}

export function parsePineTokens(tokens: PineToken[], version: number | null): PineParseResult {
  return new PineParser(tokens, version).parse();
}
