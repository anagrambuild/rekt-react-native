import Constants from 'expo-constants';

const BACKEND_BASE_URL = Constants.expoConfig?.extra?.apiUrl;

export const CONFIG = {
  API_BASE_URL: BACKEND_BASE_URL,
  SOLANA_NETWORK: 'solana:mainnet-beta',
  USDC_MINT: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC
} as const;

// You can override these with environment variables if needed
export const getApiBaseUrl = (): string => {
  const url = CONFIG.API_BASE_URL;
  console.log('API_BASE_URL', url);
  return url;
};
