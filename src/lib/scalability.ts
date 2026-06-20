/**
 * Scalability & Performance Utilities for 25k Concurrent Users
 */

/**
 * Debounces a function to prevent it from being called too frequently.
 * Crucial for input handlers and scroll listeners.
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttles a function to ensure it's called at most once every `limit` ms.
 * Perfect for market data updates.
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  return (...args: Parameters<T>) => {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Adaptive Polling - Slows down polling if the tab is inactive to save market resources.
 */
export class AdaptivePoller {
  private interval: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private isActive: boolean = true;

  constructor(private callback: () => void, initialInterval: number) {
    this.interval = initialInterval;
    this.setupVisibilityListener();
  }

  private setupVisibilityListener() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      this.isActive = document.visibilityState === 'visible';
      this.restart();
    });
  }

  start() {
    this.stop();
    const currentInterval = this.isActive ? this.interval : this.interval * 5; // 5x slower when inactive
    this.timer = setInterval(() => this.callback(), currentInterval);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  private restart() {
    this.stop();
    this.start();
  }
}
