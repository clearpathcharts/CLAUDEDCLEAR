// Pine Script v5 AST — Layer 2 output for The River compiler pipeline.

export interface PineProgram {
  kind: 'Program';
  version: number | null;
  declarations: PineStmt[];
}

export type PineStmt =
  | PineIndicatorDecl
  | PineAssignStmt
  | PineExprStmt;

export interface PineIndicatorDecl {
  kind: 'IndicatorDecl';
  args: PineCallArg[];
  line: number;
}

export interface PineAssignStmt {
  kind: 'Assign';
  name: string;
  operator: '=' | ':=';
  value: PineExpr;
  line: number;
}

export interface PineExprStmt {
  kind: 'ExprStmt';
  expression: PineExpr;
  line: number;
}

export type PineExpr =
  | PineNumberLit
  | PineStringLit
  | PineBoolLit
  | PineNaLit
  | PineVarExpr
  | PineUnaryExpr
  | PineBinaryExpr
  | PineLogicalExpr
  | PineTernaryExpr
  | PineCallExpr
  | PineMemberExpr
  | PineIndexExpr
  | PineGroupingExpr;

export interface PineNumberLit {
  kind: 'Number';
  value: number;
  line: number;
}

export interface PineStringLit {
  kind: 'String';
  value: string;
  line: number;
}

export interface PineBoolLit {
  kind: 'Bool';
  value: boolean;
  line: number;
}

export interface PineNaLit {
  kind: 'Na';
  line: number;
}

export interface PineVarExpr {
  kind: 'Var';
  name: string;
  line: number;
}

export interface PineUnaryExpr {
  kind: 'Unary';
  operator: string;
  operand: PineExpr;
  line: number;
}

export interface PineBinaryExpr {
  kind: 'Binary';
  operator: string;
  left: PineExpr;
  right: PineExpr;
  line: number;
}

export interface PineLogicalExpr {
  kind: 'Logical';
  operator: 'and' | 'or';
  left: PineExpr;
  right: PineExpr;
  line: number;
}

export interface PineTernaryExpr {
  kind: 'Ternary';
  condition: PineExpr;
  consequent: PineExpr;
  alternate: PineExpr;
  line: number;
}

export interface PineCallExpr {
  kind: 'Call';
  callee: PineExpr;
  args: PineCallArg[];
  line: number;
}

export interface PineMemberExpr {
  kind: 'Member';
  object: PineExpr;
  property: string;
  line: number;
}

export interface PineIndexExpr {
  kind: 'Index';
  object: PineExpr;
  index: PineExpr;
  line: number;
}

export interface PineGroupingExpr {
  kind: 'Grouping';
  expression: PineExpr;
  line: number;
}

export interface PineCallArg {
  name?: string;
  value: PineExpr;
}

export interface PineParseError {
  message: string;
  line: number;
  column: number;
}

export interface PineParseResult {
  program: PineProgram | null;
  errors: PineParseError[];
}
