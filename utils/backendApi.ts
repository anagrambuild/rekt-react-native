import Constants from 'expo-constants';

// Use the API URL from app.config.js
const BACKEND_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  'https://rekt-user-management.onrender.com';

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
): Promise<Record<SupportedToken, TokenPrice>> => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/markets`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Backend API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: `${BACKEND_BASE_URL}/api/auth/create-account`,
        errorData,
      });

      if (response.status === 404) {
        throw new Error(
          `API endpoint not found. The backend server may not be properly deployed or the API structure has changed. Status: ${response.status}`
        );
      }

      throw new Error(
        errorData.message ||
          `HTTP error! status: ${response.status} - ${response.statusText}`
      );
    }

    const data: BackendMarketResponse = await response.json();

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from backend');
    }

    const result: Record<SupportedToken, TokenPrice> = {} as any;

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
      } else {
        console.warn(`No market data found for ${marketKey}`);
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw error;
  }
};

export const fetchSingleTokenPrice = async (
  token: SupportedToken
): Promise<TokenPrice> => {
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
  walletAddress: string;
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

export const getUserByProfileId = async (
  profileId: string
): Promise<User | null> => {
  try {
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/users/profile/${profileId}`
    );

    if (response.status === 404) {
      return null; // User doesn't exist
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Map backend response to frontend User interface
    return {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
      profileImage: result.user.avatar_url,
      walletAddress: result.user.wallet_address || '',
      swigWalletAddress: result.user.swig_wallet_address || '',
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
      avatar_url: userData.profileImage || '', // This will be the Supabase URL
      wallet_address: userData.walletAddress, // Add wallet address
      swigWalletAddress: userData.swigWalletAddress || '', // Backend expects camelCase
    };

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/auth/create-account`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendUserData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();

    // Map backend response to frontend User interface
    return {
      id: result.id || result.user_id || result.user?.id,
      username: result.username || result.user?.username,
      email: result.email || result.user?.email,
      profileImage: result.avatar_url || result.user?.avatar_url,
      walletAddress:
        result.wallet_address ||
        result.user?.wallet_address ||
        userData.walletAddress,
      swigWalletAddress:
        result.swig_wallet_address ||
        result.user?.swig_wallet_address ||
        userData.swigWalletAddress,
      createdAt:
        result.createdAt ||
        result.created_at ||
        result.user?.joined_at ||
        new Date().toISOString(),
      updatedAt:
        result.updatedAt ||
        result.updated_at ||
        result.user?.updated_at ||
        new Date().toISOString(),
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
    const response = await fetch(`${BACKEND_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    console.log('✓ User updated successfully:', result);

    return result;
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
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/users/${userId}/swig-wallet`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ swigWalletAddress }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();

    return result;
  } catch (error) {
    console.error('Error updating user Swig wallet address:', error);
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
    // Create FormData for file upload
    const formData = new FormData();

    // Add the image file to FormData
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg', // Backend accepts JPEG, PNG, WebP, GIF
      name: fileName,
    } as any);

    const response = await fetch(`${BACKEND_BASE_URL}/api/upload/avatar`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let FormData set it with boundary
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

export interface OpenPositionResponse {
  positionId: string;
  asset: string;
  direction: 'long' | 'short';
  amount: number;
  leverage: number;
  entryPrice: number;
  positionSize: number;
  marginUsed: number;
  status: 'open';
  openedAt: string;
}

export interface Position {
  id: string;
  asset: string;
  direction: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  leverage: number;
  liquidationPrice: number;
  marginUsed: number;
  openedAt: string;
}

export interface ClosePositionRequest {
  userId: string;
  positionId: string;
}

export interface ClosePositionResponse {
  positionId: string;
  exitPrice: number;
  pnl: number;
  pnlPercentage: number;
  closedAt: string;
}

// Get user's trading balance
export const getTradingBalance = async (userId: string): Promise<TradingBalance> => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/trading/balance/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get trading balance');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting trading balance:', error);
    throw error;
  }
};

// Open a new trading position
export const openTradingPosition = async (request: OpenPositionRequest): Promise<OpenPositionResponse> => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/trading/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to open position');
    }

    return result.data;
  } catch (error) {
    console.error('Error opening trading position:', error);
    throw error;
  }
};

// Get open positions for a user
export const getOpenPositions = async (userId: string): Promise<Position[]> => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/trading/positions/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get positions');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting open positions:', error);
    throw error;
  }
};

// Close a trading position
export const closeTradingPosition = async (request: ClosePositionRequest): Promise<ClosePositionResponse> => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/trading/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to close position');
    }

    return result.data;
  } catch (error) {
    console.error('Error closing trading position:', error);
    throw error;
  }
};

// Get trading history for a user
export const getTradingHistory = async (userId: string, status?: 'open' | 'closed', limit: number = 50): Promise<Position[]> => {
  try {
    let url = `${BACKEND_BASE_URL}/api/trading/history/${userId}?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get trading history');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting trading history:', error);
    throw error;
  }
};