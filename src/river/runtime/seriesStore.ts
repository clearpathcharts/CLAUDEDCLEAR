// Bar-indexed series storage for RIR runtime execution.

export class SeriesStore {
  private readonly series = new Map<string, number[]>();

  ensure(name: string, minLength: number): void {
    if (!this.series.has(name)) {
      this.series.set(name, []);
    }
    const arr = this.series.get(name)!;
    while (arr.length < minLength) {
      arr.push(NaN);
    }
  }

  set(name: string, bar: number, value: number): void {
    this.ensure(name, bar + 1);
    this.series.get(name)![bar] = value;
  }

  get(name: string, bar: number, offset = 0): number {
    const idx = bar - offset;
    if (idx < 0 || !this.series.has(name)) return NaN;
    const arr = this.series.get(name)!;
    if (idx >= arr.length) return NaN;
    return arr[idx];
  }

  has(name: string): boolean {
    return this.series.has(name);
  }

  names(): string[] {
    return [...this.series.keys()];
  }
}

export function isTruthy(value: number): boolean {
  return !Number.isNaN(value) && value !== 0;
}

export function toBoolNum(value: number): number {
  return isTruthy(value) ? 1 : 0;
}
