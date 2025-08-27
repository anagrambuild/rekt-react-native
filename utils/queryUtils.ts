import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { apiClient } from "./apiClient";
import {
  ChartDataPoint,
  checkUsernameAvailabilityPublic,
  ClosePositionRequest,
  closeTradingPosition,
  createUser,
  CreateUserRequest,
  fetchHistoricalData,
  fetchSingleTokenPrice,
  fetchTokenPrices,
  getOpenPositions,
  // Add trading-related imports
  getTradingBalance,
  getTradingHistory,
  getUserByUserId,
  OpenPositionRequest,
  openTradingPosition,
  Position,
  submitSignedTransaction,
  SubmitTransactionRequest,
  SupportedTimeframe,
  SupportedToken,
  TokenPrice,
  TradingBalance,
  User,
} from "./backendApi";
import { queryClient } from "./queryClient";
import { queryKeys } from "./queryKeys";

// Generic API fetch function - now uses authenticated API client
export const fetchApi = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  // Use the authenticated API client for all API calls
  if (options?.method === "POST") {
    return apiClient.post(
      endpoint,
      options.body ? JSON.parse(options.body as string) : undefined
    );
  } else if (options?.method === "PUT") {
    return apiClient.put(
      endpoint,
      options.body ? JSON.parse(options.body as string) : undefined
    );
  } else if (options?.method === "DELETE") {
    return apiClient.delete(endpoint);
  } else {
    return apiClient.get(endpoint);
  }
};

// Custom hook for price queries
export const usePriceQuery = (
  symbol: string,
  options?: Omit<UseQueryOptions<any, Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.price(symbol),
    queryFn: () => fetchApi(`/api/prices/${symbol}`),
    refetchInterval: 5000, // Refetch every 5 seconds for live prices
    ...options,
  });
};

// Custom hook for chart data queries
export const useChartDataQuery = (
  symbol: string,
  timeframe: string,
  options?: Omit<UseQueryOptions<any, Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.chartDataBySymbol(symbol, timeframe),
    queryFn: () => fetchApi(`/api/chart/${symbol}?timeframe=${timeframe}`),
    staleTime: 1000 * 60, // 1 minute for chart data
    ...options,
  });
};

// Custom hook for user trades
export const useUserTradesQuery = (
  userId: string,
  options?: Omit<UseQueryOptions<any, Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.userTrades(userId),
    queryFn: () => fetchApi(`/api/trades/user/${userId}`),
    ...options,
  });
};

// Custom hook for leaderboard
export const useLeaderboardQuery = (
  period: string = "all",
  options?: Omit<UseQueryOptions<any, Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.leaderboardByPeriod(period),
    queryFn: () => fetchApi(`/api/leaderboard?period=${period}`),
    staleTime: 1000 * 60 * 2, // 2 minutes for leaderboard
    ...options,
  });
};

// Custom hook for trade mutations
export const useTradeMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  return useMutation({
    mutationFn: (tradeData: any) =>
      fetchApi("/api/trades", {
        method: "POST",
        body: JSON.stringify(tradeData),
      }),
    onSuccess: () => {
      // Invalidate related queries after successful trade
      queryClient.invalidateQueries({ queryKey: queryKeys.trades });
      queryClient.invalidateQueries({ queryKey: queryKeys.prices });
    },
    ...options,
  });
};

// Utility function to invalidate all price queries
export const invalidatePriceQueries = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.prices });
};

// Utility function to prefetch price data
export const prefetchPriceData = (symbol: string) => {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.price(symbol),
    queryFn: () => fetchApi(`/api/prices/${symbol}`),
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Utility function to set query data manually
export const setPriceData = (symbol: string, data: any) => {
  queryClient.setQueryData(queryKeys.price(symbol), data);
};

// Utility function to get cached query data
export const getCachedPriceData = (symbol: string) => {
  return queryClient.getQueryData(queryKeys.price(symbol));
};

// CoinGecko-specific hooks
export const useTokenPricesQuery = (
  tokens: SupportedToken[] = ["sol", "eth", "btc"],
  options?: Omit<
    UseQueryOptions<Partial<Record<SupportedToken, TokenPrice>>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["tokenPrices", ...tokens],
    queryFn: () => fetchTokenPrices(tokens),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 1000 * 20, // 20 seconds stale time
    ...options,
  });
};

export const useSingleTokenPriceQuery = (
  token: SupportedToken,
  options?: Omit<UseQueryOptions<TokenPrice, Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.price(token),
    queryFn: () => fetchSingleTokenPrice(token),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 1000 * 20, // 20 seconds stale time
    ...options,
  });
};

// Utility to prefetch all token prices
export const prefetchAllTokenPrices = () => {
  return queryClient.prefetchQuery({
    queryKey: ["tokenPrices", "sol", "eth", "btc"],
    queryFn: () => fetchTokenPrices(["sol", "eth", "btc"]),
    staleTime: 1000 * 20,
  });
};

// Historical chart data hook
export const useHistoricalDataQuery = (
  token: SupportedToken,
  timeframe: SupportedTimeframe,
  options?: Omit<
    UseQueryOptions<ChartDataPoint[], Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["historicalData", token, timeframe],
    queryFn: () => fetchHistoricalData(token, timeframe),
    staleTime: 1000 * 60, // 1 minute stale time
    refetchInterval: 1000 * 60, // Refetch every minute
    ...options,
  });
};

// Hook to get user by profile ID
export const useUserByProfileQuery = (
  userId: string,
  options?: Omit<UseQueryOptions<User | null, Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: () => getUserByUserId(userId),
    enabled: !!userId, // Only run query if profile ID is provided
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
    ...options,
  });
};

// Hook to create a new user
export const useCreateUserMutation = (
  options?: UseMutationOptions<User, Error, CreateUserRequest>
) => {
  return useMutation({
    mutationFn: createUser,
    onSuccess: (data, variables) => {
      // Update the user query cache with the new user
      queryClient.setQueryData(
        queryKeys.userByWallet(variables.walletAddress),
        data
      );
      // Invalidate user queries to refresh any related data
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
    ...options,
  });
};

// Trading-related hooks

// Hook to get user's trading balance
export const useTradingBalanceQuery = (
  userId: string,
  options?: Omit<UseQueryOptions<TradingBalance, Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.tradingBalance(userId),
    queryFn: () => getTradingBalance(userId),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds stale time
    refetchInterval: 1000 * 60, // Refetch every minute
    ...options,
  });
};

// Hook to get user's open positions
export const useOpenPositionsQuery = (
  userId: string,
  options?: Omit<UseQueryOptions<Position[], Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.openPositions(userId),
    queryFn: () => getOpenPositions(userId),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds stale time
    refetchInterval: 1000 * 60, // Refetch every minute
    ...options,
  });
};

// Hook to get user's trading history
export const useTradingHistoryQuery = (
  userId: string,
  status?: "open" | "closed",
  limit: number = 50,
  options?: Omit<UseQueryOptions<Position[], Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.tradingHistory(userId, status, limit),
    queryFn: () => getTradingHistory(userId, status, limit),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
    ...options,
  });
};

// Hook to open a new trading position
export const useOpenPositionMutation = (
  options?: UseMutationOptions<any, Error, OpenPositionRequest>
) => {
  return useMutation({
    mutationFn: openTradingPosition,
    onSuccess: () => {
      // Invalidate position queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["trading", "positions"] });
      queryClient.invalidateQueries({ queryKey: ["trading", "history"] });
      queryClient.invalidateQueries({ queryKey: ["trading", "balance"] });
    },
    ...options,
  });
};

// Hook to close a trading position
export const useClosePositionMutation = (
  options?: UseMutationOptions<any, Error, ClosePositionRequest>
) => {
  return useMutation({
    mutationFn: closeTradingPosition,
    onSuccess: () => {
      // Invalidate position queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["trading", "positions"] });
      queryClient.invalidateQueries({ queryKey: ["trading", "history"] });
      queryClient.invalidateQueries({ queryKey: ["trading", "balance"] });
    },
    ...options,
  });
};

// Hook to submit a signed transaction
export const useSubmitTransactionMutation = (
  options?: UseMutationOptions<any, Error, SubmitTransactionRequest>
) => {
  return useMutation({
    mutationFn: submitSignedTransaction,
    onSuccess: () => {
      // Invalidate position queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["trading", "positions"] });
      queryClient.invalidateQueries({ queryKey: ["trading", "history"] });
      queryClient.invalidateQueries({ queryKey: ["trading", "balance"] });
    },
    ...options,
  });
};

// Hook to check username availability with debouncing
export const useUsernameAvailabilityQuery = (
  username: string,
  options?: Omit<
    UseQueryOptions<{ available: boolean }, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["username", "availability", username],
    queryFn: () => checkUsernameAvailabilityPublic(username),
    enabled: !!username && username.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
    ...options,
  });
};

// Hook to get user by user ID
export const useUserByUserIdQuery = (
  userId: string,
  options?: Omit<UseQueryOptions<User | null, Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: () => getUserByUserId(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
    ...options,
  });
};
