// /src/river/pine/parser.ts
//
// The River's Pine Script parser. Consumes the token stream from lexer.ts and
// produces the AST defined in ast.ts. Supports the working core of Pine
// v4/v5/v6 indicator scripts:
//
//   - variable declarations (plain / var / varip, optional type annotation)
//   - tuple declarations       [macdLine, signalLine, hist] = ta.macd(...)
//   - reassignment             x := ..., x += ...
//   - if / else if / else blocks (statement AND expression positions)
//   - for ... to ... by ... loops, while loops, break / continue
//   - single-line and block user functions   f(x) => x * 2
//   - full expression grammar: ternary, and/or/not, comparisons, arithmetic,
//     unary minus, calls with positional + named args, dotted namespaces
//     (ta.*, math.*, input.*), history references close[1], color literals

import { Token, TokenType, PineError } from "./tokens";
import {
  Expr, Stmt, Script, Call, IfExpr, FunctionDecl,
} from "./ast";

const TYPE_KEYWORDS = new Set(["float", "int", "bool", "color", "string", "series", "simple"]);

export class PineParser {
  private tokens: Token[];
  private pos = 0;
  private version: number;
  private nextSiteId = 0;

  constructor(tokens: Token[], version: number) {
    this.tokens = tokens;
    this.version = version;
  }

  parse(): Script {
    const statements: Stmt[] = [];
    this.skipNewlines();
    while (!this.isAtEnd()) {
      statements.push(this.statement());
      this.skipNewlines();
    }
    return { version: this.version, statements };
  }

  // ------------------------------------------------------------- statements

  private statement(): Stmt {
    const t = this.peek();

    if (t.type === TokenType.IF) return this.ifStatement();
    if (t.type === TokenType.FOR) return this.forStatement();
    if (t.type === TokenType.WHILE) return this.whileStatement();
    if (t.type === TokenType.BREAK) { this.advance(); this.endStatement(); return { kind: "BreakStmt", line: t.line }; }
    if (t.type === TokenType.CONTINUE) { this.advance(); this.endStatement(); return { kind: "ContinueStmt", line: t.line }; }
    if (t.type === TokenType.VAR || t.type === TokenType.VARIP) return this.varDecl(t.type === TokenType.VARIP ? "varip" : "var");
    if (t.type === TokenType.LBRACKET) return this.tupleDecl();

    // Look ahead to classify identifier-led statements.
    if (t.type === TokenType.IDENT) {
      // Type-annotated declaration:  float x = ...
      if (TYPE_KEYWORDS.has(t.lexeme) && this.peekType(1) === TokenType.IDENT &&
          (this.peekType(2) === TokenType.ASSIGN)) {
        return this.typedDecl("none");
      }

      // Function declaration:  name(a, b) => ...
      if (this.peekType(1) === TokenType.LPAREN && this.isFunctionDeclAhead()) {
        return this.functionDecl();
      }

      const nextType = this.peekType(1);
      if (nextType === TokenType.ASSIGN) return this.simpleDecl();
      if (nextType === TokenType.REASSIGN || nextType === TokenType.PLUS_ASSIGN ||
          nextType === TokenType.MINUS_ASSIGN || nextType === TokenType.STAR_ASSIGN ||
          nextType === TokenType.SLASH_ASSIGN) {
        return this.assignStatement();
      }
    }

    // Bare expression statement (plot(...), alertcondition(...), etc.)
    const expr = this.expression();
    this.endStatement();
    return { kind: "ExprStmt", expr, line: t.line };
  }

  /** var / varip declarations, optionally typed: `var float x = na` */
  private varDecl(mode: "var" | "varip"): Stmt {
    this.advance(); // var / varip
    if (this.peek().type === TokenType.IDENT && TYPE_KEYWORDS.has(this.peek().lexeme) &&
        this.peekType(1) === TokenType.IDENT) {
      return this.typedDecl(mode);
    }
    const name = this.expect(TokenType.IDENT, "variable name").lexeme;
    this.expect(TokenType.ASSIGN, "'='");
    const init = this.declInitializer();
    return { kind: "VarDecl", mode, declaredType: null, name, init, line: this.previous().line };
  }

  private typedDecl(mode: "none" | "var" | "varip"): Stmt {
    // May be `series float`, `simple int`, or just `float`
    let declaredType = this.advance().lexeme;
    if (TYPE_KEYWORDS.has(this.peek().lexeme) && this.peekType(1) === TokenType.IDENT) {
      declaredType += " " + this.advance().lexeme;
    }
    const name = this.expect(TokenType.IDENT, "variable name").lexeme;
    this.expect(TokenType.ASSIGN, "'='");
    const init = this.declInitializer();
    return { kind: "VarDecl", mode, declaredType, name, init, line: this.previous().line };
  }

  private simpleDecl(): Stmt {
    const name = this.advance().lexeme;
    this.advance(); // =
    const init = this.declInitializer();
    return { kind: "VarDecl", mode: "none", declaredType: null, name, init, line: this.previous().line };
  }

  /** `[a, b, c] = expr` */
  private tupleDecl(): Stmt {
    const line = this.peek().line;
    this.advance(); // [
    const names: string[] = [];
    names.push(this.expect(TokenType.IDENT, "tuple element name").lexeme);
    while (this.matchToken(TokenType.COMMA)) {
      names.push(this.expect(TokenType.IDENT, "tuple element name").lexeme);
    }
    this.expect(TokenType.RBRACKET, "']'");
    this.expect(TokenType.ASSIGN, "'='");
    const init = this.declInitializer();
    return { kind: "TupleDecl", names, init, line };
  }

  private assignStatement(): Stmt {
    const name = this.advance().lexeme;
    const opTok = this.advance();
    const opMap: Record<string, ":=" | "+=" | "-=" | "*=" | "/="> = {
      [TokenType.REASSIGN]: ":=", [TokenType.PLUS_ASSIGN]: "+=", [TokenType.MINUS_ASSIGN]: "-=",
      [TokenType.STAR_ASSIGN]: "*=", [TokenType.SLASH_ASSIGN]: "/=",
    };
    const value = this.declInitializer();
    return { kind: "Assign", op: opMap[opTok.type], name, value, line: opTok.line };
  }

  /** RHS of a declaration/assignment: either an if-expression block or a normal expression. */
  private declInitializer(): Expr {
    if (this.peek().type === TokenType.IF) {
      return this.ifExpression();
    }
    const expr = this.expression();
    this.endStatement();
    return expr;
  }

  private ifStatement(): Stmt {
    const ifExpr = this.ifExpression();
    return { kind: "IfStmt", cond: ifExpr.cond, thenBranch: ifExpr.thenBranch, elseBranch: ifExpr.elseBranch, line: ifExpr.line };
  }

  /** Parses `if cond <block> [else if ... | else <block>]`. Shared by stmt and expr forms. */
  private ifExpression(): IfExpr {
    const line = this.expect(TokenType.IF, "'if'").line;
    const cond = this.expression();
    const thenBranch = this.block();

    let elseBranch: Stmt[] | IfExpr | null = null;
    if (this.peek().type === TokenType.ELSE) {
      this.advance();
      if (this.peek().type === TokenType.IF) {
        elseBranch = this.ifExpression();
      } else {
        elseBranch = this.block();
      }
    }
    return { kind: "IfExpr", cond, thenBranch, elseBranch, line };
  }

  private forStatement(): Stmt {
    const line = this.expect(TokenType.FOR, "'for'").line;
    const varName = this.expect(TokenType.IDENT, "loop variable").lexeme;
    this.expect(TokenType.ASSIGN, "'='");
    const from = this.expression();
    this.expect(TokenType.TO, "'to'");
    const to = this.expression();
    let by: Expr | null = null;
    if (this.matchToken(TokenType.BY)) by = this.expression();
    const body = this.block();
    return { kind: "ForStmt", varName, from, to, by, body, line };
  }

  private whileStatement(): Stmt {
    const line = this.expect(TokenType.WHILE, "'while'").line;
    const cond = this.expression();
    const body = this.block();
    return { kind: "WhileStmt", cond, body, line };
  }

  /** Distinguishes `f(a, b) =>` (declaration) from `f(a, b)` (call). */
  private isFunctionDeclAhead(): boolean {
    let i = this.pos + 1; // at LPAREN
    let depth = 0;
    while (i < this.tokens.length) {
      const t = this.tokens[i];
      if (t.type === TokenType.LPAREN) depth++;
      else if (t.type === TokenType.RPAREN) {
        depth--;
        if (depth === 0) {
          return this.tokens[i + 1]?.type === TokenType.ARROW;
        }
      } else if (t.type === TokenType.NEWLINE || t.type === TokenType.EOF) {
        return false;
      }
      i++;
    }
    return false;
  }

  private functionDecl(): FunctionDecl {
    const nameTok = this.advance();
    this.expect(TokenType.LPAREN, "'('");
    const params: string[] = [];
    if (this.peek().type !== TokenType.RPAREN) {
      do {
        // Tolerate typed params: `f(float x, int y) =>`
        if (TYPE_KEYWORDS.has(this.peek().lexeme) && this.peekType(1) === TokenType.IDENT) this.advance();
        params.push(this.expect(TokenType.IDENT, "parameter name").lexeme);
      } while (this.matchToken(TokenType.COMMA));
    }
    this.expect(TokenType.RPAREN, "')'");
    this.expect(TokenType.ARROW, "'=>'");

    let body: Stmt[];
    if (this.peek().type === TokenType.NEWLINE) {
      body = this.block();
    } else {
      // Single-line body: the expression is the return value.
      const expr = this.expression();
      this.endStatement();
      body = [{ kind: "ExprStmt", expr, line: nameTok.line }];
    }
    return { kind: "FunctionDecl", name: nameTok.lexeme, params, body, line: nameTok.line };
  }

  /** NEWLINE INDENT stmt+ DEDENT — or a single inline statement on the same line. */
  private block(): Stmt[] {
    if (this.peek().type !== TokenType.NEWLINE) {
      // Inline form: `if cond x := 1` is not legal Pine, but expression bodies
      // after => reach block() only via functionDecl, so treat as single stmt.
      return [this.statement()];
    }
    this.expect(TokenType.NEWLINE, "newline");
    this.skipNewlines();
    this.expect(TokenType.INDENT, "an indented block");
    const stmts: Stmt[] = [];
    this.skipNewlines();
    while (this.peek().type !== TokenType.DEDENT && !this.isAtEnd()) {
      stmts.push(this.statement());
      this.skipNewlines();
    }
    this.expect(TokenType.DEDENT, "end of block");
    return stmts;
  }

  // ------------------------------------------------------------ expressions

  private expression(): Expr {
    return this.ternary();
  }

  private ternary(): Expr {
    const cond = this.logicalOr();
    if (this.matchToken(TokenType.QUESTION)) {
      const thenExpr = this.ternary();
      this.expect(TokenType.COLON, "':' in ternary");
      const elseExpr = this.ternary();
      return { kind: "Ternary", cond, thenExpr, elseExpr, line: cond.line };
    }
    return cond;
  }

  private logicalOr(): Expr {
    let left = this.logicalAnd();
    while (this.matchToken(TokenType.OR)) {
      const right = this.logicalAnd();
      left = { kind: "Logical", op: "or", left, right, line: left.line };
    }
    return left;
  }

  private logicalAnd(): Expr {
    let left = this.equality();
    while (this.matchToken(TokenType.AND)) {
      const right = this.equality();
      left = { kind: "Logical", op: "and", left, right, line: left.line };
    }
    return left;
  }

  private equality(): Expr {
    let left = this.comparison();
    while (this.peek().type === TokenType.EQ || this.peek().type === TokenType.NEQ) {
      const op = this.advance().type === TokenType.EQ ? "==" : "!=";
      const right = this.comparison();
      left = { kind: "Binary", op, left, right, line: left.line };
    }
    return left;
  }

  private comparison(): Expr {
    let left = this.additive();
    while (true) {
      const t = this.peek().type;
      let op: "<" | "<=" | ">" | ">=" | null = null;
      if (t === TokenType.LT) op = "<";
      else if (t === TokenType.LTE) op = "<=";
      else if (t === TokenType.GT) op = ">";
      else if (t === TokenType.GTE) op = ">=";
      if (!op) break;
      this.advance();
      const right = this.additive();
      left = { kind: "Binary", op, left, right, line: left.line };
    }
    return left;
  }

  private additive(): Expr {
    let left = this.multiplicative();
    while (this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS) {
      const op = this.advance().type === TokenType.PLUS ? "+" : "-";
      const right = this.multiplicative();
      left = { kind: "Binary", op, left, right, line: left.line };
    }
    return left;
  }

  private multiplicative(): Expr {
    let left = this.unary();
    while (true) {
      const t = this.peek().type;
      let op: "*" | "/" | "%" | null = null;
      if (t === TokenType.STAR) op = "*";
      else if (t === TokenType.SLASH) op = "/";
      else if (t === TokenType.PERCENT) op = "%";
      if (!op) break;
      this.advance();
      const right = this.unary();
      left = { kind: "Binary", op, left, right, line: left.line };
    }
    return left;
  }

  private unary(): Expr {
    const t = this.peek();
    if (t.type === TokenType.MINUS) { this.advance(); return { kind: "Unary", op: "-", operand: this.unary(), line: t.line }; }
    if (t.type === TokenType.PLUS) { this.advance(); return { kind: "Unary", op: "+", operand: this.unary(), line: t.line }; }
    if (t.type === TokenType.NOT) { this.advance(); return { kind: "Unary", op: "not", operand: this.unary(), line: t.line }; }
    return this.postfix();
  }

  /** Handles history references `expr[n]` after a primary. */
  private postfix(): Expr {
    let expr = this.primary();
    while (this.peek().type === TokenType.LBRACKET) {
      this.advance();
      const offset = this.expression();
      this.expect(TokenType.RBRACKET, "']'");
      expr = { kind: "HistoryRef", base: expr, offset, line: expr.line };
    }
    return expr;
  }

  private primary(): Expr {
    const t = this.peek();

    if (t.type === TokenType.NUMBER) { this.advance(); return { kind: "NumberLit", value: t.literal as number, line: t.line }; }
    if (t.type === TokenType.STRING) { this.advance(); return { kind: "StringLit", value: t.literal as string, line: t.line }; }
    if (t.type === TokenType.COLOR_LITERAL) { this.advance(); return { kind: "ColorLit", value: t.literal as string, line: t.line }; }
    if (t.type === TokenType.TRUE) { this.advance(); return { kind: "BoolLit", value: true, line: t.line }; }
    if (t.type === TokenType.FALSE) { this.advance(); return { kind: "BoolLit", value: false, line: t.line }; }

    if (t.type === TokenType.LPAREN) {
      this.advance();
      const inner = this.expression();
      this.expect(TokenType.RPAREN, "')'");
      return inner;
    }

    if (t.type === TokenType.LBRACKET) {
      // Tuple literal (only meaningful as fn return value / tuple decl RHS).
      this.advance();
      const elements: Expr[] = [this.expression()];
      while (this.matchToken(TokenType.COMMA)) elements.push(this.expression());
      this.expect(TokenType.RBRACKET, "']'");
      return { kind: "TupleExpr", elements, line: t.line };
    }

    if (t.type === TokenType.IDENT) {
      this.advance();
      if (t.lexeme === "na" && this.peek().type !== TokenType.LPAREN && this.peek().type !== TokenType.DOT) {
        return { kind: "NaLit", line: t.line };
      }

      // Build dotted path: ta.atr, input.int, color.new, strategy.long ...
      let path = t.lexeme;
      while (this.peek().type === TokenType.DOT && this.peekType(1) === TokenType.IDENT) {
        this.advance(); // .
        path += "." + this.advance().lexeme;
      }

      if (this.peek().type === TokenType.LPAREN) {
        return this.finishCall(path, t.line);
      }

      if (path.includes(".")) return { kind: "MemberAccess", path, line: t.line };
      return { kind: "Identifier", name: path, line: t.line };
    }

    throw new PineError(`Unexpected token '${t.lexeme || t.type}'`, t.line, t.col);
  }

  private finishCall(callee: string, line: number): Call {
    this.expect(TokenType.LPAREN, "'('");
    const args: Expr[] = [];
    const namedArgs: { name: string; value: Expr }[] = [];

    if (this.peek().type !== TokenType.RPAREN) {
      do {
        // Named argument: ident '=' expr (but not '==')
        if (this.peek().type === TokenType.IDENT && this.peekType(1) === TokenType.ASSIGN) {
          const name = this.advance().lexeme;
          this.advance(); // =
          namedArgs.push({ name, value: this.expression() });
        } else {
          args.push(this.expression());
        }
      } while (this.matchToken(TokenType.COMMA));
    }
    this.expect(TokenType.RPAREN, "')'");
    return { kind: "Call", callee, args, namedArgs, siteId: this.nextSiteId++, line };
  }

  // -------------------------------------------------------------- utilities

  private endStatement() {
    if (this.peek().type === TokenType.NEWLINE) { this.advance(); return; }
    if (this.peek().type === TokenType.EOF || this.peek().type === TokenType.DEDENT) return;
    const t = this.peek();
    throw new PineError(`Expected end of statement but found '${t.lexeme}'`, t.line, t.col);
  }

  private skipNewlines() {
    while (this.peek().type === TokenType.NEWLINE) this.advance();
  }

  private isAtEnd(): boolean { return this.peek().type === TokenType.EOF; }
  private peek(): Token { return this.tokens[this.pos]; }
  private peekType(ahead: number): TokenType | undefined { return this.tokens[this.pos + ahead]?.type; }
  private previous(): Token { return this.tokens[this.pos - 1]; }
  private advance(): Token { return this.tokens[this.pos++]; }

  private matchToken(type: TokenType): boolean {
    if (this.peek().type !== type) return false;
    this.advance();
    return true;
  }

  private expect(type: TokenType, what: string): Token {
    if (this.peek().type === type) return this.advance();
    const t = this.peek();
    throw new PineError(`Expected ${what} but found '${t.lexeme || t.type}'`, t.line, t.col);
  }
}

export function parsePine(tokens: Token[], version: number): Script {
  return new PineParser(tokens, version).parse();
}
