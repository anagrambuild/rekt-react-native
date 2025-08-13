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

import { PublicKey } from '@solana/web3.js';

import { getSwigWalletBalance, getUserByProfileId } from '../utils/backendApi';
import { supabase } from '../utils/supabase';
import { Buffer } from 'buffer';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import * as nacl from 'tweetnacl';

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
  // Supabase auth state
  supabaseUser: any;
  supabaseLoading: boolean;
  supabaseError: string | null;
  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  setShowWalletModal: (show: boolean) => void;
  handleWalletConnect: (publicKey: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  signInWithSupabase: (publicKey: string) => Promise<boolean>;
  signOut: () => Promise<void>;
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
  supabaseUser: null,
  supabaseLoading: false,
  supabaseError: null,
  connect: async () => {},
  disconnect: () => {},
  setShowWalletModal: () => {},
  handleWalletConnect: async () => {},
  refreshBalance: async () => {},
  signInWithSupabase: async () => false,
  signOut: async () => {},
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
  setIsLoggedIn: (value: boolean) => void;
  setUserProfile: (profile: any) => void;
  setRequiresBiometric: (value: boolean) => void;
}

export const WalletProvider = ({
  children,
  setIsLoggedIn,
  setUserProfile,
  setRequiresBiometric,
}: WalletProviderProps) => {
  const { t } = useTranslation();

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

  // Supabase auth state
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const solanaNetwork =
    Constants.expoConfig?.extra?.solanaNetwork || 'solana:devnet';

  // Check for existing Supabase session on mount
  useEffect(() => {
    const checkSupabaseSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setSupabaseUser(session.user);

          // If we have a valid session, check if user profile exists
          if (session.user?.id) {
            try {
              const userProfile = await getUserByProfileId(session.user.id);
              if (userProfile) {
                setUserProfile(userProfile);
                // AppContext will handle biometric check and login
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking Supabase session:', error);
      }
    };

    checkSupabaseSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth state change:', event, session?.user?.id);
      setSupabaseUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch user profile after successful sign in
        try {
          const userProfile = await getUserByProfileId(session.user.id);
          if (userProfile) {
            setUserProfile(userProfile);
            // AppContext will handle biometric check and login
          }
        } catch (error) {
          console.error('Error fetching user profile after sign in:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setIsLoggedIn(false);
        setRequiresBiometric(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUserProfile, setIsLoggedIn, setRequiresBiometric]);

  // Function to fetch USDC balance using stored wallet address
  const refreshBalance = useCallback(async () => {
    setIsLoadingBalance(true);
    setBalanceError(null);

    try {
      // Get wallet address from Supabase session
      if (!supabaseUser?.user_metadata?.wallet_address) {
        setUsdcBalance(null);
        setBalanceError('No wallet address found');
        return;
      }

      const swigWalletAddress = supabaseUser.user_metadata.swig_wallet_address;
      if (!swigWalletAddress) {
        setUsdcBalance(null);
        setBalanceError('No Swig wallet address found');
        return;
      }
      const balanceData = await getSwigWalletBalance(swigWalletAddress);

      if (balanceData.status === 'error') {
        setBalanceError(balanceData.error || 'Failed to fetch USDC balance');
        setUsdcBalance(null);
      } else {
        setUsdcBalance(balanceData.balance);
      }
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      setBalanceError('Failed to fetch USDC balance');
      setUsdcBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [supabaseUser]);

  // Fetch balance when app loads (using Supabase user)
  useEffect(() => {
    if (supabaseUser) {
      refreshBalance();
    }
  }, [supabaseUser, refreshBalance]);

  // Supabase Web3 authentication
  const signInWithSupabase = useCallback(
    async (publicKeyString: string): Promise<boolean> => {
      setSupabaseLoading(true);
      setSupabaseError(null);

      try {
        // Create a message to sign
        const message = `Sign in to Rekt\n\nWallet: ${publicKeyString}\nTimestamp: ${Date.now()}`;

        if (isAndroid) {
          // For Android, use Mobile Wallet Adapter to sign message
          if (!transact) {
            setSupabaseError('Mobile Wallet Adapter not available');
            setSupabaseLoading(false);
            return false;
          }

          const cluster = solanaNetwork.includes('mainnet')
            ? 'mainnet-beta'
            : 'devnet';

          const result = await transact(async (wallet: any) => {
            // First authorize if not already done
            const authResult = await wallet.authorize({
              cluster: cluster,
              identity: {
                name: 'Rekt',
                uri: 'https://rekt.app',
                icon: 'favicon.ico',
              },
            });

            // Then sign the message
            const signResult = await wallet.signMessages({
              addresses: [publicKeyString],
              payloads: [Buffer.from(message, 'utf8')],
            });

            return {
              auth: authResult,
              sign: signResult,
            };
          });

          if (result.sign.signedMessages.length > 0) {
            const signedMessage = result.sign.signedMessages[0];
            const signature = bs58.encode(signedMessage.signatures[0]);

            // Now authenticate with Supabase using the signed message
            const { data, error } = await supabase.auth.signInWithWeb3({
              chain: 'solana',
              wallet: {
                address: publicKeyString,
                message: message,
                signature: signature,
              } as any, // Type assertion for now - we'll need to check exact Supabase types
            });

            if (error) {
              setSupabaseError(error.message);
              setSupabaseLoading(false);
              return false;
            }

            setSupabaseUser(data.user);
            setSupabaseLoading(false);
            setSupabaseError(null);
            return true;
          } else {
            setSupabaseError('Failed to sign message');
            setSupabaseLoading(false);
            return false;
          }
        } else {
          // For iOS, we now handle authentication during wallet connection
          // So we just need to wait for the wallet connection to complete
          // and then the authentication will happen automatically

          console.log('📱 iOS: Waiting for wallet connection to complete...');

          // Create a promise that will be resolved when the wallet connection completes
          // and authentication is handled in the deep link handler
          const authPromise = new Promise<boolean>((resolve, reject) => {
            // Store the request details globally so the deep link handler can resolve it
            (global as any).phantomSigningRequest = {
              id: `auth_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              message: message,
              publicKey: publicKeyString,
              resolve: resolve,
              reject: reject,
            };
          });

          // Wait for authentication to complete (with timeout)
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(
              () =>
                reject(
                  new Error(
                    'Authentication timeout - please try connecting wallet again'
                  )
                ),
              30000
            );
          });

          try {
            const result = await Promise.race([authPromise, timeoutPromise]);
            return result;
          } catch (error) {
            setSupabaseError(`Authentication failed: ${error}`);
            setSupabaseLoading(false);
            return false;
          } finally {
            // Clean up
            delete (global as any).phantomSigningRequest;
          }
        }
      } catch (err: any) {
        console.error('Supabase Web3 auth error:', err);
        setSupabaseError(err.message || 'Unknown error');
        setSupabaseLoading(false);
        return false;
      }
    },

    [solanaNetwork]
  );

  // Sign out from Supabase
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setSupabaseUser(null);
      setUserProfile(null);
      setIsLoggedIn(false);
      setRequiresBiometric(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [setUserProfile, setIsLoggedIn, setRequiresBiometric]);

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

          // Attempt Supabase authentication
          const publicKeyString = pubKey.toBase58();
          const authSuccess = await signInWithSupabase(publicKeyString);

          if (!authSuccess) {
            // If Supabase auth fails, disconnect wallet
            disconnect();
            Alert.alert(
              t('Authentication Failed'),
              t('Failed to authenticate with Supabase')
            );
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
  }, [isAndroid, transact, solanaNetwork, signInWithSupabase]);

  const handleWalletConnect = useCallback(
    async (publicKeyString: string) => {
      try {
        const pubKey = new PublicKey(publicKeyString);
        setPublicKey(pubKey);
        setConnected(true);
        setConnecting(false);

        // Attempt Supabase authentication
        const authSuccess = await signInWithSupabase(publicKeyString);

        if (!authSuccess) {
          // If Supabase auth fails, disconnect wallet
          disconnect();
          Alert.alert(
            t('Authentication Failed'),
            t('Failed to authenticate with Supabase')
          );
        }
      } catch (error) {
        console.error('Invalid public key:', error);
        Alert.alert(t('Connection Failed'), t('Invalid wallet address'));
        setConnecting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signInWithSupabase]
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
      console.log('🔗 iOS URL received:', url);

      // Check for message signing response from Phantom
      if (url.includes('rektreactnative://sign')) {
        try {
          const urlObj = new URL(url);
          const requestId = urlObj.searchParams.get('requestId');

          if (requestId && (global as any).phantomSigningRequest) {
            console.log(
              '📝 Processing message signing response for request:',
              requestId
            );

            // Phantom should have signed the message and returned it
            // For now, we'll simulate the response since Phantom's actual response format may vary
            // In a real implementation, you'd need to handle Phantom's specific response format

            // For testing, let's create a mock signature (this should be replaced with actual Phantom response handling)
            const mockSignature = 'mock_signature_for_testing';

            // Now authenticate with Supabase using the signed message
            const { data: authData, error } =
              await supabase.auth.signInWithWeb3({
                chain: 'solana',
                wallet: {
                  address: (global as any).phantomSigningRequest.publicKey,
                  message: (global as any).phantomSigningRequest.message,
                  signature: mockSignature,
                } as any,
              });

            if (error) {
              console.error('❌ Supabase auth error:', error);
              (global as any).phantomSigningRequest.reject(
                new Error(error.message)
              );
            } else {
              console.log('✅ Message signing successful, user authenticated');
              // Update Supabase user state with the authenticated user
              setSupabaseUser(authData.user);
              (global as any).phantomSigningRequest.resolve(true);
            }

            delete (global as any).phantomSigningRequest;
            return;
          }
        } catch (error) {
          console.error(
            '❌ Failed to process message signing response:',
            error
          );
          if ((global as any).phantomSigningRequest) {
            (global as any).phantomSigningRequest.reject(error as Error);
            delete (global as any).phantomSigningRequest;
          }
        }
      }

      // Handle wallet connection response from Phantom (this is what we're actually receiving)
      if (
        url.includes('rektreactnative://') &&
        url.includes('phantom_encryption_public_key')
      ) {
        try {
          console.log('🔐 Processing wallet connection response from Phantom');

          const urlObj = new URL(url);
          const phantomPublicKey = urlObj.searchParams.get(
            'phantom_encryption_public_key'
          );
          const data = urlObj.searchParams.get('data');
          const nonce = urlObj.searchParams.get('nonce');

          if (phantomPublicKey && data && nonce) {
            console.log('📡 Decrypting wallet connection response...');

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

              console.log('🔓 Decrypted wallet data:', connectData);

              // Handle regular wallet connection if no signing request
              if (connectData.public_key && connectData.session) {
                console.log('🔗 Processing wallet connection...');
                setSharedSecret(sharedSecretDapp);
                setSession(connectData.session);

                // Instead of calling handleWalletConnect which will trigger another message signing request,
                // we'll directly set the wallet state and then handle message signing here
                const pubKey = new PublicKey(connectData.public_key);
                setPublicKey(pubKey);
                setConnected(true);
                setConnecting(false);

                // Now we need to trigger Supabase authentication
                // Since this is a new connection, we should call signInWithSupabase
                // which will create the phantomSigningRequest and then we can handle it
                console.log('🔐 Triggering Supabase authentication...');

                try {
                  // Check if there's already a pending authentication request
                  if ((global as any).phantomSigningRequest) {
                    console.log(
                      '📝 Found pending authentication request, resolving it...'
                    );

                    // We already have the wallet connection, so we can resolve this immediately
                    // Create a mock signature that represents the successful wallet connection
                    const message = (global as any).phantomSigningRequest
                      .message;
                    const walletAddress = (global as any).phantomSigningRequest
                      .publicKey;
                    const mockSignature = `phantom_wallet_connection_${Date.now()}_${walletAddress}`;

                    console.log(
                      '🔐 Authenticating with Supabase using wallet connection...'
                    );

                    // Now authenticate with Supabase using the wallet connection as proof
                    const { data: authData, error } =
                      await supabase.auth.signInWithWeb3({
                        chain: 'solana',
                        wallet: {
                          address: walletAddress,
                          message: message,
                          signature: mockSignature,
                        } as any,
                      });

                    if (error) {
                      console.error('❌ Supabase auth error:', error);
                      (global as any).phantomSigningRequest.reject(
                        new Error(error.message)
                      );
                    } else {
                      console.log(
                        '✅ Authentication successful using wallet connection!'
                      );
                      // Update Supabase user state with the authenticated user
                      setSupabaseUser(authData.user);
                      (global as any).phantomSigningRequest.resolve(true);
                    }

                    delete (global as any).phantomSigningRequest;
                  } else {
                    // No pending request, just complete the wallet connection
                    console.log('✅ Wallet connected successfully');
                  }
                } catch (error) {
                  console.error(
                    '❌ Error during Supabase authentication:',
                    error
                  );
                }
              }
            } else {
              throw new Error('Unable to decrypt iOS response data');
            }
          }
        } catch (error) {
          console.error(
            '❌ Failed to process wallet connection response:',
            error
          );

          // If we have a signing request waiting, reject it
          if ((global as any).phantomSigningRequest) {
            (global as any).phantomSigningRequest.reject(error as Error);
            delete (global as any).phantomSigningRequest;
          } else {
            Alert.alert(
              t('Connection Failed'),
              'Failed to process wallet response'
            );
          }
        }
        return;
      }

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
          (global as any).phantomTestSigningResolver ||
          (global as any).phantomSigningRequest)
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

              // Check for message signing request first
              if ((global as any).phantomSigningRequest) {
                if (responseData.signature && responseData.publicKey) {
                  // Verify the public key matches
                  if (
                    responseData.publicKey ===
                    (global as any).phantomSigningRequest.publicKey
                  ) {
                    // Now authenticate with Supabase using the signed message
                    const { data: authData, error } =
                      await supabase.auth.signInWithWeb3({
                        chain: 'solana',
                        wallet: {
                          address: responseData.publicKey,
                          message: (global as any).phantomSigningRequest
                            .message,
                          signature: responseData.signature,
                        } as any,
                      });

                    if (error) {
                      (global as any).phantomSigningRequest.reject(
                        new Error(error.message)
                      );
                    } else {
                      // Update Supabase user state with the authenticated user
                      setSupabaseUser(authData.user);
                      (global as any).phantomSigningRequest.resolve(true);
                    }
                  } else {
                    (global as any).phantomSigningRequest.reject(
                      new Error('Public key mismatch')
                    );
                  }
                } else {
                  (global as any).phantomSigningRequest.reject(
                    new Error('Invalid signing response')
                  );
                }
                delete (global as any).phantomSigningRequest;
                return;
              }

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
          if ((global as any).phantomSigningRequest) {
            (global as any).phantomSigningRequest.reject(error as Error);
            delete (global as any).phantomSigningRequest;
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
    supabaseUser,
    supabaseLoading,
    supabaseError,
    connect,
    disconnect,
    setShowWalletModal,
    handleWalletConnect,
    refreshBalance,
    signInWithSupabase,
    signOut,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
