import { NewsItem } from '../types';

export interface HealthEvent {
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'FALLBACK';
  message: string;
  code?: string | number;
}

export interface TwelveDataHealthClient {
  status: 'HEALTHY' | 'RATE_LIMITED' | 'TIMEOUT' | 'ERROR' | 'OFFLINE' | 'MOCK_FALLBACK';
  apiKeyPresent: boolean;
  rateLimitLimit: string;
  rateLimitRemaining: string;
  rateLimitReset: string | number;
  lastError: string | null;
  latencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  websocketConnected: boolean;
  lastChecked: string;
  fallbackMode?: boolean;
  isApiExhaustedThisMonth?: boolean;
  events?: HealthEvent[];
}

/**
 * DataStreamService handles real-time data ingestion via WebSockets and RSS feeds.
 * This is the central hub for market-grade data streaming with robust API tracking listeners.
 */
export class DataStreamService {
  private static marketWs: WebSocket | null = null;
  private static priceListeners: Map<string, (price: string) => void> = new Map();
  private static messageListeners: ((msg: any) => void)[] = [];
  
  // Real-time API & Network Connection Diagnostics status state
  private static healthListeners: ((health: TwelveDataHealthClient) => void)[] = [];
  private static currentHealth: TwelveDataHealthClient = {
    status: 'HEALTHY',
    apiKeyPresent: false,
    rateLimitLimit: '8',
    rateLimitRemaining: '8',
    rateLimitReset: '0',
    lastError: null,
    latencyMs: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    websocketConnected: false,
    lastChecked: new Date().toISOString(),
  };

  private static lastPrices: Map<string, number> = new Map();
  private static healthPollInterval: any = null;

  /**
   * Connects to the internal market WebSocket stream.
   */
  static connectInternalStream() {
    if (this.marketWs) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.marketWs = new WebSocket(`${protocol}//${host}`);

    this.marketWs.onopen = () => {
      this.currentHealth.websocketConnected = true;
      this.notifyHealthUpdated();
    };

    this.marketWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Notify all generic message listeners
      this.messageListeners.forEach(listener => listener(data));

      if (data.type === 'HEARTBEAT') {
        const parsedLatency = parseFloat(data.latency || "0");
        this.currentHealth.latencyMs = parsedLatency || this.currentHealth.latencyMs;
        this.notifyHealthUpdated();
      }
    };

    this.marketWs.onclose = () => {
      this.marketWs = null;
      this.currentHealth.websocketConnected = false;
      this.notifyHealthUpdated();
      setTimeout(() => this.connectInternalStream(), 5000);
    };

    this.marketWs.onerror = (error) => {
      console.error('Market WebSocket Error:', error);
      this.currentHealth.websocketConnected = false;
      this.notifyHealthUpdated();
    };

    // Auto-trigger periodic backend health polling
    this.startHealthPolling();
  }

  /**
   * Fetch current backend Twelve Data health diagnostics
   */
  static async queryBackendHealth() {
    try {
      const start = Date.now();
      const response = await fetch('/api/twelvedata/health');
      const latency = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        this.currentHealth = {
          ...this.currentHealth,
          status: data.status,
          apiKeyPresent: data.apiKeyPresent,
          rateLimitLimit: data.rateLimitLimit || '8',
          rateLimitRemaining: data.rateLimitRemaining || '8',
          rateLimitReset: data.rateLimitReset || '0',
          lastError: data.lastError,
          totalRequests: data.totalRequests || 0,
          successfulRequests: data.successfulRequests || 0,
          failedRequests: data.failedRequests || 0,
          lastChecked: data.lastChecked || new Date().toISOString(),
          events: data.events || [],
          latencyMs: latency,
        };
      } else {
        // If HTTP fails, flag timeout or error
        this.currentHealth.status = response.status === 429 ? 'RATE_LIMITED' : 'ERROR';
        this.currentHealth.lastError = `Backend diagnostic endpoint returned HTTP ${response.status}`;
      }
    } catch (e: any) {
      this.currentHealth.status = 'OFFLINE';
      this.currentHealth.lastError = e?.message || 'Failed to reach local endpoint - Network timed out';
    }
    this.notifyHealthUpdated();
  }

  private static startHealthPolling() {
    if (this.healthPollInterval) return;
    
    // Initial fetch
    this.queryBackendHealth();

    // Poll every 4 seconds to get snappy live connection diagnostic data
    this.healthPollInterval = setInterval(() => {
      this.queryBackendHealth();
    }, 4000);
  }

  /**
   * Subscribes to API connection state and health telemetry changes
   */
  static subscribeToHealth(callback: (health: TwelveDataHealthClient) => void) {
    this.healthListeners.push(callback);
    // Instant fallback update with latest cache on subscribe
    callback({ ...this.currentHealth });

    return () => {
      this.healthListeners = this.healthListeners.filter(l => l !== callback);
    };
  }

  private static notifyHealthUpdated() {
    this.healthListeners.forEach(listener => listener({ ...this.currentHealth }));
  }

  /**
   * Get Snapshot of current health coordinates
   */
  static getLatestHealth(): TwelveDataHealthClient {
    return { ...this.currentHealth };
  }

  /**
   * Subscribes to generic market messages.
   */
  static subscribeToMessages(callback: (msg: any) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== callback);
    };
  }

  /**
   * Connects to a simulated market market feed.
   * Disabled under compliance rules.
   */
  static connectMarketStream(symbols: string[]) {
    console.log("⚠️ [DataStreamService] Simulated live market feed is disabled under compliance rules.");
    return () => {};
  }

  /**
   * Subscribes to price updates for a specific symbol.
   */
  static subscribeToPrice(symbol: string, callback: (price: string) => void) {
    this.priceListeners.set(symbol.toUpperCase(), callback);
  }

  /**
   * Unsubscribes from price updates.
   */
  static unsubscribeFromPrice(symbol: string) {
    this.priceListeners.delete(symbol.toUpperCase());
  }
}
