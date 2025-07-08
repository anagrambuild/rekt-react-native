import { createContext, useContext, useEffect, useState } from 'react';

interface HomeContextType {
  selectedToken: string;
  setSelectedToken: (token: string) => void;
  selectedTimeframe: string;
  setSelectedTimeframe: (timeframe: string) => void;
  priceChartTimeframes: { label: string; value: string }[];
  solTradeSide: 'long' | 'short';
  setSolTradeSide: (side: 'long' | 'short') => void;
  ethTradeSide: 'long' | 'short';
  setEthTradeSide: (side: 'long' | 'short') => void;
  btcTradeSide: 'long' | 'short';
  setBtcTradeSide: (side: 'long' | 'short') => void;
  solAmount: number;
  setSolAmount: (amount: number) => void;
  ethAmount: number;
  setEthAmount: (amount: number) => void;
  btcAmount: number;
  setBtcAmount: (amount: number) => void;
  solLeverage: number;
  setSolLeverage: (leverage: number) => void;
  ethLeverage: number;
  setEthLeverage: (leverage: number) => void;
  btcLeverage: number;
  setBtcLeverage: (leverage: number) => void;
  walletBalance: number;
}

export const HomeContext = createContext<HomeContextType>({
  selectedToken: 'sol',
  setSelectedToken: () => {},
  selectedTimeframe: '1m',
  setSelectedTimeframe: () => {},
  priceChartTimeframes: [],
  solTradeSide: 'short',
  setSolTradeSide: () => {},
  ethTradeSide: 'short',
  setEthTradeSide: () => {},
  btcTradeSide: 'short',
  setBtcTradeSide: () => {},
  solAmount: 0,
  setSolAmount: () => {},
  ethAmount: 0,
  setEthAmount: () => {},
  btcAmount: 0,
  setBtcAmount: () => {},
  solLeverage: 1,
  setSolLeverage: () => {},
  ethLeverage: 1,
  setEthLeverage: () => {},
  btcLeverage: 1,
  setBtcLeverage: () => {},
  walletBalance: 0,
});

export const useHomeContext = () => {
  return useContext(HomeContext);
};

export const HomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedToken, setSelectedToken] = useState<string>('sol');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1m');
  const [solTradeSide, setSolTradeSide] = useState<'long' | 'short'>('short');
  const [ethTradeSide, setEthTradeSide] = useState<'long' | 'short'>('short');
  const [btcTradeSide, setBtcTradeSide] = useState<'long' | 'short'>('short');
  const [solAmount, setSolAmount] = useState<number>(10);
  const [ethAmount, setEthAmount] = useState<number>(10);
  const [btcAmount, setBtcAmount] = useState<number>(10);

  const [solLeverage, setSolLeverage] = useState<number>(1);
  const [ethLeverage, setEthLeverage] = useState<number>(1);
  const [btcLeverage, setBtcLeverage] = useState<number>(1);

  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    // TODO - fetch real wallet balance
    const fetchWalletBalance = async () => {
      // const balance = await getWalletBalance();
      setWalletBalance(1004.56);
    };
    fetchWalletBalance();
  }, []);

  const setLeverage = (val: number) => {
    _setLeverage(val === 0 ? 1 : val);
  };

  return (
    <HomeContext.Provider
      value={{
        selectedToken,
        setSelectedToken,
        selectedTimeframe,
        setSelectedTimeframe,
        priceChartTimeframes,
        solTradeSide,
        setSolTradeSide,
        ethTradeSide,
        setEthTradeSide,
        btcTradeSide,
        setBtcTradeSide,
        solAmount,
        setSolAmount,
        ethAmount,
        setEthAmount,
        btcAmount,
        setBtcAmount,
        solLeverage,
        setSolLeverage,
        ethLeverage,
        setEthLeverage,
        btcLeverage,
        setBtcLeverage,
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
