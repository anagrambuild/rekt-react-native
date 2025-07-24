const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  last_updated: string;
}

export interface CoinGeckoPriceResponse {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export const SUPPORTED_TOKENS = {
  sol: 'solana',
  eth: 'ethereum', 
  btc: 'bitcoin',
} as const;

export type SupportedToken = keyof typeof SUPPORTED_TOKENS;

export const fetchTokenPrices = async (
  tokens: SupportedToken[] = ['sol', 'eth', 'btc']
): Promise<Record<SupportedToken, TokenPrice>> => {
  const coinIds = tokens.map(token => SUPPORTED_TOKENS[token]).join(',');
  
  const response = await fetch(
    `${COINGECKO_BASE_URL}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true`
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API Error: ${response.status} ${response.statusText}`);
  }

  const data: CoinGeckoPriceResponse = await response.json();
  
  const result: Record<SupportedToken, TokenPrice> = {} as any;
  
  tokens.forEach(token => {
    const coinId = SUPPORTED_TOKENS[token];
    const priceData = data[coinId];
    
    if (priceData) {
      result[token] = {
        id: coinId,
        symbol: token.toUpperCase(),
        name: token === 'sol' ? 'Solana' : token === 'eth' ? 'Ethereum' : 'Bitcoin',
        current_price: priceData.usd,
        price_change_24h: priceData.usd_24h_change || 0,
        price_change_percentage_24h: priceData.usd_24h_change || 0,
        market_cap: 0, // Will be populated if needed
        total_volume: 0, // Will be populated if needed
        last_updated: new Date().toISOString(),
      };
    }
  });

  return result;
};

export const fetchSingleTokenPrice = async (token: SupportedToken): Promise<TokenPrice> => {
  const prices = await fetchTokenPrices([token]);
  return prices[token];
};

export interface ChartDataPoint {
  value: number;
  timestamp?: number;
}

export interface HistoricalDataResponse {
  prices: [number, number][]; // [timestamp, price]
}

// Map timeframe to CoinGecko API parameters
const TIMEFRAME_MAP = {
  '1m': { days: '1', interval: 'minutely' },
  '2m': { days: '1', interval: 'minutely' },
  '5m': { days: '1', interval: 'minutely' },
  '10m': { days: '1', interval: 'minutely' },
  '1h': { days: '1', interval: 'hourly' },
  '4h': { days: '7', interval: 'hourly' },
  '1d': { days: '30', interval: 'daily' },
} as const;

export type SupportedTimeframe = keyof typeof TIMEFRAME_MAP;

export const fetchHistoricalData = async (
  token: SupportedToken,
  timeframe: SupportedTimeframe = '1m'
): Promise<ChartDataPoint[]> => {
  const coinId = SUPPORTED_TOKENS[token];
  const { days, interval } = TIMEFRAME_MAP[timeframe];
  
  const response = await fetch(
    `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`
  );

  if (!response.ok) {
    throw new Error(`CoinGecko Historical API Error: ${response.status} ${response.statusText}`);
  }

  const data: HistoricalDataResponse = await response.json();
  
  // Convert to chart format and filter based on timeframe
  let chartData = data.prices.map(([timestamp, price]) => ({
    value: price,
    timestamp,
  }));

  // For minute-based timeframes, filter to get the right interval
  if (timeframe === '2m') {
    chartData = chartData.filter((_, index) => index % 2 === 0);
  } else if (timeframe === '5m') {
    chartData = chartData.filter((_, index) => index % 5 === 0);
  } else if (timeframe === '10m') {
    chartData = chartData.filter((_, index) => index % 10 === 0);
  }

  // Limit to last 50 points for performance
  return chartData.slice(-50);
};

// Get current price from historical data (most recent point)
export const getCurrentPriceFromHistorical = (data: ChartDataPoint[]): number => {
  return data.length > 0 ? data[data.length - 1].value : 0;
};

// Calculate percentage change from first to last data point
export const calculatePriceChange = (data: ChartDataPoint[]): {
  change: number;
  changePercent: number;
} => {
  if (data.length < 2) return { change: 0, changePercent: 0 };
  
  const firstPrice = data[0].value;
  const lastPrice = data[data.length - 1].value;
  const change = lastPrice - firstPrice;
  const changePercent = (change / firstPrice) * 100;
  
  return { change, changePercent };
};