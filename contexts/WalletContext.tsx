/* eslint-disable @typescript-eslint/no-require-imports */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, Linking, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

import { getUserByWalletAddress } from '../utils/backendApi';
import { getSecureAuth, storeSecureAuth } from '../utils/secureAuth';
import { useAppContext } from './AppContext';
import { Buffer } from 'buffer';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import nacl from 'tweetnacl';

// Persistent wallet state outside React lifecycle
let persistentWalletState = {
  connected: false,
  publicKey: null as PublicKey | null,
  sharedSecret: null as Uint8Array | null,
  session: null as string | null,
};

// Use require for bs58 to avoid PRNG issues

const bs58 = require('bs58');

// Only import wallet adapter for Android
const isAndroid = Platform.OS === 'android';
let transact: any = null;

if (isAndroid) {
  try {
    const protocol = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
    transact = protocol.transact;
  } catch (error) {
    console.error('Failed to import mobile wallet adapter:', error);
  }
}

export interface WalletContextState {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  showWalletModal: boolean;
  getDappKeyPair: () => nacl.BoxKeyPair;
  sharedSecret: Uint8Array | null;
  session: string | null;
  usdcBalance: number | null;
  isLoadingBalance: boolean;
  balanceError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  setShowWalletModal: (show: boolean) => void;
  handleWalletConnect: (publicKey: string) => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextState>({
  connected: false,
  connecting: false,
  publicKey: null,
  showWalletModal: false,
  getDappKeyPair: () => ({
    publicKey: new Uint8Array(),
    secretKey: new Uint8Array(),
  }),
  sharedSecret: null,
  session: null,
  usdcBalance: null,
  isLoadingBalance: false,
  balanceError: null,
  connect: async () => {},
  disconnect: () => {},
  setShowWalletModal: () => {},
  handleWalletConnect: () => {},
  refreshBalance: async () => {},
});

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const { t } = useTranslation();
  const { setIsLoggedIn, setUserProfile, setRequiresBiometric } =
    useAppContext();

  // Initialize from persistent state
  const [connected, setConnected] = useState(persistentWalletState.connected);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(
    persistentWalletState.publicKey
  );

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Generate encryption keypair for Phantom communication - initialize once
  const [dappKeyPair] = useState<nacl.BoxKeyPair>(() => {
    try {
      return nacl.box.keyPair();
    } catch (error) {
      console.error('Failed to generate keypair:', error);
      // Return a dummy keypair, will be regenerated on next app restart
      return { publicKey: new Uint8Array(32), secretKey: new Uint8Array(32) };
    }
  });

  // Return the same keypair instance
  const getDappKeyPair = useCallback(() => {
    return dappKeyPair;
  }, [dappKeyPair]);
  const [sharedSecret, setSharedSecret] = useState<Uint8Array | null>(
    persistentWalletState.sharedSecret
  );
  const [session, setSession] = useState<string | null>(
    persistentWalletState.session
  );

  // USDC balance state
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Get Solana network from Expo config
  const solanaNetwork =
    Constants.expoConfig?.extra?.solanaNetwork || 'solana:devnet';

  // Get USDC mint address from config
  const usdcMint =
    Constants.expoConfig?.extra?.usdcMint ||
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

  // Helper function to handle login with biometric check
  const handleUserLogin = async (user: any) => {
    setUserProfile(user);

    // Check if biometrics are enabled for this user
    const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');

    if (biometricEnabled === 'true') {
      // Check if biometrics are available on device
      const isSupported = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (isSupported && isEnrolled) {
        // Require biometric authentication before logging in
        setRequiresBiometric(true);
      } else {
        // Biometrics not available, log in directly
        setIsLoggedIn(true);
      }
    } else {
      // Biometrics not enabled, log in directly
      setIsLoggedIn(true);
    }
  };

  // Function to fetch USDC balance using stored wallet address
  const refreshBalance = useCallback(async () => {
    setIsLoadingBalance(true);
    setBalanceError(null);

    try {
      // Get wallet address from secure storage
      const authResult = await getSecureAuth();
      if (!authResult.isValid || !authResult.data?.walletAddress) {
        setUsdcBalance(null);
        setBalanceError('No wallet address found');
        return;
      }

      const walletAddress = authResult.data.walletAddress;
      const walletPublicKey = new PublicKey(walletAddress);

      const cluster = solanaNetwork.includes('mainnet')
        ? 'mainnet-beta'
        : 'devnet';
      const connection = new Connection(clusterApiUrl(cluster), 'confirmed');

      // Get token accounts for the wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        {
          mint: new PublicKey(usdcMint),
        }
      );

      if (tokenAccounts.value.length === 0) {
        // No USDC token account found
        setUsdcBalance(0);
      } else {
        // Get the balance from the first token account
        const balance =
          tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        setUsdcBalance(balance || 0);
      }
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      setBalanceError('Failed to fetch USDC balance');
      setUsdcBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [solanaNetwork, usdcMint]);

  // Fetch balance when app loads (using stored wallet address)
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const connectAndroid = useCallback(async () => {
    if (!isAndroid || !transact) {
      return false;
    }

    try {
      const cluster = solanaNetwork.includes('mainnet')
        ? 'mainnet-beta'
        : 'devnet';
      const result = await transact(async (wallet: any) => {
        const authResult = await wallet.authorize({
          cluster: cluster,
          identity: {
            name: 'Rekt',
            uri: 'https://rekt.app',
            icon: 'favicon.ico',
          },
        });
        return authResult;
      });

      if (result.accounts.length > 0) {
        // Convert base64 address to PublicKey
        const base64Address = result.accounts[0].address;
        const addressBytes = Buffer.from(base64Address, 'base64');
        const pubKey = new PublicKey(addressBytes);

        // Update persistent state first
        persistentWalletState.connected = true;
        persistentWalletState.publicKey = pubKey;

        if (mountedRef.current) {
          setPublicKey(pubKey);
          setConnected(true);

          // Check for existing user (same as iOS flow)
          try {
            const publicKeyString = pubKey.toBase58();
            const existingUser = await getUserByWalletAddress(publicKeyString);

            if (existingUser) {
              // Store user data in secure storage
              await storeSecureAuth(
                existingUser.walletAddress,
                existingUser.swigWalletAddress || '',
                existingUser.id
              );

              // Set user profile and handle biometric check
              await handleUserLogin(existingUser);
            } else {
              console.log('👤 No existing user found, will need to sign up');
            }
          } catch (userLookupError) {
            console.error(
              'Error looking up user by wallet address:',
              userLookupError
            );
            // Don't show error to user, just continue with normal flow
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Android wallet connection failed:', error);
      Alert.alert(t('Connection Failed'), t('Failed to connect to wallet'));
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAndroid, transact, solanaNetwork, t, setIsLoggedIn, setUserProfile]);

  const handleWalletConnect = useCallback(
    async (publicKeyString: string) => {
      try {
        const pubKey = new PublicKey(publicKeyString);
        setPublicKey(pubKey);
        setConnected(true);
        setConnecting(false);

        // Check if user exists with this wallet address
        try {
          const existingUser = await getUserByWalletAddress(publicKeyString);

          if (existingUser) {
            // Store user data in secure storage
            await storeSecureAuth(
              existingUser.walletAddress,
              existingUser.swigWalletAddress || '',
              existingUser.id
            );

            // Set user profile and handle biometric check
            await handleUserLogin(existingUser);
          } else {
            console.log('👤 No existing user found, will need to sign up');
          }
        } catch (userLookupError) {
          console.error(
            'Error looking up user by wallet address:',
            userLookupError
          );
          // Don't show error to user, just continue with normal flow
        }
      } catch (error) {
        console.error('Invalid public key:', error);
        Alert.alert(t('Connection Failed'), t('Invalid wallet address'));
        setConnecting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, setIsLoggedIn, setUserProfile]
  );

  // Handle incoming URL schemes (wallet responses)
  // Android URL Handler (for MWA - keep it simple)
  useEffect(() => {
    if (!isAndroid) return;

    const handleAndroidUrl = (url: string) => {
      // Android MWA doesn't use URL schemes for transaction responses
      // MWA handles everything internally, so we just handle errors here
      if (url.includes('errorCode')) {
        try {
          const urlObj = new URL(url);
          const errorCode = urlObj.searchParams.get('errorCode');
          const errorMessage = urlObj.searchParams.get('errorMessage');
          console.error('Android MWA error:', errorCode, errorMessage);
          Alert.alert(
            t('Connection Failed'),
            errorMessage || t('Unknown wallet error')
          );
        } catch (error) {
          console.error('Failed to parse Android error response:', error);
        }
      }
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleAndroidUrl(url);
      }
    });

    // Listen for URL changes while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleAndroidUrl(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, [t]);

  // iOS URL Handler (for Phantom deep links)
  useEffect(() => {
    if (isAndroid) return; // Only run on iOS

    const handleiOSUrl = async (url: string) => {
      // Check for error response first
      if (url.includes('errorCode')) {
        try {
          const urlObj = new URL(url);
          const errorCode = urlObj.searchParams.get('errorCode');
          const errorMessage = urlObj.searchParams.get('errorMessage');
          console.error('iOS Phantom error:', errorCode, errorMessage);

          // If we have a test transaction resolver waiting, reject it
          if ((global as any).phantomTestSigningResolver) {
            (global as any).phantomTestSigningResolver.reject(
              new Error(errorMessage || 'Unknown wallet error')
            );
            delete (global as any).phantomTestSigningResolver;
          } else {
            // Otherwise show connection error
            Alert.alert(
              t('Connection Failed'),
              errorMessage || t('Unknown wallet error')
            );
          }
        } catch (error) {
          console.error('Failed to parse iOS error response:', error);
        }
        return;
      }

      // Handle full encrypted response (with phantom_encryption_public_key)
      if (
        url.includes('phantom_encryption_public_key') &&
        url.includes('data')
      ) {
        try {
          const urlObj = new URL(url);
          const phantomPublicKey = urlObj.searchParams.get(
            'phantom_encryption_public_key'
          );
          const data = urlObj.searchParams.get('data');
          const nonce = urlObj.searchParams.get('nonce');

          if (phantomPublicKey && data && nonce) {
            // Create shared secret
            const keyPair = getDappKeyPair();
            const sharedSecretDapp = nacl.box.before(
              bs58.decode(phantomPublicKey),
              keyPair.secretKey
            );

            // Decrypt the response
            const decryptedData = nacl.box.open.after(
              bs58.decode(data),
              bs58.decode(nonce),
              sharedSecretDapp
            );

            if (decryptedData) {
              const connectData = JSON.parse(
                Buffer.from(decryptedData).toString('utf8')
              );

              // PRIORITY 1: Check for test transaction resolver FIRST
              if ((global as any).phantomTestSigningResolver) {
                if (connectData.signature) {
                  (global as any).phantomTestSigningResolver.resolve(
                    connectData.signature
                  );
                  delete (global as any).phantomTestSigningResolver;
                } else if (connectData.transaction) {
                  (async () => {
                    try {
                      const {
                        Connection,
                        clusterApiUrl,
                      } = require('@solana/web3.js');
                      const cluster = solanaNetwork.includes('mainnet')
                        ? 'mainnet-beta'
                        : 'devnet';
                      const connection = new Connection(clusterApiUrl(cluster));

                      const signedTransactionBytes = bs58.decode(
                        connectData.transaction
                      );
                      const signature = await connection.sendRawTransaction(
                        signedTransactionBytes,
                        {
                          skipPreflight: false,
                          preflightCommitment: 'processed',
                        }
                      );

                      (global as any).phantomTestSigningResolver.resolve(
                        signature
                      );
                      delete (global as any).phantomTestSigningResolver;
                    } catch (sendError) {
                      console.error(
                        'Failed to send iOS signed transaction:',
                        sendError
                      );
                      (global as any).phantomTestSigningResolver.reject(
                        sendError as Error
                      );
                      delete (global as any).phantomTestSigningResolver;
                    }
                  })();
                }
              }
              // PRIORITY 2: Only check for wallet connection if NO test transaction resolver exists
              else if (connectData.public_key && connectData.session) {
                setSharedSecret(sharedSecretDapp);
                setSession(connectData.session);
                await handleWalletConnect(connectData.public_key);
              }
            } else {
              throw new Error('Unable to decrypt iOS response data');
            }
          }
        } catch (error) {
          console.error('Failed to parse iOS wallet response:', error);

          if ((global as any).phantomTestSigningResolver) {
            (global as any).phantomTestSigningResolver.reject(error as Error);
            delete (global as any).phantomTestSigningResolver;
          } else {
            Alert.alert(
              t('Connection Failed'),
              t('Failed to parse wallet response')
            );
          }
        }
      }
      // Handle transaction-only response (data + nonce, no phantom_encryption_public_key)
      else if (
        url.includes('data') &&
        url.includes('nonce') &&
        ((global as any).phantomSwigSigningResolver ||
          (global as any).phantomTestSigningResolver)
      ) {
        try {
          const urlObj = new URL(url);
          const data = urlObj.searchParams.get('data');
          const nonce = urlObj.searchParams.get('nonce');

          if (data && nonce && sharedSecret) {
            // Decrypt using the existing shared secret from wallet connection
            const decryptedData = nacl.box.open.after(
              bs58.decode(data),
              bs58.decode(nonce),
              sharedSecret
            );

            if (decryptedData) {
              const responseData = JSON.parse(
                Buffer.from(decryptedData).toString('utf8')
              );

              // Check for Swig resolver first
              if ((global as any).phantomSwigSigningResolver) {
                if (responseData.signature) {
                  (global as any).phantomSwigSigningResolver.resolve(
                    responseData.signature
                  );
                } else if (responseData.transaction) {
                  (global as any).phantomSwigSigningResolver.resolve(
                    responseData
                  );
                }
                delete (global as any).phantomSwigSigningResolver;
              }
              // Then check for test transaction resolver
              else if (responseData.signature) {
                (global as any).phantomTestSigningResolver.resolve(
                  responseData.signature
                );
                delete (global as any).phantomTestSigningResolver;
              } else if (responseData.transaction) {
                (async () => {
                  try {
                    const {
                      Connection,
                      clusterApiUrl,
                    } = require('@solana/web3.js');
                    const cluster = solanaNetwork.includes('mainnet')
                      ? 'mainnet-beta'
                      : 'devnet';
                    const connection = new Connection(clusterApiUrl(cluster));

                    const signedTransactionBytes = bs58.decode(
                      responseData.transaction
                    );
                    const signature = await connection.sendRawTransaction(
                      signedTransactionBytes,
                      {
                        skipPreflight: false,
                        preflightCommitment: 'processed',
                      }
                    );

                    (global as any).phantomTestSigningResolver.resolve(
                      signature
                    );
                    delete (global as any).phantomTestSigningResolver;
                  } catch (sendError) {
                    console.error(
                      'Failed to send iOS signed transaction:',
                      sendError
                    );
                    (global as any).phantomTestSigningResolver.reject(
                      sendError as Error
                    );
                    delete (global as any).phantomTestSigningResolver;
                  }
                })();
              } else {
                (global as any).phantomTestSigningResolver.reject(
                  new Error('No signature or transaction in iOS response')
                );
                delete (global as any).phantomTestSigningResolver;
              }
            } else {
              throw new Error('Unable to decrypt iOS transaction response');
            }
          } else {
            throw new Error(
              'Missing data, nonce, or sharedSecret for iOS transaction response'
            );
          }
        } catch (error) {
          console.error('Failed to parse iOS transaction response:', error);
          if ((global as any).phantomTestSigningResolver) {
            (global as any).phantomTestSigningResolver.reject(error as Error);
            delete (global as any).phantomTestSigningResolver;
          }
        }
      }
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleiOSUrl(url).catch(console.error);
      }
    });

    // Listen for URL changes while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleiOSUrl(event.url).catch(console.error);
    });

    return () => {
      subscription?.remove();
    };
  }, [handleWalletConnect, getDappKeyPair, sharedSecret, t, solanaNetwork]);

  const connect = useCallback(async () => {
    if (connecting || connected) {
      return;
    }

    setConnecting(true);

    try {
      if (isAndroid) {
        const success = await connectAndroid();
        if (!success) {
          setConnecting(false);
        } else {
          setConnecting(false);
        }
      } else if (Platform.OS === 'ios') {
        // For iOS, show the wallet selection modal or handle as needed
        setShowWalletModal(true);
        setConnecting(false); // Reset connecting state, modal will handle it
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setConnecting(false);
    }
  }, [connecting, connected, connectAndroid]);

  const disconnect = useCallback(() => {
    // Update persistent state
    persistentWalletState.connected = false;
    persistentWalletState.publicKey = null;
    persistentWalletState.sharedSecret = null;
    persistentWalletState.session = null;

    setConnected(false);
    setPublicKey(null);
    setSharedSecret(null);
    setSession(null);

    // Clear balance state
    setUsdcBalance(null);
    setBalanceError(null);
    setIsLoadingBalance(false);
  }, []);

  const value: WalletContextState = {
    connected,
    connecting,
    publicKey,
    showWalletModal,
    getDappKeyPair,
    sharedSecret,
    session,
    usdcBalance,
    isLoadingBalance,
    balanceError,
    connect,
    disconnect,
    setShowWalletModal,
    handleWalletConnect,
    refreshBalance,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
