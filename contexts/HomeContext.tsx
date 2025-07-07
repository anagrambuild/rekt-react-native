import { createContext, useContext, useState } from 'react';

interface HomeContextType {
  selectedToken: string;
  setSelectedToken: (token: string) => void;
  selectedTimeframe: string;
  setSelectedTimeframe: (timeframe: string) => void;
  priceChartTimeframes: { label: string; value: string }[];
  tradeSide: 'long' | 'short';
  setTradeSide: (side: 'long' | 'short') => void;
  amount: number;
  setAmount: (amount: number) => void;
  leverage: number;
  setLeverage: (leverage: number) => void;
}

export const HomeContext = createContext<HomeContextType>({
  selectedToken: 'sol',
  setSelectedToken: () => {},
  selectedTimeframe: '1m',
  setSelectedTimeframe: () => {},
  priceChartTimeframes: [],
  tradeSide: 'short',
  setTradeSide: () => {},
  amount: 0,
  setAmount: () => {},
  leverage: 1,
  setLeverage: () => {},
});

export const useHomeContext = () => {
  return useContext(HomeContext);
};

export const HomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedToken, setSelectedToken] = useState<string>('sol');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1m');
  const [tradeSide, setTradeSide] = useState<'long' | 'short'>('short');
  const [amount, setAmount] = useState<number>(10);
  const [leverage, _setLeverage] = useState<number>(1);

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
        tradeSide,
        setTradeSide,
        amount,
        setAmount,
        leverage,
        setLeverage,
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
