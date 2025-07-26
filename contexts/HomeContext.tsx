import { createContext, useContext, useEffect, useState } from 'react';

import { currentPrices } from '@/screens/HomeScreen/mockData';
import { SupportedToken, TokenPrice } from '@/utils';

// Trade type for active trades
export type TradeStatus = 'open' | 'closed';
export interface Trade {
  side: 'long' | 'short';
  entryPrice: number;
  amount: number;
  leverage: number;
  status: TradeStatus;
  pnl?: number; // optional, for display
  timestamp?: number;
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
}

export const HomeContext = createContext<HomeContextType>({
  selectedToken: 'sol',
  setSelectedToken: () => {},
  selectedTimeframe: '1m',
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
});

export const useHomeContext = () => {
  return useContext(HomeContext);
};

export const HomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedToken, setSelectedToken] = useState<string>('sol');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1m');
  const [solTrade, setSolTrade] = useState<Trade | null>(null);
  const [ethTrade, setEthTrade] = useState<Trade | null>(null);
  const [btcTrade, setBtcTrade] = useState<Trade | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Use mock token prices instead of API
  const [tokenPrices] = useState<Record<SupportedToken, TokenPrice>>({
    sol: {
      id: 'solana',
      symbol: 'SOL',
      name: 'Solana',
      current_price: currentPrices.sol,
      price_change_24h: 2.5,
      price_change_percentage_24h: 1.5,
      market_cap: 85000000000,
      total_volume: 2500000000,
      last_updated: new Date().toISOString(),
    },
    eth: {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      current_price: currentPrices.eth,
      price_change_24h: 45.2,
      price_change_percentage_24h: 1.8,
      market_cap: 310000000000,
      total_volume: 15000000000,
      last_updated: new Date().toISOString(),
    },
    btc: {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      current_price: currentPrices.btc,
      price_change_24h: 1200,
      price_change_percentage_24h: 1.1,
      market_cap: 2100000000000,
      total_volume: 25000000000,
      last_updated: new Date().toISOString(),
    },
  });
  const isPricesLoading = false;
  const pricesError = null;

  useEffect(() => {
    // TODO - fetch real wallet balance
    const fetchWalletBalance = async () => {
      // const balance = await getWalletBalance();
      setWalletBalance(1004.56);
    };
    fetchWalletBalance();
  }, []);

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
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

const priceChartTimeframes = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];
