export const queryKeys = {
  // Trading related queries
  prices: ['prices'] as const,
  price: (symbol: string) => ['prices', symbol] as const,
  trades: ['trades'] as const,
  userTrades: (userId: string) => ['trades', 'user', userId] as const,
  
  // User related queries
  user: ['user'] as const,
  userProfile: (userId: string) => ['user', 'profile', userId] as const,
  
  // Leaderboard queries
  leaderboard: ['leaderboard'] as const,
  leaderboardByPeriod: (period: string) => ['leaderboard', period] as const,
  
  // Chart data queries
  chartData: ['chartData'] as const,
  chartDataBySymbol: (symbol: string, timeframe: string) => 
    ['chartData', symbol, timeframe] as const,
} as const;