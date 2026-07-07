import { FormingStructureBrief } from './forming';

let activeBrief: FormingStructureBrief | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeFormingBrief(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setActiveFormingBrief(brief: FormingStructureBrief | null): void {
  activeBrief = brief;
  notify();
}

export function getActiveFormingBrief(): FormingStructureBrief | null {
  return activeBrief;
}
