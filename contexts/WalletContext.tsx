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

import { Buffer } from 'buffer';
import Constants from 'expo-constants';
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
  connect: () => Promise<void>;
  disconnect: () => void;
  setShowWalletModal: (show: boolean) => void;
  handleWalletConnect: (publicKey: string) => void;
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
  connect: async () => {},
  disconnect: () => {},
  setShowWalletModal: () => {},
  handleWalletConnect: () => {},
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

  // Get Solana network from Expo config
  const solanaNetwork =
    Constants.expoConfig?.extra?.solanaNetwork || 'solana:devnet';

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
  }, [isAndroid, transact, solanaNetwork, t]);

  const handleWalletConnect = useCallback(
    (publicKeyString: string) => {
      try {
        const pubKey = new PublicKey(publicKeyString);
        setPublicKey(pubKey);
        setConnected(true);
        setConnecting(false);
      } catch (error) {
        console.error('Invalid public key:', error);
        Alert.alert(t('Connection Failed'), t('Invalid wallet address'));
        setConnecting(false);
      }
    },
    [t]
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

    const handleiOSUrl = (url: string) => {
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
                handleWalletConnect(connectData.public_key);
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
        handleiOSUrl(url);
      }
    });

    // Listen for URL changes while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleiOSUrl(event.url);
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
  }, []);

  const value: WalletContextState = {
    connected,
    connecting,
    publicKey,
    showWalletModal,
    getDappKeyPair,
    sharedSecret,
    session,
    connect,
    disconnect,
    setShowWalletModal,
    handleWalletConnect,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
