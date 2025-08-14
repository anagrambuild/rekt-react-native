import Constants from 'expo-constants';

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'price_update' | 'set_wallet';
  channel?: string;
  symbol?: string;
  walletAddress?: string;
  data?: any;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(url?: string) {
    // Use WebSocket URL from config, convert HTTP to WebSocket protocol
    const apiUrl = Constants.expoConfig?.extra?.apiUrl;
    const wsUrl = apiUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    this.url = url || wsUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    if (message.type === 'price_update') {
      const listeners = this.listeners.get('price_update');
      if (listeners) {
        listeners.forEach((callback) => callback(message.data));
      }
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  subscribe(channel: string, symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'subscribe',
        channel,
        symbol,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  unsubscribe(channel: string, symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'unsubscribe',
        channel,
        symbol,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  setWallet(walletAddress: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'set_wallet',
        walletAddress,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  onPriceUpdate(callback: (data: PriceUpdate) => void) {
    if (!this.listeners.has('price_update')) {
      this.listeners.set('price_update', new Set());
    }
    this.listeners.get('price_update')!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get('price_update');
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
