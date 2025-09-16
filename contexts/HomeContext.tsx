import { createContext, useContext, useEffect, useRef, useState } from "react";

import { fetchTokenPrices, SupportedToken, TokenPrice } from "@/utils";
import {
  ClosePositionRequest,
  OpenPositionRequest,
  Position,
  TradingBalance,
} from "@/utils/backendApi";
import { queryClient } from "@/utils/queryClient";
import {
  useClosePositionMutation,
  useOpenPositionMutation,
  useOpenPositionsQuery,
  useTradingBalanceQuery,
  useTradingHistoryQuery,
} from "@/utils/queryUtils";

import { useProfileContext } from "./ProfileContext";
import { useWallet } from "./WalletContext";
import { useTranslation } from "react-i18next";
import { Toast } from "toastify-react-native";

// Trade type for active trades (keeping for backward compatibility)
export type TradeStatus = "draft" | "open" | "closed";
export interface Trade {
  side: "LONG" | "SHORT";
  entryPrice: number;
  amount: number;
  leverage: number;
  status: TradeStatus;
  pnl?: number; // optional, for display
  timestamp?: number;
  isMaxLeverageOn?: boolean; // for slider max leverage toggle
  positionId?: string; // backend position ID for closing trades
}

interface HomeContextType {
  selectedToken: string;
  setSelectedToken: (token: string) => void;
  selectedTimeframe: string;
  setSelectedTimeframe: (timeframe: string) => void;
  priceChartTimeframes: { label: string; value: string }[];
  solTrade: Trade | null;
  setSolTrade: (trade: Trade | null) => void;
  ethTrade: Trade | null;
  setEthTrade: (trade: Trade | null) => void;
  btcTrade: Trade | null;
  setBtcTrade: (trade: Trade | null) => void;
  walletBalance: number;
  tokenPrices: Record<SupportedToken, TokenPrice> | undefined;
  isPricesLoading: boolean;
  pricesError: Error | null;

  // Trading functionality
  balance: TradingBalance | null;
  isLoadingBalance: boolean;
  balanceError: string | null;
  openPositions: Position[];
  isLoadingPositions: boolean;
  positionsError: string | null;
  tradingHistory: Position[];
  isLoadingHistory: boolean;
  historyError: string | null;
  tradingStates: {
    SOL: boolean;
    ETH: boolean;
    BTC: boolean;
  };
  isTrading: boolean; // Deprecated: use tradingStates instead
  openPosition: (
    market: "SOL" | "BTC" | "ETH",
    direction: "LONG" | "SHORT",
    amount: number,
    leverage: number
  ) => Promise<boolean>;
  closePosition: (positionId: string) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const HomeContext = createContext<HomeContextType>({
  selectedToken: "sol",
  setSelectedToken: () => {},
  selectedTimeframe: "1s",
  setSelectedTimeframe: () => {},
  priceChartTimeframes: [],
  solTrade: null,
  setSolTrade: () => {},
  ethTrade: null,
  setEthTrade: () => {},
  btcTrade: null,
  setBtcTrade: () => {},
  walletBalance: 0,
  tokenPrices: undefined,
  isPricesLoading: false,
  pricesError: null,
  balance: null,
  isLoadingBalance: false,
  balanceError: null,
  openPositions: [],
  isLoadingPositions: false,
  positionsError: null,
  tradingHistory: [],
  isLoadingHistory: false,
  historyError: null,
  tradingStates: {
    SOL: false,
    ETH: false,
    BTC: false,
  },
  isTrading: false,
  openPosition: async () => false,
  closePosition: async () => false,
  refreshBalance: async () => {},
  refreshPositions: async () => {},
  refreshHistory: async () => {},
  refreshAll: async () => {},
});

export const useHomeContext = () => {
  return useContext(HomeContext);
};

export const HomeProvider = ({
  children,
  userProfile,
}: {
  children: React.ReactNode;
  userProfile: any | null;
}) => {
  const { t } = useTranslation();
  const { usdcBalance } = useWallet();
  const { userId } = useProfileContext();
  const [selectedToken, setSelectedToken] = useState<string>("sol");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1s");
  const [solTrade, setSolTrade] = useState<Trade | null>(null);
  const [ethTrade, setEthTrade] = useState<Trade | null>(null);
  const [btcTrade, setBtcTrade] = useState<Trade | null>(null);

  // Market-specific trading states
  const [tradingStates, setTradingStates] = useState({
    SOL: false,
    ETH: false,
    BTC: false,
  });

  // Use refs to track ongoing operations and prevent double execution
  const ongoingOperations = useRef<Set<string>>(new Set());

  // Fetch real token prices from backend API
  const [tokenPrices, setTokenPrices] = useState<
    Record<SupportedToken, TokenPrice> | undefined
  >(undefined);
  const [isPricesLoading, setIsPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState<Error | null>(null);

  // Use React Query hooks for trading data
  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceQueryError,
    refetch: refetchBalance,
  } = useTradingBalanceQuery(userId || "", { enabled: !!userId });

  const {
    data: openPositions = [],
    isLoading: isLoadingPositions,
    error: positionsQueryError,
    refetch: refetchPositions,
  } = useOpenPositionsQuery(userId || "", { enabled: !!userId });
  console.log("openPositions", openPositions);

  const {
    data: tradingHistory = [],
    isLoading: isLoadingHistory,
    error: historyQueryError,
    refetch: refetchHistory,
  } = useTradingHistoryQuery(userId || "", undefined, 50, 0, {
    enabled: !!userId,
  });

  // React Query mutations for trading actions
  const openPositionMutation = useOpenPositionMutation();
  const closePositionMutation = useClosePositionMutation();

  // Convert query errors to strings for backward compatibility
  const balanceError = balanceQueryError?.message || null;
  const positionsError = positionsQueryError?.message || null;
  const historyError = historyQueryError?.message || null;

  // Trading action state (deprecated - use tradingStates instead)
  const isTrading =
    openPositionMutation.isPending ||
    closePositionMutation.isPending ||
    tradingStates.SOL ||
    tradingStates.ETH ||
    tradingStates.BTC;

  // Refresh functions using React Query refetch
  const refreshBalance = async () => {
    if (!userId) return;
    await refetchBalance();
  };

  const refreshPositions = async () => {
    if (!userId) return;
    await refetchPositions();
  };

  const refreshHistory = async () => {
    if (!userId) return;
    await refetchHistory();
  };

  // Refresh all data
  const refreshAll = async () => {
    if (!userId) return;
    await Promise.all([refetchBalance(), refetchPositions(), refetchHistory()]);
  };

  // Open a new position using React Query mutation
  const openPosition = async (
    market: "SOL" | "BTC" | "ETH",
    direction: "LONG" | "SHORT",
    amount: number,
    leverage: number
  ): Promise<boolean> => {
    // Create unique operation key for tracking
    const operationKey = `${market}-${direction}-${amount}-${leverage}-${Date.now()}`;
    const callStack = new Error().stack;

    console.log(
      `🚀 [TRADE CALL] openPosition called with key: ${operationKey}`
    );
    console.log(
      `📍 [TRADE CALL] Call stack:`,
      callStack?.split("\n").slice(0, 5).join("\n")
    );

    if (!userId) {
      Toast.show({
        text1: t("Error"),
        text2: t("Profile not found. Please try again."),
        type: "error",
      });
      return false;
    }

    // Prevent double execution using multiple guards
    if (tradingStates[market] || ongoingOperations.current.has(market)) {
      console.warn(
        `🚫 [TRADE GUARD] ${market} trade already in progress, ignoring duplicate call`
      );
      console.warn(
        `🚫 [TRADE GUARD] tradingStates[${market}]:`,
        tradingStates[market]
      );
      console.warn(
        `🚫 [TRADE GUARD] ongoingOperations.has(${market}):`,
        ongoingOperations.current.has(market)
      );
      return false;
    }

    try {
      // Mark operation as ongoing
      ongoingOperations.current.add(market);
      setTradingStates(prev => ({ ...prev, [market]: true }));

      console.log(`🚀 [TRADE START] Starting ${market} ${direction} trade:`, {
        amount,
        leverage,
        operationKey,
      });

      // Validate inputs
      const validAmount = Number(amount);
      const validLeverage = Number(leverage);

      if (!validAmount || validAmount < 10) {
        Toast.show({
          text1: t("Invalid Amount"),
          text2: t("Minimum trade amount is $10"),
          type: "error",
        });
        return false;
      }

      if (!validLeverage || validLeverage < 1) {
        Toast.show({
          text1: t("Invalid Leverage"),
          text2: t("Please enter a valid leverage of 1 or higher"),
          type: "error",
        });
        return false;
      }

      // Use React Query mutation for opening position
      const openRequest: OpenPositionRequest = {
        userId,
        market,
        direction,
        amount: validAmount,
        leverage: validLeverage,
      };

      const position = await openPositionMutation.mutateAsync(openRequest);

      console.log(`✅ [TRADE SUCCESS] ${market} trade completed:`, position.id);

      Toast.show({
        text1: t("Position Opened"),
        text2: t("Position opened successfully!"),
        type: "success",
      });

      // Force refresh positions to get real backend data
      console.log(
        `🔄 [TRADE SUCCESS] Refreshing positions data to show LiveTradeView...`
      );
      await refreshPositions();

      // Invalidate swig wallet balance after blockchain finalization
      if (userProfile?.swigWalletAddress) {
        console.log(
          "🔄 [TRADE SUCCESS] Waiting 5 seconds for blockchain finalization before refreshing swig wallet balance..."
        );
        setTimeout(() => {
          console.log(
            "🔄 [TRADE SUCCESS] Now invalidating swig wallet balance query for:",
            userProfile.swigWalletAddress
          );
          queryClient.invalidateQueries({
            queryKey: ["swigWallet", "balance", userProfile.swigWalletAddress],
          });
        }, 5000);
      }

      console.log(
        `✅ [TRADE SUCCESS] ${market} positions refreshed, UI should update when backend data loads`
      );
      return true;
    } catch (error) {
      console.error(`❌ [TRADE ERROR] ${market} trade failed:`, error);
      Toast.show({
        text1: t("Trade Failed"),
        text2:
          error instanceof Error ? error.message : t("Failed to open position"),
        type: "error",
      });
      return false;
    } finally {
      // Always cleanup both guards
      ongoingOperations.current.delete(market);
      setTradingStates(prev => ({ ...prev, [market]: false }));
      console.log(`🧹 [TRADE CLEANUP] ${market} operation completed`);
    }
  };

  // Close a position using React Query mutation
  const closePosition = async (positionId: string): Promise<boolean> => {
    if (!userId) {
      Toast.show({
        text1: t("Error"),
        text2: t("Profile not found. Please try again."),
        type: "error",
      });
      return false;
    }

    // Find the position to determine which market it belongs to
    const position = openPositions.find(p => p.id === positionId);
    const market = position?.market as "SOL" | "BTC" | "ETH" | undefined;

    // Prevent double execution if we know the market
    if (market && tradingStates[market]) {
      console.warn(
        `🚫 [CLOSE GUARD] ${market} close already in progress, ignoring duplicate call`
      );
      return false;
    }

    try {
      // Set market-specific trading state to true if we know the market
      if (market) {
        setTradingStates(prev => ({ ...prev, [market]: true }));
      }

      // Use React Query mutation for closing position
      const closeRequest: ClosePositionRequest = {
        userId,
        positionId,
        // TODO - verify that thisis the right value to use
        positionAmount: position?.size.toString(),
      };

      const closedPosition = await closePositionMutation.mutateAsync(
        closeRequest
      );

      const pnlText = closedPosition.pnl
        ? closedPosition.pnl >= 0
          ? `+$${closedPosition.pnl.toFixed(2)}`
          : `$${closedPosition.pnl.toFixed(2)}`
        : "N/A";

      Toast.show({
        text1: t("Position Closed"),
        text2: closedPosition.pnl
          ? t("Position closed with PnL: {{pnl}} ({{percentage}}%)", {
              pnl: pnlText,
              percentage: closedPosition.pnlPercentage?.toFixed(2) || "0.00",
            })
          : t("Position closed successfully"),
        type: "success",
      });

      // Invalidate swig wallet balance after blockchain finalization
      if (userProfile?.swigWalletAddress) {
        console.log(
          "🔄 [CLOSE SUCCESS] Waiting 5 seconds for blockchain finalization before refreshing swig wallet balance..."
        );
        setTimeout(() => {
          console.log(
            "🔄 [CLOSE SUCCESS] Now invalidating swig wallet balance query for:",
            userProfile.swigWalletAddress
          );
          queryClient.invalidateQueries({
            queryKey: ["swigWallet", "balance", userProfile.swigWalletAddress],
          });
        }, 5000);
      }

      return true;
    } catch (error) {
      console.error("Error closing position:", error);
      Toast.show({
        text1: t("Close Failed"),
        text2:
          error instanceof Error
            ? error.message
            : t("Failed to close position"),
        type: "error",
      });
      return false;
    } finally {
      // Always reset the trading state for this market if we know it
      if (market) {
        setTradingStates(prev => ({ ...prev, [market]: false }));
      }
    }
  };

  // React Query handles automatic refetching based on the refetchInterval in queryUtils
  // No need for manual intervals since we configured refetchInterval in the query hooks

  // Fetch token prices on component mount
  useEffect(() => {
    const loadTokenPrices = async () => {
      try {
        setIsPricesLoading(true);
        setPricesError(null);
        const prices = await fetchTokenPrices(["sol", "eth", "btc"]);
        if (prices.sol && prices.eth && prices.btc) {
          setTokenPrices(prices as Record<SupportedToken, TokenPrice>);
        }
      } catch (error) {
        // console.error('Failed to fetch token prices:', error);
        setPricesError(error as Error);
        // Fallback to mock data if API fails
        setTokenPrices({
          sol: {
            id: "solana",
            symbol: "SOL",
            name: "Solana",
            current_price: 171.9,
            price_change_24h: 2.5,
            price_change_percentage_24h: 1.5,
            market_cap: 85000000000,
            total_volume: 2500000000,
            last_updated: new Date().toISOString(),
          },
          eth: {
            id: "ethereum",
            symbol: "ETH",
            name: "Ethereum",
            current_price: 2568.45,
            price_change_24h: 45.2,
            price_change_percentage_24h: 1.8,
            market_cap: 310000000000,
            total_volume: 15000000000,
            last_updated: new Date().toISOString(),
          },
          btc: {
            id: "bitcoin",
            symbol: "BTC",
            name: "Bitcoin",
            current_price: 109200,
            price_change_24h: 1200,
            price_change_percentage_24h: 1.1,
            market_cap: 2100000000000,
            total_volume: 25000000000,
            last_updated: new Date().toISOString(),
          },
        });
      } finally {
        setIsPricesLoading(false);
      }
    };

    loadTokenPrices();
  }, []);

  // Use USDC balance from wallet context
  const walletBalance = usdcBalance || 0;

  return (
    <HomeContext.Provider
      value={{
        selectedToken,
        setSelectedToken,
        selectedTimeframe,
        setSelectedTimeframe,
        priceChartTimeframes,
        solTrade,
        setSolTrade,
        ethTrade,
        setEthTrade,
        btcTrade,
        setBtcTrade,
        walletBalance,
        tokenPrices,
        isPricesLoading,
        pricesError,
        balance: balance || null,
        isLoadingBalance,
        balanceError,
        openPositions,
        isLoadingPositions,
        positionsError,
        tradingHistory,
        isLoadingHistory,
        historyError,
        tradingStates,
        isTrading,
        openPosition,
        closePosition,
        refreshBalance,
        refreshPositions,
        refreshHistory,
        refreshAll,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

const priceChartTimeframes = [
  { label: "live", value: "1s" },
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
];
