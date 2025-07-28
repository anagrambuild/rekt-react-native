// Removed Platform import since we're using IP address for all devices

// For React Native, localhost needs to be different for different platforms
// iOS Simulator: localhost or 127.0.0.1
// Android Emulator: 10.0.2.2
// Physical device: your computer's IP address
const BACKEND_BASE_URL = __DEV__
  ? 'http://10.0.0.245:3001' // Your computer's IP address for physical devices
  : 'http://localhost:3001';

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
  console.log(
    'Fetching token prices from backend:',
    `${BACKEND_BASE_URL}/api/markets`
  );

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/markets`);

    if (!response.ok) {
      throw new Error(
        `Backend API Error: ${response.status} ${response.statusText}`
      );
    }

    const data: BackendMarketResponse = await response.json();
    console.log('Backend response:', data);

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

    console.log('Processed token prices:', result);
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
  // For now, generate mock historical data based on current price
  // In a real implementation, you'd fetch from your backend's historical endpoint
  const currentPrices = await fetchTokenPrices([token]);
  const currentPrice = currentPrices[token]?.current_price || 100;

  // Generate 6 mock data points with some variation
  const chartData: ChartDataPoint[] = [];
  const now = Date.now();
  const timeframeMs =
    timeframe === '1m' ? 60000 : timeframe === '5m' ? 300000 : 3600000;

  for (let i = 5; i >= 0; i--) {
    const timestamp = now - i * timeframeMs;
    // Add some random variation (±2%)
    const variation = (Math.random() - 0.5) * 0.04;
    const price = currentPrice * (1 + variation);

    chartData.push({
      value: price,
      timestamp,
    });
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
    const response = await fetch(`${BACKEND_BASE_URL}/api/users/profile/${profileId}`);
    
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
      swig_wallet_address: userData.swigWalletAddress || '', // Add Swig wallet address
    };

    const response = await fetch(`${BACKEND_BASE_URL}/api/auth/create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendUserData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    console.log('✓ User created successfully:', result);

    // Map backend response to frontend User interface
    return {
      id: result.id || result.user_id || result.user?.id,
      username: result.username || result.user?.username,
      email: result.email || result.user?.email,
      profileImage: result.avatar_url || result.user?.avatar_url,
      walletAddress: result.wallet_address || result.user?.wallet_address || userData.walletAddress,
      swigWalletAddress: result.swig_wallet_address || result.user?.swig_wallet_address || userData.swigWalletAddress,
      createdAt: result.createdAt || result.created_at || result.user?.joined_at || new Date().toISOString(),
      updatedAt: result.updatedAt || result.updated_at || result.user?.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating user:', error);
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
    const response = await fetch(`${BACKEND_BASE_URL}/api/users/${userId}/swig-wallet`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ swigWalletAddress }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    console.log('✓ User Swig wallet address updated successfully:', result);

    return result;
  } catch (error) {
    console.error('Error updating user Swig wallet address:', error);
    throw error;
  }
};
