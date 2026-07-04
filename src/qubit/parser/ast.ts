// src/qubit/parser/ast.ts
//
// Abstract Syntax Tree node types for QUBIT. The AST is the universal
// intermediate representation: indicator source (PineScript today,
// other platforms tomorrow) is lexed, parsed into these nodes, and
// The River consumes them to understand what the indicator computes.

import { Token } from '../lexer/token';

// ---------- Expressions ----------

export type Expr =
  | BinaryExpr
  | GroupingExpr
  | LiteralExpr
  | UnaryExpr
  | VariableExpr
  | AssignExpr
  | LogicalExpr
  | CallExpr;

export interface BinaryExpr {
  kind: 'Binary';
  left: Expr;
  operator: Token;
  right: Expr;
}

export interface GroupingExpr {
  kind: 'Grouping';
  expression: Expr;
}

export interface LiteralExpr {
  kind: 'Literal';
  value: any;
}

export interface UnaryExpr {
  kind: 'Unary';
  operator: Token;
  right: Expr;
}

export interface VariableExpr {
  kind: 'Variable';
  name: Token;
}

export interface AssignExpr {
  kind: 'Assign';
  name: Token;
  value: Expr;
}

export interface LogicalExpr {
  kind: 'Logical';
  left: Expr;
  operator: Token;
  right: Expr;
}

export interface CallExpr {
  kind: 'Call';
  callee: Expr;
  paren: Token; // closing parenthesis, kept for error reporting
  args: Expr[];
}

// ---------- Statements ----------

export type Stmt =
  | ExpressionStmt
  | PrintStmt
  | VarStmt
  | BlockStmt
  | IfStmt
  | WhileStmt
  | FunctionStmt
  | ReturnStmt;

export interface ExpressionStmt {
  kind: 'Expression';
  expression: Expr;
}

export interface PrintStmt {
  kind: 'Print';
  expression: Expr;
}

export interface VarStmt {
  kind: 'Var';
  name: Token;
  initializer: Expr | null;
}

export interface BlockStmt {
  kind: 'Block';
  statements: Stmt[];
}

export interface IfStmt {
  kind: 'If';
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt | null;
}

export interface WhileStmt {
  kind: 'While';
  condition: Expr;
  body: Stmt;
}

export interface FunctionStmt {
  kind: 'Function';
  name: Token;
  params: Token[];
  body: Stmt[];
}

export interface ReturnStmt {
  kind: 'Return';
  keyword: Token;
  value: Expr | null;
}
