import { Connection } from '@solana/web3.js';

import { SwigTransactionData } from './swigTradingUtils';
import { ExecuteTradeParams, TradingService } from './tradingService';

export interface TradingFlowState {
  isTrading: boolean;
  isInitializing: boolean;
  error: string | null;
  requiresInitialization: boolean;
  initializationData: SwigTransactionData | null;
  lastTradeResult: any | null;
}

export interface TradingFlowCallbacks {
  onTradeStart?: () => void;
  onTradeSuccess?: (result: any) => void;
  onTradeError?: (error: string) => void;
  onInitializationRequired?: (data: SwigTransactionData) => void;
  onInitializationStart?: () => void;
  onInitializationSuccess?: (result: any) => void;
  onInitializationError?: (error: string) => void;
}

/**
 * High-level trading flow manager that handles the complete user experience
 * including initialization, error handling, and state management
 */
export class TradingFlowManager {
  private tradingService: TradingService;
  private state: TradingFlowState;
  private callbacks: TradingFlowCallbacks;

  constructor(connection: Connection, callbacks: TradingFlowCallbacks = {}) {
    this.tradingService = new TradingService(connection);
    this.callbacks = callbacks;
    this.state = {
      isTrading: false,
      isInitializing: false,
      error: null,
      requiresInitialization: false,
      initializationData: null,
      lastTradeResult: null,
    };
  }

  /**
   * Get current trading flow state
   */
  getState(): TradingFlowState {
    return { ...this.state };
  }

  /**
   * Execute a trade with full flow management
   */
  async executeTrade(params: ExecuteTradeParams): Promise<void> {
    try {
      this.setState({
        isTrading: true,
        error: null,
        requiresInitialization: false,
        initializationData: null,
      });

      this.callbacks.onTradeStart?.();

      console.log('🎯 TradingFlowManager: Starting trade execution');
      const result = await this.tradingService.executeTrade(params);

      if (result.success) {
        console.log('✅ TradingFlowManager: Trade completed successfully');
        this.setState({
          isTrading: false,
          lastTradeResult: result.data,
        });
        this.callbacks.onTradeSuccess?.(result.data);
      } else if (result.requiresInitialization && result.initializationData) {
        console.log('⚠️ TradingFlowManager: Initialization required');
        this.setState({
          isTrading: false,
          requiresInitialization: true,
          initializationData: result.initializationData,
          error: result.error || null,
        });
        this.callbacks.onInitializationRequired?.(result.initializationData);
      } else {
        console.error('❌ TradingFlowManager: Trade failed:', result.error);
        this.setState({
          isTrading: false,
          error: result.error || 'Unknown trade error',
        });
        this.callbacks.onTradeError?.(result.error || 'Unknown trade error');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        '❌ TradingFlowManager: Trade execution threw error:',
        error
      );
      this.setState({
        isTrading: false,
        error: errorMessage,
      });
      this.callbacks.onTradeError?.(errorMessage);
    }
  }

  /**
   * Handle Drift account initialization
   */
  async initializeDriftAccount(): Promise<void> {
    if (!this.state.initializationData) {
      const error = 'No initialization data available';
      this.setState({ error });
      this.callbacks.onInitializationError?.(error);
      return;
    }

    try {
      this.setState({
        isInitializing: true,
        error: null,
      });

      this.callbacks.onInitializationStart?.();

      console.log('🔧 TradingFlowManager: Starting Drift initialization');
      const result = await this.tradingService.initializeDriftAccount(
        this.state.initializationData
      );

      if (result.success) {
        console.log(
          '✅ TradingFlowManager: Initialization completed successfully'
        );
        this.setState({
          isInitializing: false,
          requiresInitialization: false,
          initializationData: null,
        });
        this.callbacks.onInitializationSuccess?.(result.data);
      } else {
        console.error(
          '❌ TradingFlowManager: Initialization failed:',
          result.error
        );
        this.setState({
          isInitializing: false,
          error: result.error || 'Initialization failed',
        });
        this.callbacks.onInitializationError?.(
          result.error || 'Initialization failed'
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown initialization error';
      console.error(
        '❌ TradingFlowManager: Initialization threw error:',
        error
      );
      this.setState({
        isInitializing: false,
        error: errorMessage,
      });
      this.callbacks.onInitializationError?.(errorMessage);
    }
  }

  /**
   * Close a position
   */
  async closePosition(positionId: string): Promise<void> {
    try {
      this.setState({
        isTrading: true,
        error: null,
      });

      console.log('🔒 TradingFlowManager: Closing position:', positionId);
      const result = await this.tradingService.closePosition(positionId);

      if (result.success) {
        console.log('✅ TradingFlowManager: Position closed successfully');
        this.setState({
          isTrading: false,
          lastTradeResult: result.data,
        });
        this.callbacks.onTradeSuccess?.(result.data);
      } else {
        console.error(
          '❌ TradingFlowManager: Position close failed:',
          result.error
        );
        this.setState({
          isTrading: false,
          error: result.error || 'Position close failed',
        });
        this.callbacks.onTradeError?.(result.error || 'Position close failed');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown close error';
      console.error(
        '❌ TradingFlowManager: Position close threw error:',
        error
      );
      this.setState({
        isTrading: false,
        error: errorMessage,
      });
      this.callbacks.onTradeError?.(errorMessage);
    }
  }

  /**
   * Get user positions
   */
  async getPositions() {
    return this.tradingService.getPositions();
  }

  /**
   * Get trading history
   */
  async getHistory(status?: 'open' | 'closed') {
    return this.tradingService.getHistory(status);
  }

  /**
   * Clear any errors
   */
  clearError(): void {
    this.setState({ error: null });
  }

  /**
   * Reset the entire state
   */
  reset(): void {
    this.state = {
      isTrading: false,
      isInitializing: false,
      error: null,
      requiresInitialization: false,
      initializationData: null,
      lastTradeResult: null,
    };
  }

  /**
   * Private method to update state
   */
  private setState(updates: Partial<TradingFlowState>): void {
    this.state = { ...this.state, ...updates };
  }
}

/**
 * Hook-like function to create and manage a trading flow manager
 */
export const createTradingFlowManager = (
  connection: Connection,
  callbacks: TradingFlowCallbacks = {}
): TradingFlowManager => {
  return new TradingFlowManager(connection, callbacks);
};
