import { useCallback, useEffect, useState } from 'react';

import { useSolana } from '../contexts/SolanaContext';
import { Position } from '../utils/backendApi';
import { SwigTransactionData } from '../utils/swigTradingUtils';
import {
  createTradingFlowManager,
  TradingFlowCallbacks,
  TradingFlowManager,
  TradingFlowState,
} from '../utils/tradingFlowManager';
import { ExecuteTradeParams } from '../utils/tradingService';

export interface UseTradingResult {
  // State
  state: TradingFlowState;
  positions: Position[];
  isLoadingPositions: boolean;

  // Actions
  executeTrade: (params: ExecuteTradeParams) => Promise<void>;
  initializeDriftAccount: () => Promise<void>;
  closePosition: (positionId: string) => Promise<void>;
  refreshPositions: () => Promise<void>;
  clearError: () => void;
  reset: () => void;

  // Computed values
  hasOpenPositions: boolean;
  totalPnL: number;
}

export interface UseTradingOptions {
  onTradeSuccess?: (result: any) => void;
  onTradeError?: (error: string) => void;
  onInitializationRequired?: (data: SwigTransactionData) => void;
  onInitializationSuccess?: (result: any) => void;
  onInitializationError?: (error: string) => void;
  autoRefreshPositions?: boolean;
  refreshInterval?: number; // in milliseconds
}

/**
 * React hook for trading functionality
 * Provides a complete interface for executing trades, managing positions, and handling initialization
 */
export const useTrading = (
  options: UseTradingOptions = {}
): UseTradingResult => {
  const { connection } = useSolana();
  const [tradingManager, setTradingManager] =
    useState<TradingFlowManager | null>(null);
  const [state, setState] = useState<TradingFlowState>({
    isTrading: false,
    isInitializing: false,
    error: null,
    requiresInitialization: false,
    initializationData: null,
    lastTradeResult: null,
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // Initialize trading manager
  useEffect(() => {
    const callbacks: TradingFlowCallbacks = {
      onTradeStart: () => {
        setState((prev) => ({ ...prev, isTrading: true, error: null }));
      },
      onTradeSuccess: (result) => {
        setState((prev) => ({
          ...prev,
          isTrading: false,
          lastTradeResult: result,
        }));
        options.onTradeSuccess?.(result);
        // Auto-refresh positions after successful trade
        if (options.autoRefreshPositions !== false) {
          refreshPositions();
        }
      },
      onTradeError: (error) => {
        setState((prev) => ({ ...prev, isTrading: false, error }));
        options.onTradeError?.(error);
      },
      onInitializationRequired: (data) => {
        setState((prev) => ({
          ...prev,
          isTrading: false,
          requiresInitialization: true,
          initializationData: data,
        }));
        options.onInitializationRequired?.(data);
      },
      onInitializationStart: () => {
        setState((prev) => ({ ...prev, isInitializing: true, error: null }));
      },
      onInitializationSuccess: (result) => {
        setState((prev) => ({
          ...prev,
          isInitializing: false,
          requiresInitialization: false,
          initializationData: null,
        }));
        options.onInitializationSuccess?.(result);
      },
      onInitializationError: (error) => {
        setState((prev) => ({ ...prev, isInitializing: false, error }));
        options.onInitializationError?.(error);
      },
    };

    const manager = createTradingFlowManager(connection, callbacks);
    setTradingManager(manager);

    return () => {
      manager.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, options]);

  // Auto-refresh positions
  useEffect(() => {
    if (options.autoRefreshPositions !== false && tradingManager) {
      refreshPositions();

      if (options.refreshInterval) {
        const interval = setInterval(refreshPositions, options.refreshInterval);
        return () => clearInterval(interval);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradingManager, options.autoRefreshPositions, options.refreshInterval]);

  // Refresh positions function
  const refreshPositions = useCallback(async () => {
    if (!tradingManager) return;

    try {
      setIsLoadingPositions(true);
      const userPositions = await tradingManager.getPositions();
      setPositions(userPositions);
    } catch (error) {
      // console.error('Error refreshing positions:', error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to load positions',
      }));
    } finally {
      setIsLoadingPositions(false);
    }
  }, [tradingManager]);

  // Trading actions
  const executeTrade = useCallback(
    async (params: ExecuteTradeParams) => {
      if (!tradingManager) {
        throw new Error('Trading manager not initialized');
      }
      await tradingManager.executeTrade(params);
    },
    [tradingManager]
  );

  const initializeDriftAccount = useCallback(async () => {
    if (!tradingManager) {
      throw new Error('Trading manager not initialized');
    }
    await tradingManager.initializeDriftAccount();
  }, [tradingManager]);

  const closePosition = useCallback(
    async (positionId: string) => {
      if (!tradingManager) {
        throw new Error('Trading manager not initialized');
      }
      await tradingManager.closePosition(positionId);
    },
    [tradingManager]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
    tradingManager?.clearError();
  }, [tradingManager]);

  const reset = useCallback(() => {
    setState({
      isTrading: false,
      isInitializing: false,
      error: null,
      requiresInitialization: false,
      initializationData: null,
      lastTradeResult: null,
    });
    setPositions([]);
    tradingManager?.reset();
  }, [tradingManager]);

  // Computed values
  const hasOpenPositions = positions.length > 0;
  const totalPnL = positions.reduce(
    (total, position) => total + (position.pnl || 0),
    0
  );

  return {
    // State
    state,
    positions,
    isLoadingPositions,

    // Actions
    executeTrade,
    initializeDriftAccount,
    closePosition,
    refreshPositions,
    clearError,
    reset,

    // Computed values
    hasOpenPositions,
    totalPnL,
  };
};

/**
 * Hook for getting trading history
 */
export const useTradingHistory = (status?: 'open' | 'closed') => {
  const { connection } = useSolana();
  const [history, setHistory] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const manager = createTradingFlowManager(connection);
      const tradingHistory = await manager.getHistory(status);
      setHistory(tradingHistory);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load trading history';
      setError(errorMessage);
      console.error('Error loading trading history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [connection, status]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  return {
    history,
    isLoading,
    error,
    refreshHistory,
  };
};
