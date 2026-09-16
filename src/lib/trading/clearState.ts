/**
 * Clear STATE SYSTEM (File 142)
 */

const KEY = "Clear_state_v1";

export interface ClearState {
  selectedAsset: string;
  screenerResults: any[];
  lastDiscoveryFetch: number;
  terminalTheme: string;
}

export function getClearState(): ClearState {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : {
    selectedAsset: "AAPL",
    screenerResults: [],
    lastDiscoveryFetch: 0,
    terminalTheme: "market"
  };
}

export function setClearState(update: Partial<ClearState>) {
  const current = getClearState();
  const newState = { ...current, ...update };
  localStorage.setItem(KEY, JSON.stringify(newState));
  
  // Trigger event for cross-tab or component sync
  window.dispatchEvent(new Event('Clear_state_change'));
}

export function subscribeToClearState(callback: (state: ClearState) => void) {
  const handler = () => callback(getClearState());
  window.addEventListener('Clear_state_change', handler);
  return () => window.removeEventListener('Clear_state_change', handler);
}
