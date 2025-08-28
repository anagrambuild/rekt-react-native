import { createContext, useContext, useEffect, useState } from "react";

import { fetchTokenPrices, SupportedToken, TokenPrice } from "@/utils";
import {
  ClosePositionRequest,
  OpenPositionRequest,
  Position,
  TradingBalance,
} from "@/utils/backendApi";
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
  isTrading: boolean;
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
  selectedTimeframe: "1m",
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

export const HomeProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const { usdcBalance } = useWallet();
  const { userId } = useProfileContext();
  const [selectedToken, setSelectedToken] = useState<string>("sol");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1m");
  const [solTrade, setSolTrade] = useState<Trade | null>(null);
  const [ethTrade, setEthTrade] = useState<Trade | null>(null);
  const [btcTrade, setBtcTrade] = useState<Trade | null>(null);

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

  // Trading action state
  const isTrading =
    openPositionMutation.isPending || closePositionMutation.isPending;

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
    if (!userId) {
      Toast.show({
        text1: t("Error"),
        text2: t("Profile not found. Please try again."),
        type: "error",
      });
      return false;
    }

    try {
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

      Toast.show({
        text1: t("Position Opened"),
        text2: t("Position opened successfully!"),
        type: "success",
      });

      // Update local trade state to reflect the successful trade
      const token =
        market === "SOL" ? "sol" : market === "ETH" ? "eth" : "btc";
      const currentTrade =
        token === "sol" ? solTrade : token === "eth" ? ethTrade : btcTrade;
      const updatedTrade = {
        ...currentTrade,
        side: direction,
        entryPrice: position.entryPrice,
        amount: validAmount,
        leverage: validLeverage,
        status: "open" as TradeStatus,
        timestamp: Date.now(),
      };

      if (token === "sol") {
        setSolTrade(updatedTrade);
      } else if (token === "eth") {
        setEthTrade(updatedTrade);
      } else {
        setBtcTrade(updatedTrade);
      }

      return true;
    } catch (error) {
      console.error("Error opening position:", error);
      Toast.show({
        text1: t("Trade Failed"),
        text2:
          error instanceof Error ? error.message : t("Failed to open position"),
        type: "error",
      });
      return false;
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

    try {
      // Use React Query mutation for closing position
      const closeRequest: ClosePositionRequest = {
        userId,
        positionId,
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
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
];
