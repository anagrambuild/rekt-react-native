import { apiClient } from "./apiClient";
import { supabase } from "./supabase";

// API Response Interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UserApiResponse {
  user: {
    id: string;
    username: string;
    email: string;
    avatar_url: string;
    swig_wallet_address: string;
    joined_at: string;
    updated_at: string;
  };
}

export interface UsernameAvailabilityResponse {
  username: string;
  available: boolean;
}

export interface UserExt {
  id: string;
  user_id: string;
  username: string;
  non_custodial_wallet_address: string | null;
  swig_address: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvatarUploadApiResponse {
  success: boolean;
  avatar_url: string;
  filename: string;
  message: string;
}

export interface TradingBalanceApiResponse {
  usdc: number;
  availableMargin: number;
  usedMargin: number;
  totalValue: number;
  walletAddress: string;
}

export interface SwigWalletBalanceApiResponse {
  balance: number;
  formatted: string;
  source: string;
  status: string;
  tokenAccount?: string;
  error?: string;
}

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

export interface BackendMarketResponse {
  success: boolean;
  data: {
    symbol: string;
    price: number;
    change24h: number;
    volume24h?: number;
    high24h?: number;
    low24h?: number;
    funding?: number;
    openInterest?: number;
  }[];
  timestamp: string;
}

export const SUPPORTED_TOKENS = {
  sol: "solana",
  eth: "ethereum",
  btc: "bitcoin",
} as const;

export type SupportedToken = keyof typeof SUPPORTED_TOKENS;

// Pyth Network price feed IDs
export const PYTH_PRICE_IDS = {
  btc: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // BTC/USD
  eth: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH/USD
  sol: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d", // SOL/USD
} as const;

// Price IDs without 0x prefix for matching API responses
const PYTH_PRICE_IDS_NO_PREFIX = {
  btc: "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // BTC/USD
  eth: "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH/USD
  sol: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d", // SOL/USD
} as const;

interface PythPriceData {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
  ema_price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
}

interface PythResponse {
  binary: {
    encoding: string;
    data: string[];
  };
  parsed: PythPriceData[];
}

export const fetchTokenPrices = async (
  tokens: SupportedToken[] = ["sol", "eth", "btc"]
): Promise<Partial<Record<SupportedToken, TokenPrice>>> => {
  try {
    // Build the Pyth Hermes API URL with price IDs for requested tokens
    const priceIds = tokens.map(token => PYTH_PRICE_IDS[token]).filter(Boolean);
    const idsParams = priceIds.map(id => `ids[]=${id}`).join("&");
    const pythUrl = `https://hermes.pyth.network/v2/updates/price/latest?${idsParams}`;

    const response = await fetch(pythUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Pyth API error: ${response.status} ${response.statusText}`
      );
    }

    const data: PythResponse = await response.json();

    if (!data.parsed || !Array.isArray(data.parsed)) {
      throw new Error("Invalid response format from Pyth API");
    }

    const result: Partial<Record<SupportedToken, TokenPrice>> = {};

    // Map Pyth price data to our TokenPrice format
    data.parsed.forEach(priceData => {
      // Find which token this price ID corresponds to (without 0x prefix)
      const token = Object.entries(PYTH_PRICE_IDS_NO_PREFIX).find(
        ([, priceId]) => priceId === priceData.id
      )?.[0] as SupportedToken;

      if (token && tokens.includes(token)) {
        // Convert price from Pyth format (price * 10^expo) to decimal
        const price =
          parseFloat(priceData.price.price) *
          Math.pow(10, priceData.price.expo);
        const confidence =
          parseFloat(priceData.price.conf) * Math.pow(10, priceData.price.expo);

        // Calculate 24h change using confidence as a rough estimate
        // Note: Pyth doesn't provide 24h change, so this is an approximation
        const estimatedChange24h =
          (confidence / price) * 100 * (Math.random() > 0.5 ? 1 : -1);

        result[token] = {
          id: SUPPORTED_TOKENS[token],
          symbol: token.toUpperCase(),
          name:
            token === "sol"
              ? "Solana"
              : token === "eth"
              ? "Ethereum"
              : "Bitcoin",
          current_price: price,
          price_change_24h: estimatedChange24h,
          price_change_percentage_24h: estimatedChange24h,
          market_cap: 0, // Not provided by Pyth
          total_volume: 0, // Not provided by Pyth
          last_updated: new Date(
            priceData.price.publish_time * 1000
          ).toISOString(),
        };
      }
    });

    return result;
  } catch (error) {
    console.error("❌ Error fetching token prices from Pyth:", error);
    throw error;
  }
};

export const fetchSingleTokenPrice = async (
  token: SupportedToken
): Promise<TokenPrice> => {
  const prices = await fetchTokenPrices([token]);
  const price = prices[token];

  if (!price) {
    throw new Error(`No price data available for ${token}`);
  }

  return price;
};

export interface ChartDataPoint {
  value: number;
  timestamp?: number;
}

export interface HistoricalDataResponse {
  prices: [number, number][]; // [timestamp, price]
}

// Supported timeframes for chart data
export type SupportedTimeframe =
  | "1s"
  | "1m"
  | "2m"
  | "5m"
  | "10m"
  | "1h"
  | "4h"
  | "1d";

// CoinGecko ID mapping
const COINGECKO_ID_MAP = {
  sol: "solana",
  eth: "ethereum",
  btc: "bitcoin",
} as const;

// Timeframe to days mapping for CoinGecko (optimized for real-time updates)
const COINGECKO_CONFIG = {
  "1s": { days: 1 }, // Auto: 5-minute granularity (best we can get for real-time)
  "1m": { days: 1 }, // Auto: 5-minute granularity
  "2m": { days: 1 }, // Auto: 5-minute granularity
  "5m": { days: 1 }, // Auto: 5-minute granularity
  "10m": { days: 2 }, // Auto: hourly granularity (2 days for more recent data)
  "1h": { days: 7 }, // Auto: hourly granularity
  "4h": { days: 30 }, // Auto: hourly granularity
  "1d": { days: 90 }, // Auto: daily granularity (3 months for better chart)
} as const;

// Fetch historical data from CoinGecko
const fetchHistoricalDataFromCoinGecko = async (
  token: SupportedToken,
  timeframe: SupportedTimeframe
): Promise<ChartDataPoint[]> => {
  const coinId = COINGECKO_ID_MAP[token];
  const config = COINGECKO_CONFIG[timeframe];

  if (!coinId) {
    throw new Error(`Unsupported token: ${token}`);
  }

  // Build URL with auto-granularity (CoinGecko free tier doesn't support interval parameter)
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${config.days}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // Handle specific CoinGecko errors
    if (response.status === 429) {
      throw new Error(`CoinGecko API rate limited (429) - too many requests`);
    } else if (response.status >= 500) {
      throw new Error(
        `CoinGecko API server error (${response.status}) - service temporarily unavailable`
      );
    } else {
      throw new Error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
    }
  }

  const data = await response.json();

  if (!data.prices || !Array.isArray(data.prices)) {
    throw new Error("Invalid response format from CoinGecko API");
  }

  // Convert CoinGecko prices to ChartDataPoint format
  // CoinGecko format: [[timestamp, price], ...]
  let chartData: ChartDataPoint[] = data.prices.map(
    (pricePoint: [number, number]) => ({
      value: pricePoint[1], // price
      timestamp: pricePoint[0], // timestamp
    })
  );

  // Sample data based on timeframe - use fewer points for better performance
  const maxPoints = timeframe === "1s" ? 20 : timeframe === "1m" ? 30 : 25;
  if (chartData.length > maxPoints) {
    const step = Math.ceil(chartData.length / maxPoints);
    chartData = chartData.filter((_, index) => index % step === 0);
  }
  return chartData;
};

// Global cache to maintain sliding window data for each token/timeframe
const chartDataCache = new Map<string, ChartDataPoint[]>();

// Clear cache for a specific token/timeframe (useful when switching timeframes)
export const clearChartDataCache = (
  token?: SupportedToken,
  timeframe?: SupportedTimeframe
) => {
  if (token && timeframe) {
    const cacheKey = `${token}-${timeframe}`;
    chartDataCache.delete(cacheKey);
    chartInitialized.delete(cacheKey);
  } else {
    chartDataCache.clear();
    chartInitialized.clear();
  }
};

// Track initialization state to avoid refetching historical data
const chartInitialized = new Map<string, boolean>();

// Create real-time sliding window data (optimized)
const createRealTimeData = async (
  token: SupportedToken,
  timeframe: SupportedTimeframe,
  historicalData: ChartDataPoint[]
): Promise<ChartDataPoint[]> => {
  const cacheKey = `${token}-${timeframe}`;

  try {
    // Get current price from Pyth (always fresh, real-time)
    const currentPrices = await fetchTokenPrices([token]);
    const currentPrice = currentPrices[token]?.current_price;

    if (currentPrice) {
      const now = Date.now();

      // Get existing cached data or initialize with historical data
      let cachedData = chartDataCache.get(cacheKey);
      if (!cachedData) {
        cachedData = [...historicalData];
        chartDataCache.set(cacheKey, cachedData);
        chartInitialized.set(cacheKey, true);
      }

      // For real-time timeframes, add new point and maintain sliding window
      if (timeframe === "1s" || timeframe === "1m") {
        // Add new data point on the right with CURRENT real-time price
        const newPoint: ChartDataPoint = {
          value: currentPrice,
          timestamp: now,
        };

        // Add to the end (right side of chart)
        cachedData.push(newPoint);

        // Maintain fixed window size - remove old points from the left
        const maxPoints = 20;
        if (cachedData.length > maxPoints) {
          cachedData.shift(); // Remove oldest point from left
        }

        // Update cache
        chartDataCache.set(cacheKey, cachedData);

        return [...cachedData]; // Return copy to trigger React re-render
      } else {
        // For longer timeframes, just update the last point
        cachedData[cachedData.length - 1] = {
          value: currentPrice,
          timestamp: now,
        };

        return [...cachedData];
      }
    }
  } catch (error) {
    console.warn(`⚠️ Failed to get current price: ${error}`);
  }

  return historicalData;
};

export const fetchHistoricalData = async (
  token: SupportedToken,
  timeframe: SupportedTimeframe = "1m"
): Promise<ChartDataPoint[]> => {
  const cacheKey = `${token}-${timeframe}`;

  // For real-time timeframes, check if we already have cached data
  if (
    (timeframe === "1s" || timeframe === "1m") &&
    chartInitialized.get(cacheKey)
  ) {
    // Just get current price and update sliding window - no need to refetch historical data
    return await createRealTimeData(token, timeframe, []);
  }

  try {
    // Use CoinGecko as primary (and only) source
    const data = await fetchHistoricalDataFromCoinGecko(token, timeframe);

    // For short timeframes, enhance with real-time current price
    if (timeframe === "1s" || timeframe === "1m") {
      return await createRealTimeData(token, timeframe, data);
    }

    return data;
  } catch (coinGeckoError) {
    console.error(`❌ CoinGecko failed: ${coinGeckoError}`);

    // No fallback - throw error to show proper error state
    throw new Error(
      `Failed to fetch historical data from CoinGecko: ${coinGeckoError}`
    );
  }
};

// Get current price from historical data (most recent point)
export const getCurrentPriceFromHistorical = (
  data: ChartDataPoint[]
): number => {
  return data.length > 0 ? data[data.length - 1].value : 0;
};

// Calculate percentage change from first to last data point
export const calculatePriceChange = (
  data: ChartDataPoint[]
): {
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

// User Management Types and Functions

export interface User {
  id: string;
  username: string;
  email?: string;
  profileImage?: string;
  swigWalletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  profileImage?: string;
  walletAddress: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  profileImage?: string;
  swigWalletAddress?: string;
}

export interface UsernameCheckResponse {
  available: boolean;
}

// NoCap Backend Types
export interface JobResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  message: string;
  result?: any;
  error?: string;
}

export interface TradeJobResponse {
  job_id: string;
  user_id: string;
  status: string;
  message: string;
  position_id?: string;
  transaction_signature?: string;
  error?: string;
}

export interface CurrentPositionsResponse {
  positions: Position[];
  total_value?: number;
  total_pnl?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface PositionHistory {
  id: string;
  position_id: string;
  user_id: string;
  market: string; // Backend returns "SOL", "BTC", "ETH"
  trade_type: string; // Backend returns "LONG", "SHORT"
  quantity: number;
  entry_price?: number;
  exit_price?: number;
  leverage: number;
  status: string;
  pnl?: number;
  fees?: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface CreateUserJobRequest {
  user_id: string;
  username: string;
  wallet_address?: string;
}

export interface UpdateAvatarRequest {
  avatar_url: string;
}

// Public username check that doesn't require authentication
export const checkUsernameAvailabilityPublic = async (
  username: string
): Promise<UsernameCheckResponse> => {
  try {
    // Updated URL path and method for nocap-backend
    const url = `${apiClient.getBaseURL()}/api/users/username/${encodeURIComponent(
      username
    )}/availability`;

    const response = await fetch(url, {
      method: "GET", // Changed from POST
      headers: {
        "Content-Type": "application/json",
      },
      // No body needed since username is in URL
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Updated response structure handling
    const data: ApiResponse<UsernameAvailabilityResponse> =
      await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to check username availability");
    }

    return {
      available: data.data!.available,
    };
  } catch (error) {
    console.error("❌ Username check error (public):", error);
    throw error;
  }
};

export const getUserByUserId = async (userId: string): Promise<User | null> => {
  try {
    // Updated URL path for nocap-backend
    const result = await apiClient.get<ApiResponse<UserExt>>(
      `/api/users/${userId}`
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to get user");
    }

    // Get email from local Supabase session since it's not in UserExt
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const email = session?.user?.email || "";

    // Map backend UserExt response to frontend User interface
    return {
      id: result.data.user_id, // Note: UserExt has separate id and user_id
      username: result.data.username,
      email: email, // Get from local session
      profileImage: result.data.avatar_url || undefined,
      swigWalletAddress: result.data.swig_address || undefined,
      createdAt: result.data.created_at,
      updatedAt: result.data.updated_at,
    };
  } catch (error) {
    console.error("Error fetching user by profile ID:", error);
    return null;
  }
};

// Job-based user creation for NoCap backend
export const createUserJob = async (
  userData: CreateUserJobRequest
): Promise<JobResponse> => {
  try {
    const result = await apiClient.post<ApiResponse<JobResponse>>(
      `/api/users`,
      userData
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to create user job");
    }

    return result.data;
  } catch (error) {
    console.error("Error creating user job:", error);

    // Log more details about the error
    if (error instanceof Error && error.message.includes("422")) {
      console.error("🚨 422 Error Details - Request was:", userData);
    }

    throw error;
  }
};

// Job-based trade placement for NoCap backend
export const placeTradeJob = async (
  tradeData: PlaceTradeRequest
): Promise<TradeJobResponse> => {
  try {
    const result = await apiClient.post<ApiResponse<TradeJobResponse>>(
      `/api/trades/place`,
      tradeData
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to place trade job");
    }

    const jobResponse = result.data;
    console.log("🎯 [JOB CREATED] Trade job created:", jobResponse.job_id);

    // Check job status with retries
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `🔍 [JOB STATUS] Checking job status (attempt ${attempt}/${maxRetries}):`,
          jobResponse.job_id
        );

        const jobStatus = await getJobStatus(jobResponse.job_id);
        console.log(
          `📊 [JOB STATUS] Job ${jobResponse.job_id} status:`,
          jobStatus
        );

        if (jobStatus.status === "completed") {
          console.log(
            "✅ [JOB COMPLETED] Job completed successfully:",
            jobStatus.result
          );
          break;
        } else if (jobStatus.status === "failed") {
          console.error("❌ [JOB FAILED] Job failed:", jobStatus.error);
          break;
        } else {
          console.log(
            `⏳ [JOB PENDING] Job still ${jobStatus.status}, waiting...`
          );
        }

        // Wait before next retry (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (statusError) {
        console.error(
          `❌ [JOB STATUS ERROR] Failed to check job status (attempt ${attempt}):`,
          statusError
        );

        // Wait before next retry (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    return jobResponse;
  } catch (error) {
    console.error("Error placing trade job:", error);

    // Log more details about the error
    if (error instanceof Error && error.message.includes("422")) {
      console.error("🚨 422 Error Details - Request was:", tradeData);
    }

    throw error;
  }
};

export interface CancelTradeRequest {
  user_id: string;
  position_id: string;
  position_amount?: string;
}

// Legacy interface for backward compatibility
export interface ClosePositionRequest {
  userId: string;
  positionId: string;
  positionAmount?: string;
}

// Job-based trade cancellation for NoCap backend
export const cancelTradeJob = async (
  cancelData: CancelTradeRequest
): Promise<TradeJobResponse> => {
  try {
    const result = await apiClient.post<ApiResponse<TradeJobResponse>>(
      `/api/trades/cancel`,
      cancelData
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to cancel trade job");
    }

    return result.data;
  } catch (error) {
    console.error("Error cancelling trade job:", error);

    // Log more details about the error
    if (error instanceof Error && error.message.includes("422")) {
      console.error("🚨 422 Error Details - Request was:", cancelData);
    }

    throw error;
  }
};

// Check job status
export const getJobStatus = async (
  jobId: string
): Promise<JobStatusResponse> => {
  try {
    const result = await apiClient.get<ApiResponse<JobStatusResponse>>(
      `/api/jobs/${jobId}`
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to get job status");
    }

    return result.data;
  } catch (error) {
    console.error("Error getting job status:", error);
    throw error;
  }
};

// Complete user creation with realtime and avatar upload
export const createUser = async (
  userData: CreateUserRequest
): Promise<User> => {
  try {
    // Get user ID from current session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No authenticated user found");
    }

    const userId = user.id;

    // Step 1: Start the user creation job (this was missing!)
    const jobRequest: CreateUserJobRequest = {
      user_id: userId,
      username: userData.username,
      wallet_address: userData.walletAddress,
    };

    console.log("🚀 Starting user creation job:", jobRequest);
    const jobResponse = await createUserJob(jobRequest);
    console.log("✅ User creation job started:", jobResponse.job_id);

    // Step 2: Set up realtime subscription for job completion
    return new Promise((resolve, reject) => {
      const channel = supabase
        .channel(`user:${userId}`)
        .on("broadcast", { event: "user_created" }, async () => {
          try {
            // Step 3: Upload avatar if provided
            if (userData.profileImage) {
              try {
                const avatarUrl = await uploadAvatar(
                  userData.profileImage,
                  `avatar_${Date.now()}.jpg`
                );
                await updateUserAvatar(avatarUrl);
              } catch (avatarError) {
                console.warn("⚠️ Avatar upload failed:", avatarError);
                // Continue without avatar
              }
            }

            // Step 4: Get the created user data directly from API
            try {
              const result = await apiClient.get<ApiResponse<UserExt>>(
                `/api/users/${userId}`
              );

              if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to get user");
              }

              // Get email from local Supabase session since it's not in UserExt
              const {
                data: { session },
              } = await supabase.auth.getSession();
              const email = session?.user?.email || "";

              // Map backend UserExt response to frontend User interface
              const user: User = {
                id: result.data.user_id,
                username: result.data.username,
                email: email,
                profileImage: result.data.avatar_url || undefined,
                swigWalletAddress: result.data.swig_address || undefined,
                createdAt: result.data.created_at,
                updatedAt: result.data.updated_at,
              };

              channel.unsubscribe();
              resolve(user);
            } catch (error) {
              throw new Error("Failed to retrieve created user: " + error);
            }
          } catch (error) {
            channel.unsubscribe();
            reject(error);
          }
        })
        .on("broadcast", { event: "user_creation_failed" }, payload => {
          console.log("❌ User creation failed:", payload);
          channel.unsubscribe();
          reject(new Error(payload.error || "User creation failed"));
        })
        .subscribe(status => {
          console.log("Realtime subscription status:", status);
        });

      // Set up timeout for job completion (5 minutes)
      setTimeout(() => {
        channel.unsubscribe();
        reject(
          new Error("User creation timeout - job took too long to complete")
        );
      }, 5 * 60 * 1000);
    });
  } catch (error) {
    console.error("Error in user creation flow:", error);
    throw error;
  }
};

// Avatar Upload Function
export interface AvatarUploadResponse {
  success: boolean;
  avatar_url: string;
  filename: string;
  message: string;
}

export const uploadAvatar = async (
  imageUri: string,
  fileName: string
): Promise<string> => {
  try {
    // Get current user ID for folder structure
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Convert React Native file URI to ArrayBuffer for Supabase
    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();

    // Generate unique filename with user folder structure
    const fileExt = fileName.split(".").pop() || "jpg";
    const uniqueFileName = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    // Upload to Supabase storage (full size)
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(uniqueFileName, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase upload error:", error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL with transformation for 80x80 avatar
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(data.path, {
      transform: {
        width: 80,
        height: 80,
        resize: "cover", // Crop to fit 80x80 maintaining aspect ratio
        quality: 80,
      },
    });

    console.log("✅ Avatar uploaded with transformation:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
};

// Delete avatar from storage
export const deleteAvatar = async (avatarUrl: string): Promise<void> => {
  try {
    // Extract filename from URL for deletion
    // URL format is typically: https://domain.com/storage/v1/object/public/avatars/filename.webp
    const urlParts = avatarUrl.split("/");
    const filename = urlParts[urlParts.length - 1];

    // Validate that we have a proper filename before making the request
    if (!filename || filename === avatarUrl) {
      console.warn("Could not extract filename from avatar URL:", avatarUrl);
      return;
    }

    // Backend expects UUID.webp format, validate before making request
    const filenameRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i;
    if (!filenameRegex.test(filename)) {
      console.warn(
        "Filename does not match expected format (UUID.webp):",
        filename
      );
      return;
    }

    // Use the authenticated API client instead of raw fetch
    await apiClient.delete(`/api/upload/avatar/${filename}`);
    console.log("✅ Successfully deleted old avatar:", filename);
  } catch (error) {
    console.warn("Error deleting old avatar:", error);
    // Don't throw error - we don't want to fail profile update if old image deletion fails
  }
};

// Update user avatar using the correct backend endpoint
export const updateUserAvatar = async (avatarUrl: string): Promise<UserExt> => {
  try {
    console.log("📤 Updating avatar URL in backend:", avatarUrl);

    const result = await apiClient.patch<ApiResponse<UserExt>>(
      `/api/users/avatar`,
      { avatar_url: avatarUrl }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to update avatar");
    }

    console.log("✅ Avatar URL updated in backend");
    return result.data;
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw error;
  }
};

// Update user profile - currently only supports avatar updates
export const updateUserProfile = async (
  userId: string,
  userData: { username?: string; email?: string; avatar_url?: string }
): Promise<User> => {
  try {
    console.log("📤 Updating user profile:", { userId, userData });

    // For now, only avatar updates are supported by the backend
    if (userData.avatar_url !== undefined) {
      const result = await updateUserAvatar(userData.avatar_url);

      // Get email from local Supabase session since it's not in UserExt
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const email = session?.user?.email || "";

      // Map backend UserExt response to frontend User interface
      return {
        id: result.user_id,
        username: result.username,
        email: email,
        profileImage: result.avatar_url || undefined,
        swigWalletAddress: result.swig_address || undefined,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    }

    // If no avatar update, just return current user data
    if (userData.username) {
      throw new Error("Username updates are not supported by the backend yet");
    }

    // Get current user data
    const currentUser = await getUserByUserId(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    return currentUser;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Swig Wallet Balance Types and Functions
export interface SwigWalletBalanceResponse {
  balance: number;
  formatted: string;
  source: string;
  status: string;
  tokenAccount?: string;
  error?: string;
}

// Get USDC balance from Swig wallet address
export const getSwigWalletBalance = async (
  swigWalletAddress: string
): Promise<SwigWalletBalanceResponse> => {
  try {
    // TEMPORARY: Use Solana RPC directly until backend API is implemented
    const { getUSDCBalanceFromSolana } = await import("./solanaUtils");
    const result = await getUSDCBalanceFromSolana(swigWalletAddress);

    return result;

    // TODO: Restore backend API call when /api/wallet/balance/${swigWalletAddress} is implemented
    // const result = await apiClient.get<ApiResponse<SwigWalletBalanceResponse>>(
    //   `/api/wallet/balance/${swigWalletAddress}`
    // );
    // if (!result.success) {
    //   throw new Error(result.error || "Failed to get Swig wallet balance");
    // }
    // return result.data!;
  } catch (error) {
    console.error("Error getting Swig wallet balance:", error);
    // Return zero balance on error to match backend behavior
    return {
      balance: 0,
      formatted: "$0.00",
      source: "solana_rpc_fallback",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Trading API Functions
export interface TradingBalance {
  usdc: number;
  availableMargin: number;
  usedMargin: number;
  totalValue: number;
  walletAddress: string;
}

export interface PlaceTradeRequest {
  user_id: string;
  market: string; // Backend expects "SOL", "BTC", "ETH" (not "SOL-PERP")
  trade_type: "LONG" | "SHORT"; // Backend expects uppercase
  quantity: number;
  entry_price?: number;
  take_profit_price?: number;
  stop_loss_price?: number;
  leverage: number;
  collateral_amount: string;
}

export interface OpenPositionRequest {
  userId: string;
  market: "SOL" | "BTC" | "ETH";
  direction: "LONG" | "SHORT";
  amount: number;
  leverage: number;
}

export interface TransactionData {
  serializedTransaction: string;
  description: string;
}

export interface InitializationResponse {
  needsInitialization: boolean;
  initializationRequired?: boolean;
  initializationInstructions?: TransactionData;
  message: string;
}

export interface Position {
  id: string;
  positionId: string; // Business logic ID like "SOL:1758171234720"
  market: string; // "SOL", "BTC", "ETH"
  direction: "LONG" | "SHORT";
  status: string;
  size: number; // buying power (poisiton_size in supabase)
  entryPrice: number;
  exitPrice: number | null;
  currentPrice: number;
  pnl: number; // usdc value
  pnlPercentage: number; // percent up or down
  leverage: number;
  liquidationPrice: number;
  marginUsed: number;
  openedAt: string;
  closedAt: string | null;
  duration: number;
  fees: number;
  points: number;
}

export interface OpenPositionResponse {
  success: boolean;
  data?: Position;
  message: string;
}

export interface ClosePositionResponse {
  success: boolean;
  data?: {
    positionId: string;
    transactionData?: TransactionData;
    // Legacy fields for direct position closing
    exitPrice?: number;
    pnl?: number;
    pnlPercentage?: number;
    closedAt?: string;
  };
  message: string;
}

export interface SubmitTransactionRequest {
  signedTransaction: string;
  walletAddress?: string;
  positionId?: string;
}

export interface SubmitTransactionResponse {
  success: boolean;
  data?: {
    signature: string;
    confirmation: {
      slot: number;
      confirmations: number | null;
      confirmationStatus: string;
      err: string | null; // Changed from 'any' to 'string | null'
    };
  };
  message: string;
}

// Get user's trading balance
export const getTradingBalance = async (
  userId: string
): Promise<TradingBalance> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.get<ApiResponse<TradingBalance>>(
      `/api/trading/balance/${userId}`
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to get trading balance");
    }

    return result.data!;
  } catch (error) {
    // console.error("Error getting trading balance:", error);
    throw error;
  }
};

// Get USDC balance using user ID (alias for getTradingBalance for compatibility)
export const getUSDCBalanceByUserId = async (
  userId: string
): Promise<TradingBalance> => {
  return getTradingBalance(userId);
};

// Open a new trading position using job-based system with realtime completion
export const openTradingPosition = async (
  request: OpenPositionRequest
): Promise<Position> => {
  console.log(`🎯 [BACKEND API] Request details:`, request);

  try {
    // Step 1: Check authentication state BEFORE anything else
    console.log("🔐 [AUTH CHECK] Verifying authentication state...");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("❌ [AUTH CHECK] Session error:", sessionError);
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    if (!session) {
      console.error("❌ [AUTH CHECK] No active session found");
      throw new Error("No authenticated user found");
    }
    console.log(
      "✅ [AUTH CHECK] Active session found for user:",
      session.user.id
    );
    console.log(
      "🔑 [AUTH CHECK] Session expires at:",
      new Date(session.expires_at! * 1000).toISOString()
    );

    // Get user ID from current session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No authenticated user found");
    }

    const userId = user.id;

    const requiredCollateral = request.amount;

    // Use the new format directly - no conversion needed
    const tradeRequest: PlaceTradeRequest = {
      user_id: request.userId,
      market: request.market,
      trade_type: request.direction,
      quantity: request.amount,
      leverage: request.leverage,
      collateral_amount: requiredCollateral.toString(),
    };

    // Step 2: Set up realtime subscription BEFORE submitting job
    console.log(
      "📡 [REALTIME SETUP] Setting up realtime listeners BEFORE job submission..."
    );

    return new Promise(async (resolve, reject) => {
      const channelName = `user:${userId}`;
      console.log("📡 [REALTIME SETUP] Creating channel:", channelName);

      const channel = supabase.channel(channelName);

      // Set up all event listeners with detailed logging
      channel
        // Primary: Listen for backend job completion events
        .on("broadcast", { event: "trade_completed" }, async payload => {
          console.log(
            "🎉 [REALTIME] Received trade_completed event:",
            JSON.stringify(payload, null, 2)
          );
          try {
            // Extract position ID from nested payload structure
            const positionId =
              payload.payload?.position_id ||
              payload.position_id ||
              payload.payload?.data?.position_id;

            console.log("🔍 [REALTIME] Extracted position ID:", positionId);

            // Step 3: Get the created position data from the payload or fetch from API
            if (payload.position) {
              console.log(
                "✅ [REALTIME] Position data found in payload, resolving immediately"
              );
              channel.unsubscribe();
              resolve(payload.position as Position);
            } else if (positionId) {
              console.log(
                "🔄 [REALTIME] Position ID found, trying direct Supabase query..."
              );

              try {
                // Get the created position using getOpenPositions (which now queries Supabase directly)
                console.log(
                  "🔄 [REALTIME] Fetching positions via getOpenPositions..."
                );
                const positions = await getOpenPositions(request.userId);
                console.log(
                  "📊 [REALTIME] Fetched positions:",
                  positions.length
                );
                const newPosition = positions.find(p => p.id === positionId);
                if (newPosition) {
                  console.log("✅ [REALTIME] Found new position, resolving");
                  channel.unsubscribe();
                  resolve(newPosition);
                } else {
                  console.warn(
                    "⚠️ [REALTIME] Position not found in API, creating from realtime data..."
                  );

                  // Option 3: Create position from realtime data
                  const position: Position = {
                    id: positionId,
                    positionId: positionId, // Use same ID for now
                    market: request.market,
                    direction: request.direction,
                    status: "OPEN",
                    size: request.amount,
                    entryPrice: 0, // Will be updated later
                    exitPrice: null,
                    currentPrice: 0,
                    pnl: 0,
                    pnlPercentage: 0,
                    leverage: request.leverage,
                    liquidationPrice: 0,
                    marginUsed: 0,
                    openedAt:
                      payload.payload?.timestamp || new Date().toISOString(),
                    closedAt: null,
                    duration: 0,
                    fees: 0,
                    points: 0,
                  };

                  console.log(
                    "✅ [REALTIME] Created position from realtime data, resolving"
                  );
                  channel.unsubscribe();
                  resolve(position);
                }
              } catch (positionError) {
                console.error(
                  "❌ [REALTIME] Position query failed:",
                  positionError
                );

                // Final fallback: Create position from realtime data
                console.log(
                  "🔄 [REALTIME] Final fallback: creating position from realtime data"
                );
                const position: Position = {
                  id: positionId,
                  positionId: positionId, // Use same ID for now
                  market: request.market,
                  direction: request.direction,
                  status: "OPEN",
                  size: request.amount,
                  entryPrice: 0,
                  exitPrice: null,
                  currentPrice: 0,
                  pnl: 0,
                  pnlPercentage: 0,
                  leverage: request.leverage,
                  liquidationPrice: 0,
                  marginUsed: 0,
                  openedAt:
                    payload.payload?.timestamp || new Date().toISOString(),
                  closedAt: null,
                  duration: 0,
                  fees: 0,
                  points: 0,
                };

                console.log(
                  "✅ [REALTIME] Final fallback successful, resolving"
                );
                channel.unsubscribe();
                resolve(position);
              }
            } else {
              console.error(
                "❌ [REALTIME] No position ID found in payload:",
                JSON.stringify(payload, null, 2)
              );
              throw new Error("No position data in trade completion payload");
            }
          } catch (error) {
            console.error(
              "❌ [REALTIME] Error in trade_completed handler:",
              error
            );
            channel.unsubscribe();
            reject(error);
          }
        })
        .on("broadcast", { event: "trade_failed" }, payload => {
          console.log(
            "❌ [REALTIME] Received trade_failed event:",
            JSON.stringify(payload, null, 2)
          );
          channel.unsubscribe();
          reject(new Error(payload.error || "Trade failed"));
        })

        // Backup: Listen for database position insertion
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "position",
            filter: `user_id=eq.${userId}`,
          },
          async payload => {
            console.log(
              "📊 [REALTIME] Database INSERT detected:",
              JSON.stringify(payload, null, 2)
            );

            // Check if this is a recent position (within last 2 minutes)
            const positionCreatedAt = new Date(payload.new.created_at);
            const timeDiff = Date.now() - positionCreatedAt.getTime();
            console.log(
              "⏰ [REALTIME] Position created at:",
              positionCreatedAt.toISOString()
            );
            console.log("⏰ [REALTIME] Time difference:", timeDiff, "ms");

            if (timeDiff < 2 * 60 * 1000) {
              console.log(
                "✅ [REALTIME] Recent position detected, resolving from database"
              );
              channel.unsubscribe();

              // Convert database position to frontend Position format
              const position: Position = {
                id: payload.new.id,
                positionId: payload.new.position_id || payload.new.id, // Use position_id if available
                market: payload.new.asset, // SOL, BTC, ETH
                direction: "LONG", // Default, will be updated when we get actual position data
                status: "OPEN",
                size: 0, // Will be populated when we get actual position data
                entryPrice: 0, // Will be populated when we get actual position data
                exitPrice: null,
                currentPrice: 0,
                pnl: 0,
                pnlPercentage: 0,
                leverage: 1,
                liquidationPrice: 0,
                marginUsed: 0,
                openedAt: payload.new.created_at,
                closedAt: null,
                duration: 0,
                fees: 0,
                points: 0,
              };

              resolve(position);
            } else {
              console.log("⏰ [REALTIME] Position too old, ignoring");
            }
          }
        )
        .subscribe((status, err) => {
          console.log("📡 [REALTIME] Subscription status change:", status);
          if (err) {
            console.error("❌ [REALTIME] Subscription error:", err);
          }

          // Add specific handling for different statuses
          if (status === "SUBSCRIBED") {
            console.log(
              "✅ [REALTIME] Successfully subscribed to channel:",
              channelName
            );
            console.log("🚀 [REALTIME] Now submitting trade job...");

            // Step 3: Submit job AFTER realtime is set up
            placeTradeJob(tradeRequest)
              .then(jobResponse => {
                console.log(
                  "✅ [JOB] Trade job submitted successfully:",
                  jobResponse.job_id
                );

                // Set up warning at 30 seconds
                setTimeout(() => {
                  console.warn(
                    "⚠️ [TRADE DEBUG] Trade taking longer than expected (30s). Job ID:",
                    jobResponse.job_id
                  );
                  console.warn(
                    "🔄 [TRADE DEBUG] Waiting for backend job or database insertion..."
                  );
                }, 30 * 1000);
              })
              .catch(jobError => {
                console.error("❌ [JOB] Failed to submit trade job:", jobError);
                channel.unsubscribe();
                reject(
                  new Error(`Failed to submit trade job: ${jobError.message}`)
                );
              });
          } else if (status === "CLOSED") {
            console.error("🔴 [REALTIME] Connection closed unexpectedly");
            console.error(
              "🔍 [REALTIME] Check authentication, RLS policies, and realtime settings"
            );
            console.error("🔍 [REALTIME] Session valid:", !!session);
            console.error("🔍 [REALTIME] User ID:", userId);

            // Don't reject immediately, the job might still complete
            // But log this as a critical issue
            console.error(
              "⚠️ [REALTIME] Realtime connection lost, falling back to polling"
            );
          } else if (status === "CHANNEL_ERROR") {
            console.error("💥 [REALTIME] Channel error occurred");
            channel.unsubscribe();
            reject(new Error("Realtime channel error"));
          } else if (status === "TIMED_OUT") {
            console.error("⏰ [REALTIME] Connection timed out");
            channel.unsubscribe();
            reject(new Error("Realtime connection timed out"));
          }
        });

      // Add a fallback timeout (2 minutes) in case everything fails
      setTimeout(() => {
        console.error("⏰ [TIMEOUT] Trade operation timed out after 2 minutes");
        channel.unsubscribe();
        reject(
          new Error(
            "Trade operation timed out - no response from backend or realtime"
          )
        );
      }, 2 * 60 * 1000);
    });
  } catch (error) {
    console.error("Error in trade placement flow:", error);
    throw error;
  }
};

// Get open positions for a user
export const getOpenPositions = async (userId: string): Promise<Position[]> => {
  try {
    console.log(
      "🔍 [GET POSITIONS] Testing backend API endpoint for user:",
      userId
    );
    const result = await apiClient.get<ApiResponse<CurrentPositionsResponse>>(
      `/api/trades/positions/${userId}`
    );

    if (!result.success) {
      console.error("❌ API call failed:", result.error);
      throw new Error(result.error || "Failed to get positions");
    }

    const backendPositions = result.data!.positions;

    if (!backendPositions || !Array.isArray(backendPositions)) {
      console.warn(
        "⚠️ [POSITIONS API] Backend positions is not an array:",
        typeof backendPositions
      );
      return [];
    }

    const mappedPositions: Position[] = backendPositions.map(
      (pos: any, index: number) => {
        // Helper function to safely convert string/number to number (no defaults)
        const toNumber = (value: any): number => {
          if (value === null || value === undefined) return value;
          const num =
            typeof value === "string" ? parseFloat(value) : Number(value);
          return isNaN(num) ? value : num;
        };

        const mappedPosition = {
          id: pos.position_id,
          positionId: pos.position_id, // Business logic ID - same as id for now
          market: pos.market,
          direction: pos.trade_type as "LONG" | "SHORT",
          status: pos.status, // Not in PositionSummary - will be undefined
          size: toNumber(pos.quantity),
          entryPrice: toNumber(pos.entry_price),
          exitPrice: pos.exit_price ? toNumber(pos.exit_price) : null, // Not in PositionSummary
          currentPrice: toNumber(pos.current_price),
          pnl: toNumber(pos.unrealized_pnl),
          pnlPercentage: pos.pnl_percentage
            ? toNumber(pos.pnl_percentage)
            : undefined, // Not in PositionSummary
          leverage: pos.leverage ? toNumber(pos.leverage) : undefined, // Not in PositionSummary
          liquidationPrice: toNumber(pos.liquidation_price),
          marginUsed: pos.margin_used ? toNumber(pos.margin_used) : undefined, // Not in PositionSummary
          openedAt: pos.last_updated,
          closedAt: pos.closed_at || null, // Not in PositionSummary
          duration: pos.duration ? toNumber(pos.duration) : undefined, // Not in PositionSummary
          fees: pos.fees ? toNumber(pos.fees) : undefined, // Not in PositionSummary
          points: pos.points ? toNumber(pos.points) : undefined, // Not in PositionSummary
        } as Position;
        return mappedPosition;
      }
    );

    return mappedPositions;
  } catch (error) {
    console.error("❌ Error getting open positions:", error);

    // If it's a 500 error, return empty array instead of crashing the app
    if (error instanceof Error && error.message.includes("500")) {
      return [];
    }

    throw error;
  }
};

// Close a trading position using job-based system with realtime completion
export const closeTradingPosition = async (
  request: ClosePositionRequest
): Promise<Position> => {
  console.log(`🎯 [CLOSE POSITION] Request details:`, request);

  try {
    // Step 1: Check authentication state
    console.log("🔐 [AUTH CHECK] Verifying authentication state...");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("❌ [AUTH CHECK] Session error:", sessionError);
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    if (!session) {
      console.error("❌ [AUTH CHECK] No active session found");
      throw new Error("No authenticated user found");
    }
    console.log(
      "✅ [AUTH CHECK] Active session found for user:",
      session.user.id
    );

    const userId = session.user.id;
    console.log("👤 [USER] Using user ID:", userId);

    // Convert legacy request format to new backend format
    const cancelRequest: CancelTradeRequest = {
      user_id: request.userId,
      position_id: request.positionId,
      position_amount: request.positionAmount,
    };

    // Step 2: Set up realtime subscription BEFORE submitting job
    console.log(
      "📡 [REALTIME SETUP] Setting up realtime listeners BEFORE job submission..."
    );

    return new Promise(async (resolve, reject) => {
      const channelName = `user:${userId}`;
      console.log("📡 [REALTIME SETUP] Creating channel:", channelName);

      const channel = supabase.channel(channelName);

      // Set up all event listeners with detailed logging
      channel
        // Primary: Listen for backend job completion events
        .on("broadcast", { event: "trade_cancelled" }, async payload => {
          console.log(
            "🎉 [REALTIME] Received trade_cancelled event:",
            JSON.stringify(payload, null, 2)
          );
          try {
            // Extract position ID from nested payload structure
            const positionId =
              payload.payload?.position_id ||
              payload.position_id ||
              payload.payload?.data?.position_id ||
              request.positionId; // Fallback to request position ID

            console.log("🔍 [REALTIME] Extracted position ID:", positionId);

            // Step 3: Refresh open positions to update UI (position should be removed from open list)
            console.log(
              "🔄 [REALTIME] Refreshing open positions to update UI..."
            );
            try {
              const updatedPositions = await getOpenPositions(request.userId);
              console.log(
                "📊 [REALTIME] Updated positions count:",
                updatedPositions.length
              );

              // Check if the position was actually closed (should not be in open positions anymore)
              const stillOpen = updatedPositions.find(p => p.id === positionId);
              if (!stillOpen) {
                console.log(
                  "✅ [REALTIME] Position successfully closed and removed from open positions"
                );

                // Create a closed position object for the response
                const closedPosition: Position = {
                  id: positionId,
                  positionId: payload.payload?.positionId || positionId, // Use payload positionId if available
                  market: payload.payload?.market || payload.market || "",
                  direction: payload.payload?.direction || "LONG",
                  status: "CLOSED",
                  size: payload.payload?.size || 0,
                  entryPrice: payload.payload?.entry_price || 0,
                  exitPrice: payload.payload?.exit_price || 0,
                  currentPrice: payload.payload?.exit_price || 0,
                  pnl: payload.payload?.pnl || 0,
                  pnlPercentage: payload.payload?.pnl_percentage || 0,
                  leverage: payload.payload?.leverage || 1,
                  liquidationPrice: 0,
                  marginUsed: 0,
                  openedAt:
                    payload.payload?.opened_at || new Date().toISOString(),
                  closedAt:
                    payload.payload?.closed_at || new Date().toISOString(),
                  duration: 0,
                  fees: payload.payload?.fees || 0,
                  points: payload.payload?.points || 0,
                };

                channel.unsubscribe();
                resolve(closedPosition);
              } else {
                console.warn(
                  "⚠️ [REALTIME] Position still appears in open positions, checking trading history..."
                );
              }
            } catch (positionError) {
              console.error(
                "❌ [REALTIME] Position refresh failed:",
                positionError
              );
              throw new Error("Failed to refresh positions after closure");
            }
          } catch (error) {
            console.error(
              "❌ [REALTIME] Error in trade_cancelled handler:",
              error
            );
            channel.unsubscribe();
            reject(error);
          }
        })
        .on("broadcast", { event: "trade_cancellation_failed" }, payload => {
          console.log(
            "❌ [REALTIME] Received trade_cancellation_failed event:",
            JSON.stringify(payload, null, 2)
          );
          channel.unsubscribe();
          reject(new Error(payload.error || "Trade cancellation failed"));
        })

        // Backup: Listen for database position updates (status change to CLOSED)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "position",
            filter: `user_id=eq.${userId}`,
          },
          async payload => {
            // Check if this is the position we're closing and it's now closed
            const updatedPosition = payload.new;
            if (
              updatedPosition.position_id === request.positionId &&
              updatedPosition.status === "CLOSED"
            ) {
              console.log(
                "✅ [REALTIME] Position closure detected via database update"
              );

              // Refresh positions and resolve
              try {
                await getOpenPositions(request.userId); // This will update the UI

                // Create closed position response
                const closedPosition: Position = {
                  id: updatedPosition.position_id || updatedPosition.id,
                  positionId: updatedPosition.position_id || updatedPosition.id, // Use position_id from database
                  market: updatedPosition.asset || "",
                  direction: updatedPosition.direction || "LONG",
                  status: "CLOSED",
                  size: updatedPosition.position_size || 0,
                  entryPrice: updatedPosition.entry_price || 0,
                  exitPrice: updatedPosition.exit_price || 0,
                  currentPrice: updatedPosition.exit_price || 0,
                  pnl: updatedPosition.pnl || 0,
                  pnlPercentage: updatedPosition.pnl_percentage || 0,
                  leverage: updatedPosition.leverage || 1,
                  liquidationPrice: 0,
                  marginUsed: 0,
                  openedAt: updatedPosition.created_at,
                  closedAt: updatedPosition.updated_at,
                  duration: 0,
                  fees: 0,
                  points: 0,
                };

                channel.unsubscribe();
                resolve(closedPosition);
              } catch (error) {
                console.error(
                  "❌ [REALTIME] Error processing database update:",
                  error
                );
                channel.unsubscribe();
                reject(error);
              }
            }
          }
        )
        .subscribe((status, err) => {
          console.log("📡 [REALTIME] Subscription status change:", status);
          if (err) {
            console.error("❌ [REALTIME] Subscription error:", err);
          }

          if (status === "SUBSCRIBED") {
            console.log(
              "✅ [REALTIME] Successfully subscribed to channel:",
              channelName
            );
            console.log(
              "🚀 [REALTIME] Now submitting trade cancellation job..."
            );

            // Step 3: Submit job AFTER realtime is set up
            cancelTradeJob(cancelRequest)
              .then(jobResponse => {
                console.log(
                  "✅ [JOB] Trade cancellation job submitted successfully:",
                  jobResponse.job_id
                );

                // Set up warning at 30 seconds
                setTimeout(() => {
                  console.warn(
                    "⚠️ [TRADE DEBUG] Trade cancellation taking longer than expected (30s). Job ID:",
                    jobResponse.job_id
                  );
                  console.warn(
                    "🔄 [TRADE DEBUG] Waiting for backend job or database update..."
                  );
                }, 30 * 1000);
              })
              .catch(jobError => {
                console.error(
                  "❌ [JOB] Failed to submit trade cancellation job:",
                  jobError
                );
                channel.unsubscribe();
                reject(
                  new Error(
                    `Failed to submit trade cancellation job: ${jobError.message}`
                  )
                );
              });
          } else if (status === "CLOSED") {
            console.error("🔴 [REALTIME] Connection closed unexpectedly");
            console.error(
              "🔍 [REALTIME] Check authentication, RLS policies, and realtime settings"
            );
          } else if (status === "CHANNEL_ERROR") {
            console.error("💥 [REALTIME] Channel error occurred");
            channel.unsubscribe();
            reject(new Error("Realtime channel error"));
          } else if (status === "TIMED_OUT") {
            console.error("⏰ [REALTIME] Connection timed out");
            channel.unsubscribe();
            reject(new Error("Realtime connection timed out"));
          }
        });

      // Add a fallback timeout (2 minutes) in case everything fails
      setTimeout(() => {
        console.error(
          "⏰ [TIMEOUT] Trade cancellation timed out after 2 minutes"
        );
        channel.unsubscribe();
        reject(
          new Error(
            "Trade cancellation timed out - no response from backend or realtime"
          )
        );
      }, 2 * 60 * 1000);
    });
  } catch (error) {
    console.error("Error in trade cancellation flow:", error);
    throw error;
  }
};

// Get trading history for a user with pagination
export const getTradingHistory = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Position[]> => {
  try {
    let endpoint = `/api/trades/history/${userId}?limit=${limit}&offset=${offset}`;
    // Use the authenticated API client with new endpoint
    const result = await apiClient.get<
      ApiResponse<PaginatedResponse<PositionHistory>>
    >(endpoint);

    if (!result.success) {
      console.error("❌ Trading history API call failed:", result.error);
      throw new Error(result.error || "Failed to get trading history");
    }

    // Convert PositionHistory to Position format
    const positions: Position[] = result.data!.data.map(history => ({
      id: history.id,
      positionId: history.position_id, // Use same ID for now
      market: history.market,
      direction: history.trade_type as "LONG" | "SHORT",
      status: history.status,
      size: history.quantity,
      entryPrice: history.entry_price || 0,
      exitPrice: history.exit_price || null,
      currentPrice: history.exit_price || history.entry_price || 0,
      pnl: history.pnl || 0,
      pnlPercentage:
        history.pnl && history.entry_price
          ? (history.pnl / (history.quantity * history.entry_price)) * 100
          : 0,
      leverage: history.leverage,
      liquidationPrice: 0, // Not provided in PositionHistory
      marginUsed:
        (history.quantity * (history.entry_price || 0)) / history.leverage,
      openedAt: history.created_at,
      closedAt: history.closed_at || null,
      duration: history.closed_at
        ? new Date(history.closed_at).getTime() -
          new Date(history.created_at).getTime()
        : 0,
      fees: history.fees || 0,
      points: 0, // Not provided in PositionHistory
    }));

    return positions;
  } catch (error) {
    // console.error('Error getting trading history:', error);
    throw error;
  }
};

// Get paginated trading history with full response metadata
export const getTradingHistoryPaginated = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedResponse<Position>> => {
  try {
    let endpoint = `/api/trades/history/${userId}?limit=${limit}&offset=${offset}`;

    const result = await apiClient.get<
      ApiResponse<PaginatedResponse<PositionHistory>>
    >(endpoint);

    if (!result.success) {
      throw new Error(result.error || "Failed to get trading history");
    }

    // Convert PositionHistory to Position format
    const positions: Position[] = result.data!.data.map(history => ({
      id: history.id,
      positionId: history.position_id,
      market: history.market,
      direction: history.trade_type as "LONG" | "SHORT",
      status: history.status,
      size: history.quantity,
      entryPrice: history.entry_price || 0,
      exitPrice: history.exit_price || null,
      currentPrice: history.exit_price || history.entry_price || 0,
      pnl: history.pnl || 0,
      pnlPercentage:
        history.pnl && history.entry_price
          ? (history.pnl / (history.quantity * history.entry_price)) * 100
          : 0,
      leverage: history.leverage,
      liquidationPrice: 0,
      marginUsed:
        (history.quantity * (history.entry_price || 0)) / history.leverage,
      openedAt: history.created_at,
      closedAt: history.closed_at || null,
      duration: history.closed_at
        ? new Date(history.closed_at).getTime() -
          new Date(history.created_at).getTime()
        : 0,
      fees: history.fees || 0,
      points: 0,
    }));

    return {
      data: positions,
      total: result.data!.total,
      offset: result.data!.offset,
      limit: result.data!.limit,
      has_more: result.data!.has_more,
    };
  } catch (error) {
    console.error("Error getting paginated trading history:", error);
    throw error;
  }
};

// Breeze opt-in functionality
export const breezeOptIn = async (): Promise<JobResponse> => {
  try {
    const result = await apiClient.post<ApiResponse<JobResponse>>(
      `/api/users/breeze-opt-in`
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to start Breeze opt-in");
    }

    return result.data;
  } catch (error) {
    console.error("Error starting Breeze opt-in:", error);
    throw error;
  }
};
