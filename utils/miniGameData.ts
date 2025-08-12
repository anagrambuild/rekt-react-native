export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
  result: 'green' | 'red' | 'pending' | 'decision' | null;
}

// Utility function to generate dummy OHLC data
export const generateDummyCandleData = (
  count: number = 10,
  startPrice: number = 65000
): CandleData[] => {
  const data: CandleData[] = [];
  let basePrice = startPrice;

  for (let i = 0; i < count; i++) {
    const volatility = basePrice * 0.02; // 2% volatility
    const trend = (Math.random() - 0.5) * volatility * 0.5; // Small trend

    const open = basePrice;
    const priceChange = (Math.random() - 0.5) * volatility;
    const close = open + priceChange + trend;

    const minOC = Math.min(open, close);
    const maxOC = Math.max(open, close);
    const wickRange = volatility * 0.3;

    const high = maxOC + Math.random() * wickRange;
    const low = minOC - Math.random() * wickRange;

    data.push({
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      timestamp: Date.now() - (count - i) * 60000, // 1 minute intervals
      result: i === count - 1 ? 'pending' : close > open ? 'green' : 'red',
    });

    basePrice = close;
  }

  return data;
};
