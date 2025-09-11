import { useEffect, useState } from "react";

import { 
  ChartDataPoint, 
  pythPriceService, 
  SupportedTimeframe, 
  SupportedToken, 
  useHistoricalDataQuery 
} from "@/utils";

export const useLiveChartData = (
  token: SupportedToken,
  timeframe: SupportedTimeframe,
  dummyData?: ChartDataPoint[]
) => {
  // Only fetch historical data for non-1s timeframes
  const {
    data: historicalData,
    isLoading,
    error,
  } = useHistoricalDataQuery(
    token, 
    timeframe,
    { enabled: timeframe !== "1s" } // Don't fetch historical for 1s
  );

  // State for real-time data
  const [realtimeData, setRealtimeData] = useState<ChartDataPoint[]>([]);

  // Subscribe to real-time updates for 1s timeframe
  useEffect(() => {
    if (timeframe !== "1s" || dummyData) return;

    // Subscribe to streaming updates
    const subscriptionId = pythPriceService.subscribe(token, () => {
      // Get all cached prices for smooth chart
      const cachedPrices = pythPriceService.getCachedPrices(token, 30);
      const chartData: ChartDataPoint[] = cachedPrices.map(data => ({
        value: data.price,
        timestamp: data.timestamp,
      }));
      setRealtimeData(chartData);
    });

    // Get initial cached data immediately
    const initialCached = pythPriceService.getCachedPrices(token, 30);
    if (initialCached.length > 0) {
      const chartData: ChartDataPoint[] = initialCached.map(data => ({
        value: data.price,
        timestamp: data.timestamp,
      }));
      setRealtimeData(chartData);
    }

    return () => {
      pythPriceService.unsubscribe(subscriptionId);
    };
  }, [token, timeframe, dummyData]);

  // Return appropriate data based on conditions
  const data = dummyData || 
    (timeframe === "1s" 
      ? realtimeData  // For 1s, only show real-time data (starts empty, builds up)
      : historicalData) || 
    [];

  return {
    data,
    isLoading: timeframe === "1s" ? false : isLoading,
    error: timeframe === "1s" ? null : error, // No error for 1s since it doesn't use CoinGecko
  };
};