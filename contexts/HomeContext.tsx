import { createContext, useContext, useEffect, useState } from 'react';

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
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

const priceChartTimeframes = [
  { label: '1m', value: '1m' },
  { label: '2m', value: '2m' },
  { label: '5m', value: '5m' },
  { label: '10m', value: '10m' },
];
