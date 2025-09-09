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
const PYTH_PRICE_IDS = {
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

        // Calculate a mock 24h change (we'll use confidence as a proxy for now)
        // In a real implementation, you'd need historical data or a different endpoint
        const mockChange24h =
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
          price_change_24h: mockChange24h,
          price_change_percentage_24h: mockChange24h,
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

export const fetchHistoricalData = async (
  token: SupportedToken,
  timeframe: SupportedTimeframe = "1m"
): Promise<ChartDataPoint[]> => {
  // Generate dynamic mock historical data based on real current price from Pyth
  const currentPrices = await fetchTokenPrices([token]);
  const currentPrice = currentPrices[token]?.current_price || 100;

  // Generate 7 mock data points with realistic price movement
  const chartData: ChartDataPoint[] = [];
  const now = Date.now();
  const timeframeMs =
    {
      "1s": 1000,
      "1m": 60000,
      "2m": 120000,
      "5m": 300000,
      "10m": 600000,
      "1h": 3600000,
      "4h": 14400000,
      "1d": 86400000,
    }[timeframe] || 60000;

  // Create more realistic price movement with trend
  const maxVariation = 0.025; // ±2.5% max variation
  let previousPrice = currentPrice;

  for (let i = 6; i >= 0; i--) {
    const timestamp = now - i * timeframeMs;

    if (i === 0) {
      // Last point should be the actual current price
      chartData.push({
        value: Math.round(currentPrice * 100) / 100,
        timestamp,
      });
    } else {
      // Generate realistic price movement with some momentum
      const trendFactor = (6 - i) / 6; // 0 to 1, stronger trend towards current price
      const randomWalk =
        (Math.random() - 0.5) * maxVariation * (1 - trendFactor * 0.5);
      const trendTowardsCurrent =
        (currentPrice - previousPrice) * trendFactor * 0.1;

      const price = previousPrice * (1 + randomWalk) + trendTowardsCurrent;
      const roundedPrice = Math.round(price * 100) / 100;

      chartData.push({
        value: roundedPrice,
        timestamp,
      });

      previousPrice = roundedPrice;
    }
  }

  return chartData;
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

export interface CancelTradeRequest {
  user_id: string;
  position_id: string;
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
    console.log("🌐 Using API URL:", url);

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
    console.log("📤 Sending user creation request:", {
      endpoint: "/api/users",
      data: userData,
    });

    const result = await apiClient.post<ApiResponse<JobResponse>>(
      `/api/users`,
      userData
    );

    console.log("📥 User creation response:", result);

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
    console.log("📤 Sending trade placement request:", {
      endpoint: "/api/trades/place",
      data: tradeData,
    });

    const result = await apiClient.post<ApiResponse<TradeJobResponse>>(
      `/api/trades/place`,
      tradeData
    );

    console.log("📥 Trade placement response:", result);

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to place trade job");
    }

    return result.data;
  } catch (error) {
    console.error("Error placing trade job:", error);

    // Log more details about the error
    if (error instanceof Error && error.message.includes("422")) {
      console.error("🚨 422 Error Details - Request was:", tradeData);
    }

    throw error;
  }
};

// Job-based trade cancellation for NoCap backend
export const cancelTradeJob = async (
  cancelData: CancelTradeRequest
): Promise<TradeJobResponse> => {
  try {
    console.log("📤 Sending trade cancellation request:", {
      endpoint: "/api/trades/cancel",
      data: cancelData,
    });

    const result = await apiClient.post<ApiResponse<TradeJobResponse>>(
      `/api/trades/cancel`,
      cancelData
    );

    console.log("📥 Trade cancellation response:", result);

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

    // Step 1: Start user creation job
    const jobResponse = await createUserJob({
      user_id: user.id,
      username: userData.username,
      wallet_address: userData.walletAddress,
    });

    console.log("User creation job started:", jobResponse.job_id);

    // Step 2: Set up realtime subscription for job completion
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error("No authenticated user found");
    }

    return new Promise((resolve, reject) => {
      const channel = supabase
        .channel(`user:${userId}`)
        .on("broadcast", { event: "user_created" }, async payload => {
          console.log("🎉 User created successfully:", payload);

          try {
            // Step 3: Upload avatar if provided
            if (userData.profileImage) {
              try {
                const avatarUrl = await uploadAvatar(
                  userData.profileImage,
                  `avatar_${Date.now()}.jpg`
                );
                await updateUserAvatar(avatarUrl);
                console.log("✅ Avatar uploaded successfully");
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
    console.log("📤 Uploading avatar to Supabase storage...");
    console.log("📷 Image URI:", imageUri);

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

    console.log("📊 File size:", arrayBuffer.byteLength, "bytes");

    // Generate unique filename with user folder structure
    const fileExt = fileName.split(".").pop() || "jpg";
    const uniqueFileName = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    console.log("📁 Upload path:", uniqueFileName);

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

    console.log("✅ Upload successful:", data);

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
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.get<ApiResponse<SwigWalletBalanceResponse>>(
      `/api/wallet/balance/${swigWalletAddress}`
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to get Swig wallet balance");
    }
    return result.data!;
  } catch (error) {
    console.error("Error getting Swig wallet balance:", error);
    // Return zero balance on error to match backend behavior
    return {
      balance: 0,
      formatted: "$0.00",
      source: "swig_wallet",
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

// Legacy interface for backward compatibility
export interface ClosePositionRequest {
  userId: string;
  positionId: string;
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
  try {
    // Get user ID from current session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Calculate required collateral based on trade amount and leverage
    const tradeValue = request.amount; // This is the position size in USD
    const requiredCollateral = 1;

    // Use the new format directly - no conversion needed
    const tradeRequest: PlaceTradeRequest = {
      user_id: request.userId,
      market: request.market,
      trade_type: request.direction,
      quantity: request.amount,
      leverage: request.leverage,
      collateral_amount: requiredCollateral.toString(), // Required by backend
      // Optional fields can be added later for limit orders, TP/SL
    };

    // Step 1: Start trade placement job
    const jobResponse = await placeTradeJob(tradeRequest);

    console.log("Trade placement job started:", jobResponse.job_id);

    // Step 2: Set up realtime subscription for job completion
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error("No authenticated user found");
    }

    console.log("🔄 [REALTIME] Setting up dual listeners for user:", userId);
    console.log(
      "📡 [REALTIME] Primary: Backend job events (trade_completed/trade_failed)"
    );
    console.log("🗄️ [REALTIME] Backup: Database position insertion events");

    return new Promise((resolve, reject) => {
      const channel = supabase
        .channel(`user:${userId}`)

        // Primary: Listen for backend job completion events
        .on("broadcast", { event: "trade_completed" }, async payload => {
          console.log("🎉 [PRIMARY] Trade completed via backend job:", payload);

          try {
            // Step 3: Get the created position data from the payload or fetch from API
            if (payload.position) {
              channel.unsubscribe();
              resolve(payload.position as Position);
            } else if (payload.position_id) {
              // Fetch position details if only ID is provided
              try {
                const positions = await getOpenPositions(request.userId);
                const newPosition = positions.find(
                  p => p.id === payload.position_id
                );
                if (newPosition) {
                  channel.unsubscribe();
                  resolve(newPosition);
                } else {
                  throw new Error("Position not found after creation");
                }
              } catch (error) {
                throw new Error(
                  "Failed to retrieve created position: " + error
                );
              }
            } else {
              throw new Error("No position data in trade completion payload");
            }
          } catch (error) {
            channel.unsubscribe();
            reject(error);
          }
        })
        .on("broadcast", { event: "trade_failed" }, payload => {
          console.log("❌ [PRIMARY] Trade failed via backend job:", payload);
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
              "🎉 [BACKUP] New position detected via database:",
              payload.new
            );

            // Check if this is a recent position (within last 2 minutes)
            const positionCreatedAt = new Date(payload.new.created_at);
            const timeDiff = Date.now() - positionCreatedAt.getTime();

            if (timeDiff < 2 * 60 * 1000) {
              console.log("✅ [BACKUP] Position is recent, resolving trade");
              channel.unsubscribe();

              // Convert database position to frontend Position format
              const position: Position = {
                id: payload.new.id,
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
              console.log("⏰ [BACKUP] Position is too old, ignoring");
            }
          }
        )

        .subscribe(status => {
          console.log("📡 [REALTIME] Subscription status:", status);
        });

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

      // Set up timeout for job completion (2 minutes)
      setTimeout(() => {
        console.error(
          "❌ [TRADE DEBUG] Trade placement timeout - no response from backend job or database"
        );
        console.error(
          "🔍 [TRADE DEBUG] Neither backend job completion nor database insertion detected"
        );
        console.error(
          "💡 [TRADE DEBUG] Possible issues: Insufficient balance, backend error, job queue stuck, or database insertion failed"
        );
        channel.unsubscribe();
        reject(
          new Error(
            "Trade placement timeout - no response from backend or database. Check your balance and try again."
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
    console.log("🌐 Making API call to /api/trades/positions/" + userId);

    // Use the authenticated API client with new endpoint
    const result = await apiClient.get<ApiResponse<CurrentPositionsResponse>>(
      `/api/trades/positions/${userId}`
    );

    console.log("📡 API response received:", result.success);

    if (!result.success) {
      console.error("❌ API call failed:", result.error);
      throw new Error(result.error || "Failed to get positions");
    }

    // The backend returns position summaries that need to be mapped to our Position format
    // Since the backend structure might be different, let's map it properly
    const backendPositions = result.data!.positions;

    // If positions are already in the correct format, return them
    // Otherwise, we might need to map them similar to how we do in getTradingHistoryPaginated
    const mappedPositions: Position[] = backendPositions.map((pos: any) => {
      // Always map from backend format to ensure consistency
      return {
        id: pos.id || pos.position_id || "",
        market: pos.market || "",
        direction: pos.trade_type
          ? (pos.trade_type as "LONG" | "SHORT")
          : pos.direction || "LONG",
        status: pos.status || "open",
        size: pos.quantity || pos.size || 0,
        entryPrice: pos.entry_price || pos.entryPrice || 0,
        exitPrice: pos.exit_price || pos.exitPrice || null,
        currentPrice:
          pos.current_price || pos.currentPrice || pos.entry_price || 0,
        pnl: pos.unrealized_pnl || pos.pnl || 0,
        pnlPercentage: pos.pnl_percentage || pos.pnlPercentage || 0,
        leverage: pos.leverage || 1,
        liquidationPrice: pos.liquidation_price || pos.liquidationPrice || 0,
        marginUsed: pos.margin_used || pos.marginUsed || 0,
        openedAt: pos.created_at || pos.openedAt || new Date().toISOString(),
        closedAt: pos.closed_at || pos.closedAt || null,
        duration: pos.duration || 0,
        fees: pos.fees || 0,
        points: pos.points || 0,
      } as Position;
    });

    console.log("✅ Mapped positions:", mappedPositions.length, "positions");
    return mappedPositions;
  } catch (error) {
    console.error("❌ Error getting open positions:", error);

    // If it's a 500 error, return empty array instead of crashing the app
    if (error instanceof Error && error.message.includes("500")) {
      console.log(
        "🔄 Backend endpoint not ready, returning empty positions array"
      );
      return [];
    }

    throw error;
  }
};

// Close a trading position using job-based system with realtime completion
export const closeTradingPosition = async (
  request: ClosePositionRequest
): Promise<Position> => {
  try {
    // Get user ID from current session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Convert legacy request format to new backend format
    const cancelRequest: CancelTradeRequest = {
      user_id: request.userId,
      position_id: request.positionId,
    };

    // Step 1: Start trade cancellation job
    const jobResponse = await cancelTradeJob(cancelRequest);

    console.log("Trade cancellation job started:", jobResponse.job_id);

    // Step 2: Set up realtime subscription for job completion
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error("No authenticated user found");
    }

    return new Promise((resolve, reject) => {
      const channel = supabase
        .channel(`trade:${userId}`)
        .on("broadcast", { event: "trade_cancelled" }, async payload => {
          console.log("🎉 Trade cancelled successfully:", payload);

          try {
            // Step 3: Get the updated position data from the payload or fetch from API
            if (payload.position) {
              channel.unsubscribe();
              resolve(payload.position as Position);
            } else if (payload.position_id) {
              // Fetch updated position details if only ID is provided
              try {
                const history = await getTradingHistory(
                  request.userId,
                  "closed",
                  50
                );
                const closedPosition = history.find(
                  p => p.id === payload.position_id
                );
                if (closedPosition) {
                  channel.unsubscribe();
                  resolve(closedPosition);
                } else {
                  throw new Error(
                    "Closed position not found after cancellation"
                  );
                }
              } catch (error) {
                throw new Error("Failed to retrieve closed position: " + error);
              }
            } else {
              throw new Error("No position data in trade cancellation payload");
            }
          } catch (error) {
            channel.unsubscribe();
            reject(error);
          }
        })
        .on("broadcast", { event: "trade_cancellation_failed" }, payload => {
          console.log("❌ Trade cancellation failed:", payload);
          channel.unsubscribe();
          reject(new Error(payload.error || "Trade cancellation failed"));
        })
        .subscribe(status => {
          console.log("Realtime subscription status:", status);
        });

      // Set up timeout for job completion (5 minutes)
      setTimeout(() => {
        channel.unsubscribe();
        reject(
          new Error(
            "Trade cancellation timeout - job took too long to complete"
          )
        );
      }, 5 * 60 * 1000);
    });
  } catch (error) {
    console.error("Error in trade cancellation flow:", error);
    throw error;
  }
};

// Pulled from backend but probably not needed
// Submit signed transaction to blockchain
export const submitSignedTransaction = async (
  request: SubmitTransactionRequest
): Promise<SubmitTransactionResponse> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.post<SubmitTransactionResponse>(
      `/api/trading/submit`,
      request
    );

    if (!result.success) {
      throw new Error(result.message || "Failed to submit transaction");
    }

    return result;
  } catch (error) {
    console.error("Error submitting signed transaction:", error);
    throw error;
  }
};

// Get trading history for a user with pagination
export const getTradingHistory = async (
  userId: string,
  status?: "open" | "closed",
  limit: number = 50,
  offset: number = 0
): Promise<Position[]> => {
  try {
    let endpoint = `/api/trades/history/${userId}?limit=${limit}&offset=${offset}`;
    if (status) {
      endpoint += `&status=${status}`;
    }

    console.log("🌐 Making API call to trading history:", endpoint);

    // Use the authenticated API client with new endpoint
    const result = await apiClient.get<
      ApiResponse<PaginatedResponse<PositionHistory>>
    >(endpoint);

    console.log("📡 Trading history API response received:", result.success);

    if (!result.success) {
      console.error("❌ Trading history API call failed:", result.error);
      throw new Error(result.error || "Failed to get trading history");
    }

    // Convert PositionHistory to Position format
    const positions: Position[] = result.data!.data.map(history => ({
      id: history.id,
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
  status?: "open" | "closed",
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedResponse<Position>> => {
  try {
    let endpoint = `/api/trades/history/${userId}?limit=${limit}&offset=${offset}`;
    if (status) {
      endpoint += `&status=${status}`;
    }

    const result = await apiClient.get<
      ApiResponse<PaginatedResponse<PositionHistory>>
    >(endpoint);

    if (!result.success) {
      throw new Error(result.error || "Failed to get trading history");
    }

    // Convert PositionHistory to Position format
    const positions: Position[] = result.data!.data.map(history => ({
      id: history.id,
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
