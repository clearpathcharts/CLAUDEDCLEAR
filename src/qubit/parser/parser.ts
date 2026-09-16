// src/qubit/parser/parser.ts
//
// Recursive-descent parser for QUBIT. Consumes the token stream from
// the Lexer and produces the AST defined in ./ast. Grammar (highest
// binding last):
//
//   program        -> declaration* EOF
//   declaration    -> funDecl | varDecl | statement
//   statement      -> exprStmt | printStmt | ifStmt | whileStmt
//                     | forStmt | returnStmt | block
//   expression     -> assignment
//   assignment     -> IDENTIFIER "=" assignment | logic_or
//   logic_or       -> logic_and ( "or" logic_and )*
//   logic_and      -> equality ( "and" equality )*
//   equality       -> comparison ( ( "!=" | "==" ) comparison )*
//   comparison     -> term ( ( ">" | ">=" | "<" | "<=" ) term )*
//   term           -> factor ( ( "-" | "+" ) factor )*
//   factor         -> unary ( ( "/" | "*" ) unary )*
//   unary          -> ( "!" | "-" ) unary | call
//   call           -> primary ( "(" arguments? ")" )*
//   primary        -> NUMBER | STRING | "true" | "false" | "nil"
//                     | IDENTIFIER | "(" expression ")"

import { Token, TokenType } from '../lexer/token';
import {
  Expr,
  Stmt,
  BlockStmt,
  FunctionStmt,
} from './ast';

export class ParseError extends Error {
  constructor(message: string, public readonly token: Token) {
    super(message);
    this.name = 'ParseError';
  }
}

export class Parser {
  private current = 0;
  private readonly errors: ParseError[] = [];

  constructor(private readonly tokens: Token[]) {}

  parse(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      const decl = this.declaration();
      if (decl) statements.push(decl);
    }
    if (this.errors.length > 0) {
      // Surface every syntax problem in one throw so the caller's
      // QubitResult reports failure instead of a silent partial parse.
      throw new Error(this.errors.map((e) => e.message).join(' | '));
    }
    return statements;
  }

  // ---------- Declarations ----------

  private declaration(): Stmt | null {
    try {
      if (this.match(TokenType.FUN)) return this.functionDeclaration('function');
      if (this.match(TokenType.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (err) {
      if (err instanceof ParseError) {
        this.errors.push(err);
        this.synchronize();
        return null;
      }
      throw err;
    }
  }

  private functionDeclaration(kindLabel: string): FunctionStmt {
    const name = this.consume(TokenType.IDENTIFIER, `Expected ${kindLabel} name.`);
    this.consume(TokenType.LEFT_PAREN, `Expected '(' after ${kindLabel} name.`);
    const params: Token[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (params.length >= 255) {
          throw new ParseError("Can't have more than 255 parameters.", this.peek());
        }
        params.push(this.consume(TokenType.IDENTIFIER, 'Expected parameter name.'));
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters.");
    this.consume(TokenType.LEFT_BRACE, `Expected '{' before ${kindLabel} body.`);
    const body = this.block().statements;
    return { kind: 'Function', name, params, body };
  }

  private varDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name.');
    let initializer: Expr | null = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration.");
    return { kind: 'Var', name, initializer };
  }

  // ---------- Statements ----------

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.LEFT_BRACE)) return this.block();
    return this.expressionStatement();
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after value.");
    return { kind: 'Print', expression: value };
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after if condition.");
    const thenBranch = this.statement();
    let elseBranch: Stmt | null = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }
    return { kind: 'If', condition, thenBranch, elseBranch };
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after while condition.");
    const body = this.statement();
    return { kind: 'While', condition, body };
  }

  // Desugars: for (init; cond; incr) body  ->  { init; while (cond) { body; incr; } }
  private forStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'for'.");

    let initializer: Stmt | null;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expr | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expected ';' after loop condition.");

    let increment: Expr | null = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after for clauses.");

    let body = this.statement();

    if (increment !== null) {
      body = { kind: 'Block', statements: [body, { kind: 'Expression', expression: increment }] };
    }
    if (condition === null) {
      condition = { kind: 'Literal', value: true };
    }
    body = { kind: 'While', condition, body };
    if (initializer !== null) {
      body = { kind: 'Block', statements: [initializer, body] };
    }
    return body;
  }

  private returnStatement(): Stmt {
    const keyword = this.previous();
    let value: Expr | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expected ';' after return value.");
    return { kind: 'Return', keyword, value };
  }

  private block(): BlockStmt {
    const statements: Stmt[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const decl = this.declaration();
      if (decl) statements.push(decl);
    }
    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block.");
    return { kind: 'Block', statements };
  }

  private expressionStatement(): Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after expression.");
    return { kind: 'Expression', expression: expr };
  }

  // ---------- Expressions ----------

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr.kind === 'Variable') {
        return { kind: 'Assign', name: expr.name, value };
      }
      throw new ParseError('Invalid assignment target.', equals);
    }

    return expr;
  }

  private or(): Expr {
    let expr = this.and();
    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = { kind: 'Logical', left: expr, operator, right };
    }
    return expr;
  }

  private and(): Expr {
    let expr = this.equality();
    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = { kind: 'Logical', left: expr, operator, right };
    }
    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();
    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = { kind: 'Binary', left: expr, operator, right };
    }
    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();
    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      expr = { kind: 'Binary', left: expr, operator, right };
    }
    return expr;
  }

  private term(): Expr {
    let expr = this.factor();
    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = { kind: 'Binary', left: expr, operator, right };
    }
    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();
    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = { kind: 'Binary', left: expr, operator, right };
    }
    return expr;
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return { kind: 'Unary', operator, right };
    }
    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();
    for (;;) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }
    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args: Expr[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          throw new ParseError("Can't have more than 255 arguments.", this.peek());
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }
    const paren = this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments.");
    return { kind: 'Call', callee, paren, args };
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return { kind: 'Literal', value: false };
    if (this.match(TokenType.TRUE)) return { kind: 'Literal', value: true };
    if (this.match(TokenType.NIL)) return { kind: 'Literal', value: null };

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return { kind: 'Literal', value: this.previous().literal };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return { kind: 'Variable', name: this.previous() };
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
      return { kind: 'Grouping', expression: expr };
    }

    throw new ParseError('Expected expression.', this.peek());
  }

  // ---------- Token helpers ----------

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new ParseError(`${message} (line ${this.peek().line})`, this.peek());
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  // After a parse error, skip tokens until a likely statement boundary
  // so one bad line doesn't cascade into dozens of phantom errors.
  private synchronize(): void {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;
      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }
      this.advance();
    }
  }
}
