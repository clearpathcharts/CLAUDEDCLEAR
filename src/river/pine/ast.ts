// /src/river/pine/ast.ts
//
// AST node definitions for The River's Pine Script parser.
// Every Call node carries a unique `siteId` so the interpreter can keep
// per-call-site state for stateful built-ins (ta.ema, ta.crossover, ...)
// exactly the way Pine instantiates them.

// ----------------------------------------------------------------- Expressions

export type Expr =
  | NumberLit
  | StringLit
  | BoolLit
  | ColorLit
  | NaLit
  | Identifier
  | MemberAccess
  | Call
  | Unary
  | Binary
  | Logical
  | Ternary
  | HistoryRef
  | IfExpr
  | SwitchExpr
  | TupleExpr;

export interface NumberLit { kind: "NumberLit"; value: number; line: number; }
export interface StringLit { kind: "StringLit"; value: string; line: number; }
export interface BoolLit { kind: "BoolLit"; value: boolean; line: number; }
export interface ColorLit { kind: "ColorLit"; value: string; line: number; }
export interface NaLit { kind: "NaLit"; line: number; }

export interface Identifier { kind: "Identifier"; name: string; line: number; }

/** Dotted access such as `ta.atr` or `color.red`. `path` is the full dotted name. */
export interface MemberAccess { kind: "MemberAccess"; path: string; line: number; }

export interface Call {
  kind: "Call";
  /** Full dotted callee name, e.g. "ta.atr", "input.int", "plot" */
  callee: string;
  args: Expr[];
  namedArgs: { name: string; value: Expr }[];
  /** Unique per syntactic call site — interpreter state key. */
  siteId: number;
  line: number;
}

export interface Unary { kind: "Unary"; op: "-" | "+" | "not"; operand: Expr; line: number; }

export interface Binary {
  kind: "Binary";
  op: "+" | "-" | "*" | "/" | "%" | "==" | "!=" | "<" | "<=" | ">" | ">=";
  left: Expr;
  right: Expr;
  line: number;
}

export interface Logical { kind: "Logical"; op: "and" | "or"; left: Expr; right: Expr; line: number; }

export interface Ternary { kind: "Ternary"; cond: Expr; thenExpr: Expr; elseExpr: Expr; line: number; }

/** `base[offset]` — value of the series `offset` bars ago. */
export interface HistoryRef { kind: "HistoryRef"; base: Expr; offset: Expr; line: number; }

/** Pine's block-if used as an expression: `x = if cond ... else ...` */
export interface IfExpr {
  kind: "IfExpr";
  cond: Expr;
  thenBranch: Stmt[];
  elseBranch: Stmt[] | IfExpr | null;
  line: number;
}

/** Pine `switch` expression — matches on a scrutinee or bare boolean cases. */
export interface SwitchCase {
  /** null = default `=>` branch */
  pattern: Expr | null;
  body: Expr;
}

export interface SwitchExpr {
  kind: "SwitchExpr";
  /** Omitted when cases are bare conditions: `switch\n    close > open => 1` */
  scrutinee: Expr | null;
  cases: SwitchCase[];
  line: number;
}

/** `[a, b, c]` — only valid as the RHS of a tuple declaration or fn return. */
export interface TupleExpr { kind: "TupleExpr"; elements: Expr[]; line: number; }

// ------------------------------------------------------------------ Statements

export type Stmt =
  | VarDecl
  | TupleDecl
  | Assign
  | ExprStmt
  | IfStmt
  | ForStmt
  | WhileStmt
  | FunctionDecl
  | BreakStmt
  | ContinueStmt;

export interface VarDecl {
  kind: "VarDecl";
  /** "none" = plain re-evaluated each bar; "var" = init once; "varip" = init once (intrabar persist). */
  mode: "none" | "var" | "varip";
  /** Optional declared type (float/int/bool/color/string) — informational only. */
  declaredType: string | null;
  name: string;
  init: Expr;
  line: number;
}

export interface TupleDecl { kind: "TupleDecl"; names: string[]; init: Expr; line: number; }

export interface Assign {
  kind: "Assign";
  op: ":=" | "+=" | "-=" | "*=" | "/=";
  name: string;
  value: Expr;
  line: number;
}

export interface ExprStmt { kind: "ExprStmt"; expr: Expr; line: number; }

export interface IfStmt {
  kind: "IfStmt";
  cond: Expr;
  thenBranch: Stmt[];
  /** Else-if chains reuse IfExpr since statement and expression ifs share shape. */
  elseBranch: Stmt[] | IfExpr | null;
  line: number;
}

export interface ForStmt {
  kind: "ForStmt";
  varName: string;
  from: Expr;
  to: Expr;
  by: Expr | null;
  body: Stmt[];
  line: number;
}

export interface WhileStmt { kind: "WhileStmt"; cond: Expr; body: Stmt[]; line: number; }

export interface FunctionDecl {
  kind: "FunctionDecl";
  name: string;
  params: string[];
  /** Body statements; the value of the last statement is the return value. */
  body: Stmt[];
  line: number;
}

export interface BreakStmt { kind: "BreakStmt"; line: number; }
export interface ContinueStmt { kind: "ContinueStmt"; line: number; }

export interface Script {
  version: number;
  statements: Stmt[];
}
