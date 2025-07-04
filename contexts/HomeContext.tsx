import { createContext, useContext, useState } from 'react';

interface HomeContextType {
  selectedToken: string;
  setSelectedToken: (token: string) => void;
  selectedTimeframe: string;
  setSelectedTimeframe: (timeframe: string) => void;
  priceChartTimeframes: { label: string; value: string }[];
  tradeSide: 'long' | 'short' | null;
  setTradeSide: (side: 'long' | 'short' | null) => void;
}

export const HomeContext = createContext<HomeContextType>({
  selectedToken: 'sol',
  setSelectedToken: () => {},
  selectedTimeframe: '1m',
  setSelectedTimeframe: () => {},
  priceChartTimeframes: [],
  tradeSide: null,
  setTradeSide: () => {},
});

export const useHomeContext = () => {
  return useContext(HomeContext);
};

export const HomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedToken, setSelectedToken] = useState<string>('sol');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1m');
  const [tradeSide, setTradeSide] = useState<'long' | 'short' | null>(null);

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
