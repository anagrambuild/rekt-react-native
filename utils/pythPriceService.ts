import { HermesClient } from "@pythnetwork/hermes-client";

import { PYTH_PRICE_IDS, SupportedToken } from "./backendApi";

export interface StreamedPriceData {
  token: SupportedToken;
  price: number;
  timestamp: number;
  confidence: number;
}

// NOTE:: THIS SHOULD BE HANDLED BY THE BACKEND BUT TO UNBLOCK OTHER TASKS, WE ARE USING THIS FOR NOW
class PythPriceService {
  private static instance: PythPriceService;
  private client: HermesClient;
  private priceCache: Map<SupportedToken, StreamedPriceData[]> = new Map();
  private subscribers: Map<string, (data: StreamedPriceData) => void> = new Map();
  private isPolling = false;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    // Initialize Hermes client
    this.client = new HermesClient("https://hermes.pyth.network");
    
    // Initialize cache for each token
    Object.keys(PYTH_PRICE_IDS).forEach(token => {
      this.priceCache.set(token as SupportedToken, []);
    });
  }

  static getInstance(): PythPriceService {
    if (!PythPriceService.instance) {
      PythPriceService.instance = new PythPriceService();
    }
    return PythPriceService.instance;
  }

  // Start polling prices from Hermes API
  async startStreaming(): Promise<void> {
    if (this.isPolling) {
      return;
    }

    try {
      this.isPolling = true;
      
      // Fetch initial prices immediately
      await this.fetchPrices();
      
      // Start polling for real-time updates
      this.startPolling();

    } catch (error) {
      console.error("Failed to start Pyth price polling:", error);
      this.isPolling = false;
      throw error;
    }
  }
  
  // Start polling for price updates
  private startPolling(): void {
    // Clear any existing polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // Poll every second for real-time updates
    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchPrices();
      } catch {
        // Silently handle polling errors to avoid log spam
      }
    }, 1000);
  }

  // Fetch latest prices from Hermes
  private async fetchPrices(): Promise<void> {
    try {
      const priceIds = Object.values(PYTH_PRICE_IDS);
      
      // Fetch latest price updates from Hermes
      const priceUpdates = await this.client.getLatestPriceUpdates(priceIds);
      
      if (priceUpdates && priceUpdates.parsed) {
        this.processPriceUpdates(priceUpdates.parsed);
      }
    } catch {
      // Silently handle fetch errors
    }
  }

  // Process price updates
  private processPriceUpdates(updates: any[]): void {
    updates.forEach(update => {
      // Find which token this price ID belongs to
      const token = this.getTokenFromPriceId(update.id);
      if (!token) {
        return;
      }

      // Calculate actual price from Pyth format
      const price = parseFloat(update.price.price) * Math.pow(10, update.price.expo);
      const confidence = parseFloat(update.price.conf) * Math.pow(10, update.price.expo);

      const priceData: StreamedPriceData = {
        token,
        price,
        timestamp: Date.now(), // Use current time for real-time updates to ensure unique timestamps
        confidence,
      };

      // Update cache with sliding window
      this.updatePriceCache(token, priceData);

      // Notify subscribers
      this.notifySubscribers(token, priceData);
    });
  }

  // Update price cache with sliding window
  private updatePriceCache(token: SupportedToken, data: StreamedPriceData): void {
    const cache = this.priceCache.get(token) || [];
    
    // Add new data point
    cache.push(data);
    
    // Maintain sliding window (keep last 30 data points for 1s chart)
    const maxCacheSize = 30;
    while (cache.length > maxCacheSize) {
      cache.shift();
    }
    
    this.priceCache.set(token, cache);
  }

  // Get token from price ID
  private getTokenFromPriceId(priceId: string): SupportedToken | null {
    // Remove 0x prefix if present for comparison
    const normalizedId = priceId.startsWith("0x") ? priceId : `0x${priceId}`;
    
    for (const [token, id] of Object.entries(PYTH_PRICE_IDS)) {
      if (id === normalizedId) {
        return token as SupportedToken;
      }
    }
    return null;
  }

  // Subscribe to price updates for a specific token
  subscribe(token: SupportedToken, callback: (data: StreamedPriceData) => void): string {
    const subscriptionId = `${token}_${Date.now()}_${Math.random()}`;
    this.subscribers.set(subscriptionId, callback);
    
    // Send latest cached price immediately if available
    const cache = this.priceCache.get(token);
    if (cache && cache.length > 0) {
      callback(cache[cache.length - 1]);
    }
    
    return subscriptionId;
  }

  // Unsubscribe from price updates
  unsubscribe(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
  }

  // Notify all subscribers for a token
  private notifySubscribers(token: SupportedToken, data: StreamedPriceData): void {
    this.subscribers.forEach((callback, id) => {
      if (id.startsWith(token)) {
        callback(data);
      }
    });
  }

  // Get cached prices for a token
  getCachedPrices(token: SupportedToken, limit?: number): StreamedPriceData[] {
    const cache = this.priceCache.get(token) || [];
    if (limit) {
      return cache.slice(-limit);
    }
    return [...cache];
  }

  // Get latest price for a token
  getLatestPrice(token: SupportedToken): StreamedPriceData | null {
    const cache = this.priceCache.get(token);
    if (cache && cache.length > 0) {
      return cache[cache.length - 1];
    }
    return null;
  }

  // Stop polling
  stopStreaming(): void {
    this.isPolling = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Clear all cached data
  clearCache(): void {
    this.priceCache.clear();
    Object.keys(PYTH_PRICE_IDS).forEach(token => {
      this.priceCache.set(token as SupportedToken, []);
    });
  }

  // Get polling status
  isActive(): boolean {
    return this.isPolling;
  }
}

// Export singleton instance
export const pythPriceService = PythPriceService.getInstance();