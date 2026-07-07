export { executeRir, applyRirColorsToCandles } from './execute';
export {
  activateRirProgram,
  executeActiveRirOnCandles,
  getActiveRirProgram,
  getActiveRirOverrides,
  getLastRirExecution,
  getGoldBarColorForTime,
  clearActiveRirProgram,
} from './activeRuntime';
export {
  type RirExecutionResult,
  type RirExecuteResult,
  type RirBarResult,
  type RirInputOverrides,
  isGoldBarRir,
  buildInputMap,
} from './types';
