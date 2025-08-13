import { apiClient } from './apiClient';
import { supabase } from './supabase';
import Constants from 'expo-constants';

// Use the API URL from app.config.js
const BACKEND_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  'https://rekt-user-management.onrender.com';

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

export interface UsernameCheckApiResponse {
  available: boolean;
  suggestions: string[];
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

export interface PositionApiResponse {
  id: string;
  asset: string;
  direction: 'long' | 'short';
  status: string;
  size: number;
  entryPrice: number;
  exitPrice: number | null;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  leverage: number;
  liquidationPrice: number;
  marginUsed: number;
  openedAt: string;
  closedAt: string | null;
  duration: number;
  fees: number;
  points: number;
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
  sol: 'solana',
  eth: 'ethereum',
  btc: 'bitcoin',
} as const;

export type SupportedToken = keyof typeof SUPPORTED_TOKENS;

export const fetchTokenPrices = async (
  tokens: SupportedToken[] = ['sol', 'eth', 'btc']
): Promise<Partial<Record<SupportedToken, TokenPrice>>> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const data: BackendMarketResponse = await apiClient.get('/api/markets');

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from backend');
    }

    const result: Partial<Record<SupportedToken, TokenPrice>> = {};

    tokens.forEach((token) => {
      const marketKey = `${token.toUpperCase()}-PERP`;
      const marketData = data.data.find(
        (market) => market.symbol === marketKey
      );

      if (marketData) {
        result[token] = {
          id: SUPPORTED_TOKENS[token],
          symbol: token.toUpperCase(),
          name:
            token === 'sol'
              ? 'Solana'
              : token === 'eth'
              ? 'Ethereum'
              : 'Bitcoin',
          current_price: marketData.price,
          price_change_24h: marketData.change24h || 0,
          price_change_percentage_24h: marketData.change24h || 0,
          market_cap: 0, // Not provided by backend
          total_volume: marketData.volume24h || 0,
          last_updated: data.timestamp,
        };
      }
    });

    return result;
  } catch (error) {
    console.error('❌ Error fetching token prices:', error);
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
  | '1m'
  | '2m'
  | '5m'
  | '10m'
  | '1h'
  | '4h'
  | '1d';

export const fetchHistoricalData = async (
  token: SupportedToken,
  timeframe: SupportedTimeframe = '1m'
): Promise<ChartDataPoint[]> => {
  // Generate dynamic mock historical data based on real current price from backend
  const currentPrices = await fetchTokenPrices([token]);
  const currentPrice = currentPrices[token]?.current_price || 100;

  // Generate 7 mock data points with realistic price movement
  const chartData: ChartDataPoint[] = [];
  const now = Date.now();
  const timeframeMs =
    {
      '1m': 60000,
      '2m': 120000,
      '5m': 300000,
      '10m': 600000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
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
  swigWalletAddress?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  profileImage?: string;
  swigWalletAddress?: string;
}

export interface UsernameCheckResponse {
  available: boolean;
  suggestions?: string[];
}

export const checkUsernameAvailability = async (
  username: string
): Promise<UsernameCheckResponse> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const data = await apiClient.post<UsernameCheckApiResponse>(
      `/api/auth/check-username`,
      { username }
    );

    return {
      available: data.available,
      suggestions: data.suggestions,
    };
  } catch (error) {
    console.error('❌ Username check error:', error);
    throw error;
  }
};

export const getUserByProfileId = async (
  profileId: string
): Promise<User | null> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.get<UserApiResponse>(
      `/api/users/profile/${profileId}`
    );

    // Map backend response to frontend User interface
    return {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
      profileImage: result.user.avatar_url,
      swigWalletAddress: result.user.swig_wallet_address,
      createdAt: result.user.joined_at || new Date().toISOString(),
      updatedAt: result.user.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching user by profile ID:', error);
    return null;
  }
};

export const createUser = async (
  userData: CreateUserRequest
): Promise<User> => {
  try {
    // Map frontend data structure to backend expected structure
    const backendUserData = {
      username: userData.username,
      email: userData.email || '',
      avatar_url: userData.profileImage || '',
      wallet_address: userData.walletAddress,
      swig_wallet_address: userData.swigWalletAddress || '',
    };

    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.post<ApiResponse<UserApiResponse>>(
      `/api/auth/create-account`,
      backendUserData
    );

    // Map backend response to frontend User interface
    // Backend returns: { success: true, user: { id, username, email, ... }, message }
    return {
      id: result.data!.user.id,
      username: result.data!.user.username,
      email: result.data!.user.email,
      profileImage: result.data!.user.avatar_url,
      swigWalletAddress: result.data!.user.swig_wallet_address,
      createdAt: result.data!.user.joined_at || new Date().toISOString(),
      updatedAt: result.data!.user.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating user:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          'Request timed out. Please check your internet connection and try again.'
        );
      } else if (error.message.includes('Network request failed')) {
        throw new Error(
          'Network error. Please check if the backend server is running and accessible.'
        );
      }
    }

    throw error;
  }
};

export const updateUser = async (
  userId: string,
  userData: UpdateUserRequest
): Promise<User> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.put<ApiResponse<UserApiResponse>>(
      `/api/users/${userId}`,
      userData
    );

    // Map backend response to frontend User interface
    return {
      id: result.data!.user.id,
      username: result.data!.user.username,
      email: result.data!.user.email,
      profileImage: result.data!.user.avatar_url,
      swigWalletAddress: result.data!.user.swig_wallet_address,
      createdAt: result.data!.user.joined_at || new Date().toISOString(),
      updatedAt: result.data!.user.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const updateUserSwigWalletAddress = async (
  userId: string,
  swigWalletAddress: string
): Promise<User> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.put<ApiResponse<UserApiResponse>>(
      `/api/users/${userId}/swig-wallet`,
      { swig_wallet_address: swigWalletAddress }
    );

    // Map backend response to frontend User interface
    return {
      id: result.data!.user.id,
      username: result.data!.user.username,
      email: result.data!.user.email,
      profileImage: result.data!.user.avatar_url,
      swigWalletAddress: result.data!.user.swig_wallet_address,
      createdAt: result.data!.user.joined_at || new Date().toISOString(),
      updatedAt: result.data!.user.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error updating user Swig wallet address:', error);
    throw error;
  }
};

// File upload types
interface FileObject {
  uri: string;
  type: string;
  name: string;
}

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
    // Create FormData for file upload
    const formData = new FormData();

    // Add the image file to FormData
    const fileObject: FileObject = {
      uri: imageUri,
      type: 'image/jpeg', // Backend accepts JPEG, PNG, WebP, GIF
      name: fileName,
    };

    formData.append('avatar', fileObject as any); // FormData requires 'as any' for React Native

    // For FormData uploads, we need to use fetch directly but with auth headers
    // Get the auth token from Supabase
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${BACKEND_BASE_URL}/api/upload/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type header - let FormData set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          errorData.error ||
          `HTTP error! status: ${response.status}`
      );
    }

    const result: AvatarUploadResponse = await response.json();

    if (!result.success || !result.avatar_url) {
      throw new Error(result.message || 'Failed to upload avatar');
    }

    return result.avatar_url;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
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

export interface OpenPositionRequest {
  userId: string;
  asset: 'SOL-PERP' | 'BTC-PERP' | 'ETH-PERP';
  direction: 'long' | 'short';
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
  asset: string;
  direction: 'long' | 'short';
  status: string;
  size: number;
  entryPrice: number;
  exitPrice: number | null;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
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
  data?: {
    positionId?: string;
    transactionData?: TransactionData;
    needsInitialization?: boolean;
    initializationRequired?: boolean;
    initializationInstructions?: TransactionData;
    // Legacy fields for direct position creation
    asset?: string;
    direction?: 'long' | 'short';
    amount?: number;
    leverage?: number;
    entryPrice?: number;
    positionSize?: number;
    marginUsed?: number;
    status?: string;
    openedAt?: string;
  };
  message: string;
}

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
      throw new Error(result.error || 'Failed to get trading balance');
    }

    return result.data!;
  } catch (error) {
    console.error('Error getting trading balance:', error);
    throw error;
  }
};

// Get USDC balance using user ID (alias for getTradingBalance for compatibility)
export const getUSDCBalanceByUserId = async (
  userId: string
): Promise<TradingBalance> => {
  return getTradingBalance(userId);
};

// Open a new trading position (returns transaction data for signing)
export const openTradingPosition = async (
  request: OpenPositionRequest
): Promise<OpenPositionResponse> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.post<OpenPositionResponse>(
      `/api/trading/open`,
      request
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to open position');
    }

    return result;
  } catch (error) {
    console.error('Error opening trading position:', error);
    throw error;
  }
};

// Get open positions for a user
export const getOpenPositions = async (userId: string): Promise<Position[]> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.get<ApiResponse<Position[]>>(
      `/api/trading/positions/${userId}`
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to get positions');
    }

    return result.data!;
  } catch (error) {
    // console.error('Error getting open positions:', error);
    throw error;
  }
};

// Close a trading position (returns transaction data for signing)
export const closeTradingPosition = async (
  request: ClosePositionRequest
): Promise<ClosePositionResponse> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.post<ClosePositionResponse>(
      `/api/trading/close`,
      request
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to close position');
    }

    return result;
  } catch (error) {
    console.error('Error closing trading position:', error);
    throw error;
  }
};

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
      throw new Error(result.message || 'Failed to submit transaction');
    }

    return result;
  } catch (error) {
    console.error('Error submitting signed transaction:', error);
    throw error;
  }
};

// Get trading history for a user
export const getTradingHistory = async (
  userId: string,
  status?: 'open' | 'closed',
  limit: number = 50
): Promise<Position[]> => {
  try {
    let endpoint = `/api/trading/history/${userId}?limit=${limit}`;
    if (status) {
      endpoint += `&status=${status}`;
    }

    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.get<ApiResponse<Position[]>>(endpoint);

    if (!result.success) {
      throw new Error(result.error || 'Failed to get trading history');
    }

    return result.data!;
  } catch (error) {
    // console.error('Error getting trading history:', error);
    throw error;
  }
};

// Get user by wallet address
export const getUserByWalletAddress = async (
  walletAddress: string
): Promise<User | null> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.get<ApiResponse<UserApiResponse>>(
      `/api/users/by-wallet/${walletAddress}`
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to get user by wallet address');
    }

    // Map backend response to frontend User interface
    return {
      id: result.data!.user.id,
      username: result.data!.user.username,
      email: result.data!.user.email,
      profileImage: result.data!.user.avatar_url,
      swigWalletAddress: result.data!.user.swig_wallet_address,
      createdAt: result.data!.user.joined_at || new Date().toISOString(),
      updatedAt: result.data!.user.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting user by wallet address:', error);
    return null;
  }
};

// Update user profile using the correct backend endpoint
export const updateUserProfile = async (
  userId: string,
  userData: { username?: string; email?: string; avatar_url?: string }
): Promise<User> => {
  try {
    // Use the authenticated API client instead of raw fetch
    const result = await apiClient.put<ApiResponse<UserApiResponse>>(
      `/api/users/profile/${userId}`,
      userData
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to update user profile');
    }

    // Map backend response to frontend User interface
    return {
      id: result.data!.user.id,
      username: result.data!.user.username,
      email: result.data!.user.email,
      profileImage: result.data!.user.avatar_url,
      swigWalletAddress: result.data!.user.swig_wallet_address,
      createdAt: result.data!.user.joined_at || new Date().toISOString(),
      updatedAt: result.data!.user.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
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
      throw new Error(result.error || 'Failed to get Swig wallet balance');
    }
    return result.data!;
  } catch (error) {
    console.error('Error getting Swig wallet balance:', error);
    // Return zero balance on error to match backend behavior
    return {
      balance: 0,
      formatted: '$0.00',
      source: 'swig_wallet',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Delete avatar from storage
export const deleteAvatar = async (avatarUrl: string): Promise<void> => {
  try {
    // Extract filename from URL for deletion
    // URL format is typically: https://domain.com/storage/v1/object/public/avatars/filename.webp
    const urlParts = avatarUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    // Validate that we have a proper filename before making the request
    if (!filename || filename === avatarUrl) {
      console.warn('Could not extract filename from avatar URL:', avatarUrl);
      return;
    }

    // Backend expects UUID.webp format, validate before making request
    const filenameRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i;
    if (!filenameRegex.test(filename)) {
      console.warn(
        'Filename does not match expected format (UUID.webp):',
        filename
      );
      return;
    }

    // Use the authenticated API client instead of raw fetch
    await apiClient.delete(`/api/upload/avatar/${filename}`);
    console.log('✅ Successfully deleted old avatar:', filename);
  } catch (error) {
    console.warn('Error deleting old avatar:', error);
    // Don't throw error - we don't want to fail profile update if old image deletion fails
  }
};
