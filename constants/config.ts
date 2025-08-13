// Configuration constants
export const CONFIG = {
  API_BASE_URL: 'https://rekt-user-management.onrender.com',
  SOLANA_NETWORK: 'solana:mainnet-beta',
  USDC_MINT: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC
} as const;

// You can override these with environment variables if needed
export const getApiBaseUrl = (): string => {
  return CONFIG.API_BASE_URL;
};
