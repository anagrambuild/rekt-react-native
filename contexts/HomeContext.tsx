import { createContext, useContext, useEffect, useState } from "react";

import { fetchTokenPrices, SupportedToken, TokenPrice } from "@/utils";
import {
  getOpenPositions,
  getTradingBalance,
  getTradingHistory,
  Position,
  TradingBalance,
} from "@/utils/backendApi";
import { TradingService } from "@/utils/tradingService";

import { useProfileContext } from "./ProfileContext";
import { useSolana } from "./SolanaContext";
import { useWallet } from "./WalletContext";
import { useTranslation } from "react-i18next";
import { Toast } from "toastify-react-native";

// Trade type for active trades (keeping for backward compatibility)
export type TradeStatus = "draft" | "open" | "closed";
export interface Trade {
  side: "long" | "short";
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
    asset: "SOL-PERP" | "BTC-PERP" | "ETH-PERP",
    direction: "long" | "short",
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
  const { connection } = useSolana();
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

  // Trading balance state
  const [balance, setBalance] = useState<TradingBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Positions state
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);

  // History state
  const [tradingHistory, setTradingHistory] = useState<Position[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Trading action state
  const [isTrading, setIsTrading] = useState(false);

  // Refresh balance
  const refreshBalance = async () => {
    if (!userId) return;

    setIsLoadingBalance(true);
    setBalanceError(null);

    try {
      const balanceData = await getTradingBalance(userId);
      setBalance(balanceData);
    } catch (error) {
      // console.error("Error refreshing balance:", error);
      setBalanceError(
        error instanceof Error ? error.message : "Failed to load balance"
      );
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Refresh positions
  const refreshPositions = async () => {
    if (!userId) return;

    setIsLoadingPositions(true);
    setPositionsError(null);

    try {
      const positions = await getOpenPositions(userId);
      setOpenPositions(positions);
    } catch (error) {
      // console.error('Error refreshing positions:', error);
      setPositionsError(
        error instanceof Error ? error.message : "Failed to load positions"
      );
    } finally {
      setIsLoadingPositions(false);
    }
  };

  // Refresh history
  const refreshHistory = async () => {
    if (!userId) return;

    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const history = await getTradingHistory(userId);
      setTradingHistory(history);
    } catch (error) {
      // console.error('Error refreshing history:', error);
      setHistoryError(
        error instanceof Error ? error.message : "Failed to load history"
      );
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([refreshBalance(), refreshPositions(), refreshHistory()]);
  };

  // Open a new position using Swig trading flow
  const openPosition = async (
    asset: "SOL-PERP" | "BTC-PERP" | "ETH-PERP",
    direction: "long" | "short",
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

    setIsTrading(true);

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

      // Use the new trading service for complete flow
      const tradingService = new TradingService(connection);
      const result = await tradingService.executeTrade({
        asset,
        direction,
        amount: validAmount,
        leverage: validLeverage,
      });

      if (result.success) {
        Toast.show({
          text1: t("Position Opened"),
          text2: t("Position opened successfully!"),
          type: "success",
        });

        // Update local trade state to reflect the successful trade
        const token =
          asset === "SOL-PERP" ? "sol" : asset === "ETH-PERP" ? "eth" : "btc";
        const currentTrade =
          token === "sol" ? solTrade : token === "eth" ? ethTrade : btcTrade;
        const updatedTrade = {
          ...currentTrade,
          side: direction,
          entryPrice: 0, // Will be updated when positions refresh
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

        // Refresh data after successful trade
        await refreshAll();
        return true;
      } else if (result.requiresInitialization) {
        // Handle initialization requirement
        Toast.show({
          text1: t("Initialization Required"),
          text2: t(
            "Your Drift account needs to be initialized first. Please try again."
          ),
          type: "info",
        });

        if (result.initializationData) {
          // Attempt to initialize automatically
          const initResult = await tradingService.initializeDriftAccount(
            result.initializationData
          );
          if (initResult.success) {
            Toast.show({
              text1: t("Account Initialized"),
              text2: t(
                "Your Drift account has been initialized. Please try your trade again."
              ),
              type: "success",
            });
          } else {
            Toast.show({
              text1: t("Initialization Failed"),
              text2: initResult.error || t("Failed to initialize account"),
              type: "error",
            });
          }
        }
        return false;
      } else {
        Toast.show({
          text1: t("Trade Failed"),
          text2: result.error || t("Failed to open position"),
          type: "error",
        });
        return false;
      }
    } catch (error) {
      console.error("Error opening position:", error);
      Toast.show({
        text1: t("Trade Failed"),
        text2:
          error instanceof Error ? error.message : t("Failed to open position"),
        type: "error",
      });
      return false;
    } finally {
      setIsTrading(false);
    }
  };

  // Close a position using Swig trading flow
  const closePosition = async (positionId: string): Promise<boolean> => {
    if (!userId) {
      Toast.show({
        text1: t("Error"),
        text2: t("Profile not found. Please try again."),
        type: "error",
      });
      return false;
    }

    setIsTrading(true);

    try {
      // Use the new trading service for complete flow
      const tradingService = new TradingService(connection);
      const result = await tradingService.closePosition(positionId);

      if (result.success) {
        const pnlData = result.data;
        const pnlText = pnlData?.pnl
          ? pnlData.pnl >= 0
            ? `+$${pnlData.pnl.toFixed(2)}`
            : `$${pnlData.pnl.toFixed(2)}`
          : "N/A";

        Toast.show({
          text1: t("Position Closed"),
          text2: pnlData?.pnl
            ? t("Position closed with PnL: {{pnl}} ({{percentage}}%)", {
                pnl: pnlText,
                percentage: pnlData.pnlPercentage?.toFixed(2) || "0.00",
              })
            : t("Position closed successfully"),
          type: "success",
        });

        // Refresh data after successful close
        await refreshAll();
        return true;
      } else {
        Toast.show({
          text1: t("Close Failed"),
          text2: result.error || t("Failed to close position"),
          type: "error",
        });
        return false;
      }
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
      setIsTrading(false);
    }
  };

  // Load initial data when profile ID is available
  useEffect(() => {
    if (userId) {
      refreshAll();

      // Set up interval to refresh positions every 10 seconds for live PnL
      const interval = setInterval(refreshPositions, 10000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
        balance,
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
