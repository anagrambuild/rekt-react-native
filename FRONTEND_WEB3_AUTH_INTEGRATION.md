# Web3 Wallet Authentication - Frontend Integration Guide

This document provides instructions for integrating Web3 wallet authentication with Supabase in your React Native Expo app.

## Overview

This integration will:
1. Use your existing wallet connection logic (Phantom + Mobile Wallet Adapter)
2. Generate and sign authentication messages
3. Send signed messages to backend for verification
4. Receive Supabase session tokens
5. Maintain session persistence across app restarts

## Prerequisites

- Backend authentication endpoint implemented (see `BACKEND_WEB3_AUTH_RUST.md`)
- Existing wallet connection working (your current implementation is good)
- Supabase client configured

## Implementation Steps

### 1. Create Web3 Authentication Hook

Create `hooks/useWeb3Auth.ts`:

```typescript
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useWallet } from '@/contexts/WalletContext';

interface Web3AuthResponse {
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: {
      id: string;
      wallet_address: string;
    };
  };
}

export const useWeb3Auth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { publicKey, getDappKeyPair, sharedSecret, session } = useWallet();

  const createSignMessage = useCallback((walletAddress: string): string => {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    
    return `Sign in to Rekt App

Wallet: ${walletAddress}
Timestamp: ${timestamp}
Nonce: ${nonce}

This request will not trigger a blockchain transaction or cost any gas fees.`;
  }, []);

  const signMessageWithPhantom = useCallback(async (message: string): Promise<string> => {
    if (!publicKey || !sharedSecret || !session) {
      throw new Error('Wallet not connected');
    }

    try {
      const bs58 = require('bs58');
      const nacl = require('tweetnacl');
      const { Buffer } = require('buffer');

      // Create the sign request
      const signRequest = {
        method: 'signMessage',
        params: {
          message: bs58.encode(Buffer.from(message, 'utf8')),
          display: 'utf8',
        },
      };

      // Encrypt the request
      const keyPair = getDappKeyPair();
      const nonce = nacl.randomBytes(24);
      const encryptedPayload = nacl.box(
        Buffer.from(JSON.stringify(signRequest)),
        nonce,
        sharedSecret,
        keyPair.secretKey
      );

      // Create the deep link
      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(keyPair.publicKey),
        nonce: bs58.encode(nonce),
        redirect_link: 'rektreactnative://wallet-response',
        payload: bs58.encode(encryptedPayload),
      });

      const url = `phantom://v1/signMessage?${params.toString()}`;
      
      // Open Phantom
      const { Linking } = require('react-native');
      const canOpen = await Linking.canOpenURL(url);
      
      if (!canOpen) {
        throw new Error('Phantom wallet not installed');
      }

      await Linking.openURL(url);

      // Return a promise that resolves when the signature is received
      // Note: In a real implementation, you'd need to handle the response
      // from the deep link callback. For now, this is a placeholder.
      return new Promise((resolve, reject) => {
        // You'll need to implement the response handling logic
        // This would typically involve listening for the deep link response
        // and extracting the signature from the encrypted response
        setTimeout(() => {
          reject(new Error('Signature response handling not implemented'));
        }, 30000);
      });
    } catch (error) {
      console.error('Failed to sign message with Phantom:', error);
      throw error;
    }
  }, [publicKey, sharedSecret, session, getDappKeyPair]);

  const signMessageWithMWA = useCallback(async (message: string): Promise<string> => {
    const { Platform } = require('react-native');
    
    if (Platform.OS !== 'android') {
      throw new Error('Mobile Wallet Adapter only available on Android');
    }

    try {
      const protocol = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
      const { transact } = protocol;

      const result = await transact(async (wallet: any) => {
        const signedMessages = await wallet.signMessages({
          addresses: [publicKey!.toBase58()],
          payloads: [new TextEncoder().encode(message)],
        });
        
        return signedMessages[0];
      });

      // Convert signature to base58
      const bs58 = require('bs58');
      return bs58.encode(result);
    } catch (error) {
      console.error('Failed to sign message with MWA:', error);
      throw error;
    }
  }, [publicKey]);

  const authenticateWithBackend = useCallback(async (
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<Web3AuthResponse> => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
        signature,
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Authentication failed');
    }

    return response.json();
  }, []);

  const authenticateWallet = useCallback(async (): Promise<boolean> => {
    if (!publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return false;
    }

    setIsAuthenticating(true);

    try {
      const walletAddress = publicKey.toBase58();
      const message = createSignMessage(walletAddress);

      // Sign the message based on platform
      let signature: string;
      const { Platform } = require('react-native');
      
      if (Platform.OS === 'ios') {
        signature = await signMessageWithPhantom(message);
      } else {
        signature = await signMessageWithMWA(message);
      }

      // Authenticate with backend
      const authResponse = await authenticateWithBackend(walletAddress, signature, message);

      // Set the session in Supabase
      const { error } = await supabase.auth.setSession({
        access_token: authResponse.session.access_token,
        refresh_token: authResponse.session.refresh_token,
      });

      if (error) {
        throw new Error(`Failed to set Supabase session: ${error.message}`);
      }

      console.log('✅ Web3 authentication successful');
      return true;

    } catch (error) {
      console.error('❌ Web3 authentication failed:', error);
      Alert.alert('Authentication Failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    publicKey,
    createSignMessage,
    signMessageWithPhantom,
    signMessageWithMWA,
    authenticateWithBackend,
  ]);

  return {
    authenticateWallet,
    isAuthenticating,
  };
};
```

### 2. Update WalletContext Integration

Modify your `contexts/WalletContext.tsx` to integrate Web3 auth:

```typescript
// Add to your WalletContext interface
export interface WalletContextState {
  // ... existing properties
  authenticateWithSupabase: () => Promise<boolean>;
  isAuthenticating: boolean;
}

// In your WalletProvider component, add:
import { useWeb3Auth } from '@/hooks/useWeb3Auth';

export const WalletProvider = ({ children, setIsLoggedIn, setUserProfile, setRequiresBiometric }: WalletProviderProps) => {
  // ... existing code

  const { authenticateWallet, isAuthenticating } = useWeb3Auth();

  // Update your connect function to include authentication
  const connect = useCallback(async () => {
    if (connecting || connected) {
      return;
    }

    setConnecting(true);

    try {
      if (isAndroid) {
        const success = await connectAndroid();
        if (success) {
          // After successful wallet connection, authenticate with Supabase
          const authSuccess = await authenticateWallet();
          if (authSuccess) {
            setIsLoggedIn(true);
          }
        }
        setConnecting(false);
      } else if (Platform.OS === 'ios') {
        setShowWalletModal(true);
        setConnecting(false);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setConnecting(false);
    }
  }, [connecting, connected, connectAndroid, authenticateWallet, setIsLoggedIn]);

  // Add to your context value
  const value: WalletContextState = {
    // ... existing properties
    authenticateWithSupabase: authenticateWallet,
    isAuthenticating,
  };
};
```

### 3. Handle iOS Phantom Response

Update your iOS URL handler in `WalletContext.tsx` to handle signature responses:

```typescript
// In your iOS URL handler, add signature response handling
const handleiOSUrl = async (url: string) => {
  console.log("🔗 iOS URL received:", url);

  // Handle wallet connection response (existing code)
  if (url.includes("rektreactnative://") && url.includes("phantom_encryption_public_key")) {
    // ... existing connection handling code
  }

  // Handle signature response
  if (url.includes("rektreactnative://wallet-response")) {
    try {
      const urlObj = new URL(url);
      const data = urlObj.searchParams.get("data");
      const nonce = urlObj.searchParams.get("nonce");

      if (data && nonce && sharedSecret) {
        const bs58 = require('bs58');
        const nacl = require('tweetnacl');
        const { Buffer } = require('buffer');

        // Decrypt the response
        const decryptedData = nacl.box.open.after(
          bs58.decode(data),
          bs58.decode(nonce),
          sharedSecret
        );

        if (decryptedData) {
          const response = JSON.parse(Buffer.from(decryptedData).toString('utf8'));
          
          if (response.signature) {
            // Store the signature for the authentication process
            // You'll need to implement a way to resolve the pending signature promise
            console.log('✅ Received signature from Phantom:', response.signature);
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to process signature response:", error);
    }
    return;
  }

  // Handle error responses (existing code)
  // ...
};
```

### 4. Update Login Flow

Modify your login screens to use the new Web3 authentication:

```typescript
// In your login component (e.g., Step5.tsx or wherever you handle final login)
import { useWallet } from '@/contexts/WalletContext';

export const LoginStep = () => {
  const { connected, authenticateWithSupabase, isAuthenticating } = useWallet();

  const handleWeb3Login = async () => {
    if (!connected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    const success = await authenticateWithSupabase();
    if (success) {
      // Navigation or state update will be handled by the context
      console.log('User authenticated successfully');
    }
  };

  return (
    <View>
      {connected ? (
        <TouchableOpacity 
          onPress={handleWeb3Login}
          disabled={isAuthenticating}
          style={styles.authButton}
        >
          <Text>
            {isAuthenticating ? 'Authenticating...' : 'Sign In with Wallet'}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text>Please connect your wallet first</Text>
      )}
    </View>
  );
};
```

### 5. Environment Variables

Add to your `.env` file:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
# or your production backend URL
```

### 6. Update App Layout

Modify your `app/_layout.tsx` to handle the new authentication state:

```typescript
// In your root layout, update the authentication check
export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <WalletProvider setIsLoggedIn={setIsLoggedIn} setUserProfile={setUserProfile} setRequiresBiometric={setRequiresBiometric}>
      <Stack>
        {isLoggedIn ? (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="index" options={{ headerShown: false }} />
        )}
      </Stack>
    </WalletProvider>
  );
}
```

### 7. Handle Logout

Update your logout functionality to clear both wallet and Supabase sessions:

```typescript
// In your WalletContext or wherever you handle logout
const logout = useCallback(async () => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear wallet connection
    disconnect();
    
    // Update app state
    setIsLoggedIn(false);
    setUserProfile(null);
    
    console.log('✅ Logged out successfully');
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
}, [disconnect, setIsLoggedIn, setUserProfile]);
```

## Testing the Integration

### 1. Test Wallet Connection
```typescript
// Ensure your existing wallet connection still works
const testWalletConnection = async () => {
  const { connected, connect } = useWallet();
  
  if (!connected) {
    await connect();
  }
  
  console.log('Wallet connected:', connected);
};
```

### 2. Test Authentication Flow
```typescript
// Test the full authentication flow
const testFullAuth = async () => {
  const { connected, authenticateWithSupabase } = useWallet();
  
  if (connected) {
    const success = await authenticateWithSupabase();
    console.log('Authentication success:', success);
    
    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Supabase session:', !!session);
  }
};
```

### 3. Test Session Persistence
```typescript
// Test that sessions persist across app restarts
const testSessionPersistence = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session persisted:', !!session);
  
  if (session) {
    console.log('User ID:', session.user.id);
    console.log('Wallet address:', session.user.user_metadata?.wallet_address);
  }
};
```

## Error Handling

Common errors and solutions:

### 1. Signature Verification Failed
```typescript
// Ensure message format matches exactly between frontend and backend
const message = createSignMessage(walletAddress);
console.log('Message to sign:', message);
```

### 2. Backend Connection Issues
```typescript
// Add proper error handling for network issues
try {
  const response = await authenticateWithBackend(walletAddress, signature, message);
} catch (error) {
  if (error.message.includes('Network')) {
    Alert.alert('Network Error', 'Please check your internet connection');
  } else {
    Alert.alert('Authentication Error', error.message);
  }
}
```

### 3. Session Not Persisting
```typescript
// Ensure Supabase client is configured correctly
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,        // Required for persistence
    autoRefreshToken: true,       // Required for token refresh
    persistSession: true,         // Required for session persistence
    detectSessionInUrl: false,    // Not needed for mobile
  },
});
```

## Security Considerations

1. **Message Validation**: Backend validates message format and timestamp
2. **Signature Verification**: Cryptographic verification of wallet signatures
3. **Session Management**: Proper token refresh and expiration handling
4. **Error Handling**: Don't expose sensitive information in error messages
5. **Rate Limiting**: Backend should implement rate limiting

## Migration Notes

- Your existing wallet connection logic remains unchanged
- Supabase session management works the same as email auth
- All existing `authenticatedApiCall()` functions work without changes
- User data is stored in Supabase with wallet address in metadata

This integration maintains your current wallet UX while adding proper authentication and session management through Supabase.