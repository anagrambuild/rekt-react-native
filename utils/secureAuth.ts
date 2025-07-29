import { PublicKey } from '@solana/web3.js';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SecureStore = require('expo-secure-store');

// Constants for session management
const AUTH_STORAGE_KEY = 'userAuth';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_REASONABLE_TIME = 30 * 24 * 60 * 60 * 1000; // 30 days for tampering detection

export interface SecureAuthData {
  walletAddress: string;
  swigAddress: string;
  profileId: string;
  timestamp: number;
  deviceId?: string;
}

export interface AuthValidationResult {
  isValid: boolean;
  data?: SecureAuthData;
  reason?:
    | 'expired'
    | 'tampered'
    | 'missing'
    | 'invalid_format'
    | 'invalid_addresses';
}

/**
 * Stores authentication data securely with timestamp
 */
export const storeSecureAuth = async (
  walletAddress: string | PublicKey,
  swigAddress: string | PublicKey,
  profileId: string
): Promise<void> => {
  try {
    const authData: SecureAuthData = {
      walletAddress: walletAddress.toString(),
      swigAddress: swigAddress.toString(),
      profileId,
      timestamp: Date.now(),
      deviceId: await getDeviceId(),
    };

    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(authData));
    console.log('✓ Authentication data stored securely');
  } catch (error) {
    console.error('Failed to store secure auth data:', error);
    throw new Error('Failed to store authentication data');
  }
};

/**
 * Retrieves and validates stored authentication data
 */
export const getSecureAuth = async (): Promise<AuthValidationResult> => {
  try {
    const storedData = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);

    if (!storedData) {
      return { isValid: false, reason: 'missing' };
    }

    let authData: SecureAuthData;
    try {
      authData = JSON.parse(storedData);
    } catch (error) {
      console.error('Failed to parse stored auth data:', error);
      return { isValid: false, reason: 'invalid_format' };
    }

    // Validate required fields
    if (
      !authData.walletAddress ||
      !authData.swigAddress ||
      !authData.profileId ||
      !authData.timestamp
    ) {
      return { isValid: false, reason: 'invalid_format' };
    }

    // Validate addresses format
    try {
      new PublicKey(authData.walletAddress);
      new PublicKey(authData.swigAddress);
    } catch (error) {
      console.error('Invalid address format in stored auth:', error);
      return { isValid: false, reason: 'invalid_addresses' };
    }

    // Check for session expiration
    const now = Date.now();
    const timeSinceAuth = now - authData.timestamp;

    if (timeSinceAuth > SESSION_DURATION) {
      console.log('Session expired, requiring re-authentication');
      return { isValid: false, reason: 'expired' };
    }

    // Check for suspicious timestamp (tampering detection)
    const timeDiff = Math.abs(now - authData.timestamp);
    if (timeDiff > MAX_REASONABLE_TIME) {
      console.warn('Suspicious timestamp detected, possible tampering');
      return { isValid: false, reason: 'tampered' };
    }

    // Check if timestamp is in the future (another tampering indicator)
    if (authData.timestamp > now + 5 * 60 * 1000) {
      // 5 minutes tolerance
      console.warn('Future timestamp detected, possible tampering');
      return { isValid: false, reason: 'tampered' };
    }

    return { isValid: true, data: authData };
  } catch (error) {
    console.error('Error retrieving secure auth data:', error);
    return { isValid: false, reason: 'missing' };
  }
};

/**
 * Clears stored authentication data
 */
export const clearSecureAuth = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear secure auth data:', error);
  }
};

/**
 * Updates the timestamp of existing auth data (for session refresh)
 */
export const refreshSecureAuthTimestamp = async (): Promise<boolean> => {
  try {
    const currentAuth = await getSecureAuth();
    if (!currentAuth.isValid || !currentAuth.data) {
      return false;
    }

    const updatedAuthData: SecureAuthData = {
      ...currentAuth.data,
      timestamp: Date.now(),
    };

    await SecureStore.setItemAsync(
      AUTH_STORAGE_KEY,
      JSON.stringify(updatedAuthData)
    );
    console.log('✓ Authentication timestamp refreshed');
    return true;
  } catch (error) {
    console.error('Failed to refresh auth timestamp:', error);
    return false;
  }
};

/**
 * Gets session info for display purposes
 */
export const getSessionInfo = async (): Promise<{
  lastLogin?: Date;
  daysRemaining?: number;
  isExpiringSoon?: boolean;
} | null> => {
  const authResult = await getSecureAuth();
  if (!authResult.isValid || !authResult.data) {
    return null;
  }

  const lastLogin = new Date(authResult.data.timestamp);
  const now = Date.now();
  const timeRemaining = SESSION_DURATION - (now - authResult.data.timestamp);
  const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
  const isExpiringSoon = daysRemaining <= 1;

  return {
    lastLogin,
    daysRemaining: Math.max(0, daysRemaining),
    isExpiringSoon,
  };
};

/**
 * Simple device ID generation for basic tracking
 */
const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await SecureStore.getItemAsync('deviceId');
    if (!deviceId) {
      // Generate a simple device ID
      deviceId = `device_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;
      await SecureStore.setItemAsync('deviceId', deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Failed to get/generate device ID:', error);
    return `fallback_${Date.now()}`;
  }
};

/**
 * Validates that wallet and swig addresses have the correct relationship
 */
export const validateAddressRelationship = (
  walletAddress: string,
  swigAddress: string
): boolean => {
  try {
    // Import the derivation function from swigUtils
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { deriveUserSwigAddress } = require('./swigUtils');
    const walletPubKey = new PublicKey(walletAddress);
    const expectedSwigAddress = deriveUserSwigAddress(walletPubKey);

    return expectedSwigAddress.toString() === swigAddress;
  } catch (error) {
    console.error('Failed to validate address relationship:', error);
    return false;
  }
};

/**
 * Comprehensive auth validation including address relationship
 */
export const validateSecureAuth = async (): Promise<
  AuthValidationResult & {
    addressRelationshipValid?: boolean;
  }
> => {
  const basicValidation = await getSecureAuth();

  if (!basicValidation.isValid || !basicValidation.data) {
    return basicValidation;
  }

  // Additional validation: check address relationship
  const addressRelationshipValid = validateAddressRelationship(
    basicValidation.data.walletAddress,
    basicValidation.data.swigAddress
  );

  if (!addressRelationshipValid) {
    console.warn('Address relationship validation failed');
    return {
      isValid: false,
      reason: 'tampered',
      addressRelationshipValid: false,
    };
  }

  return {
    ...basicValidation,
    addressRelationshipValid: true,
  };
};
