/** Thin wrapper so vision scheduling works in SSR and browser alike. */

type RafFn = (cb: () => void) => number;
type CancelFn = (id: number) => void;

const raf: RafFn =
  typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : (cb) => setTimeout(cb, 0) as unknown as number;

const cancel: CancelFn =
  typeof globalThis.cancelAnimationFrame === 'function'
    ? globalThis.cancelAnimationFrame.bind(globalThis)
    : (id) => clearTimeout(id);

export function requestAnimation(cb: () => void): number {
  return raf(cb);
}

export function cancelAnimation(id: number): void {
  cancel(id);
}
