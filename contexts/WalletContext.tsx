/* eslint-disable @typescript-eslint/no-require-imports */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, Linking, Platform } from "react-native";

import { queryClient } from "@/utils/queryClient";
import { useSwigWalletBalanceQuery } from "@/utils/queryUtils";
import { createTransferService, TransferState } from "@/utils/transferService";

import { PublicKey, Transaction } from "@solana/web3.js";

import { useSolana } from "./SolanaContext";
import bs58 from "bs58";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import * as nacl from "tweetnacl";
// Persistent wallet state outside React lifecycle
export let persistentWalletState = {
  connected: false,
  publicKey: null as PublicKey | null,
  sharedSecret: null as Uint8Array | null,
  session: null as string | null,
};

// Only import wallet adapter for Android
const isAndroid = Platform.OS === "android";
let transact: any = null;

if (isAndroid) {
  try {
    const protocol = require("@solana-mobile/mobile-wallet-adapter-protocol-web3js");
    transact = protocol.transact;
  } catch (error) {
    console.error("Failed to import mobile wallet adapter:", error);
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

  // USDC Balance
  usdcBalance: number | null;
  isLoadingBalance: boolean;

  // Transfer State
  transferState: TransferState;

  // Methods
  connect: (onSuccess?: () => void) => Promise<void>;
  connectForTransfer: () => Promise<void>; // New method for transfer-only connection
  disconnect: () => void;
  setShowWalletModal: (show: boolean) => void;
  setConnectionSuccessCallback: (callback: (() => void) | null) => void;
  refreshUSDCBalance: () => Promise<void>;
  initiateTransfer: (amount: number, toAddress: string) => Promise<void>;
  resetTransfer: () => void;
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
  transferState: { status: "idle" },

  connect: async () => {},
  connectForTransfer: async () => {},
  disconnect: () => {},
  setShowWalletModal: () => {},
  setConnectionSuccessCallback: () => {},
  refreshUSDCBalance: async () => {},
  initiateTransfer: async () => {},
  resetTransfer: () => {},
});

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
  setIsLoggedIn: (value: boolean) => void;
  setUserProfile: (profile: any) => void;
  setRequiresBiometric: (value: boolean) => void;
  isLoggedIn: boolean;
  userProfile: any | null;
}

export const WalletProvider = ({
  children,
  setIsLoggedIn,
  setUserProfile,
  setRequiresBiometric,
  isLoggedIn,
  userProfile,
}: WalletProviderProps) => {
  const { t } = useTranslation();
  const { connection, cluster } = useSolana();

  // Initialize from persistent state
  const [connected, setConnected] = useState(persistentWalletState.connected);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(
    persistentWalletState.publicKey
  );

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  const onSuccessCallbackRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // USDC Balance state
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  // Transfer state
  const [transferState, setTransferState] = useState<TransferState>({
    status: "idle",
  });

  // Generate encryption keypair for Phantom communication - initialize once
  const [dappKeyPair] = useState<nacl.BoxKeyPair>(() => {
    try {
      return nacl.box.keyPair();
    } catch (error) {
      console.error("Failed to generate keypair:", error);
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

  const solanaNetwork =
    Constants.expoConfig?.extra?.solanaNetwork || "solana:devnet";

  const connectAndroid = useCallback(async () => {
    if (!isAndroid || !transact) {
      return false;
    }

    try {
      const cluster = solanaNetwork.includes("mainnet")
        ? "mainnet-beta"
        : "devnet";
      const result = await transact(async (wallet: any) => {
        const authResult = await wallet.authorize({
          cluster: cluster,
          identity: {
            name: "Rekt",
            uri: "https://rekt.app",
            icon: "favicon.ico",
          },
        });
        return authResult;
      });

      if (result.accounts.length > 0) {
        // Convert base64 address to PublicKey
        const base64Address = result.accounts[0].address;
        const addressBytes = global.Buffer.from(base64Address, "base64");
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
      console.error("Android wallet connection failed:", error);
      Alert.alert(t("Connection Failed"), t("Failed to connect to wallet"));
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAndroid, transact, solanaNetwork]);
  // Handle incoming URL schemes (wallet responses)
  // Android URL Handler (for MWA - keep it simple)
  useEffect(() => {
    if (!isAndroid) return;

    const handleAndroidUrl = (url: string) => {
      // Android MWA doesn't use URL schemes for transaction responses
      // MWA handles everything internally, so we just handle errors here
      if (url.includes("errorCode")) {
        try {
          const urlObj = new URL(url);
          const errorCode = urlObj.searchParams.get("errorCode");
          const errorMessage = urlObj.searchParams.get("errorMessage");
          console.error("Android MWA error:", errorCode, errorMessage);
          Alert.alert(
            t("Connection Failed"),
            errorMessage || t("Unknown wallet error")
          );
        } catch (error) {
          console.error("Failed to parse Android error response:", error);
        }
      }
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleAndroidUrl(url);
      }
    });

    // Listen for URL changes while app is running
    const subscription = Linking.addEventListener("url", event => {
      handleAndroidUrl(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, [t]);

  // iOS URL Handler (for Phantom deep links) - Also handle Phantom on Android
  useEffect(() => {
    if (isAndroid) return; // Only run on iOS

    const handleiOSUrl = async (url: string) => {
      // Get the current scheme dynamically
      const currentScheme = Constants.expoConfig?.scheme;

      // Handle wallet connection response from Phantom
      if (
        url.includes(`${currentScheme}://`) &&
        url.includes("phantom_encryption_public_key")
      ) {
        try {
          const urlObj = new URL(url);
          const phantomPublicKey = urlObj.searchParams.get(
            "phantom_encryption_public_key"
          );
          const data = urlObj.searchParams.get("data");
          const nonce = urlObj.searchParams.get("nonce");

          if (phantomPublicKey && data && nonce) {
            // Create shared secret and decrypt response
            const keyPair = getDappKeyPair();
            const sharedSecretDapp = nacl.box.before(
              bs58.decode(phantomPublicKey),
              keyPair.secretKey
            );

            const decryptedData = nacl.box.open.after(
              bs58.decode(data),
              bs58.decode(nonce),
              sharedSecretDapp
            );

            if (decryptedData) {
              const connectData = JSON.parse(
                global.Buffer.from(decryptedData).toString("utf8")
              );

              if (connectData.public_key && connectData.session) {
                // Set wallet state
                setSharedSecret(sharedSecretDapp);
                setSession(connectData.session);
                const pubKey = new PublicKey(connectData.public_key);
                setPublicKey(pubKey);
                setConnected(true);
                setConnecting(false);
                // Wallet connected successfully - call success callback
                onSuccessCallbackRef.current?.();
                onSuccessCallbackRef.current = null; // Clear the callback
              }
            }
          }
        } catch (error) {
          console.error(
            "❌ Failed to process wallet connection response:",
            error
          );
          Alert.alert(
            t("Connection Failed"),
            "Failed to process wallet response"
          );
        }
        return;
      }

      // Handle transaction signing response from Phantom
      if (
        url.includes(`${currentScheme}://`) &&
        url.includes("data") &&
        !url.includes("phantom_encryption_public_key") // Not a connection response
      ) {
        try {
          const urlObj = new URL(url);
          const data = urlObj.searchParams.get("data");
          const nonce = urlObj.searchParams.get("nonce");

          if (data && nonce && sharedSecret) {
            // Decrypt the response using existing shared secret
            const decryptedData = nacl.box.open.after(
              bs58.decode(data),
              bs58.decode(nonce),
              sharedSecret
            );

            if (decryptedData) {
              const responseData = JSON.parse(
                global.Buffer.from(decryptedData).toString("utf8")
              );

              if (responseData.signature) {
                // Update transfer state with success
                setTransferState({
                  status: "success",
                  signature: responseData.signature,
                  explorerUrl: `https://explorer.solana.com/tx/${responseData.signature}?cluster=mainnet-beta`,
                  amount: transferState.amount || 0,
                });

                // Invalidate swig wallet balance to trigger refetch after successful deposit
                if (swigWalletAddress) {
                  queryClient.invalidateQueries({
                    queryKey: ["swigWallet", "balance", swigWalletAddress],
                  });
                  // Also manually trigger refetch as backup after blockchain finalization
                  setTimeout(() => {
                    refreshUSDCBalance();
                  }, 6000);
                } else {
                  console.warn(
                    "⚠️ [WALLET CONTEXT] Cannot invalidate - no swig wallet address. userProfile:",
                    userProfile,
                    "swigWalletAddress:",
                    swigWalletAddress
                  );
                }

                // Navigate back to profile tab after successful transfer
                router.push("/(tabs)/profile");
              } else if (responseData.transaction) {
                try {
                  // Deserialize the signed transaction
                  const signedTransaction = Transaction.from(
                    bs58.decode(responseData.transaction)
                  );

                  // Send the signed transaction to the network
                  const signature = await connection.sendRawTransaction(
                    signedTransaction.serialize()
                  );

                  // Wait for confirmation
                  const confirmation = await connection.confirmTransaction(
                    {
                      signature,
                      blockhash: signedTransaction.recentBlockhash!,
                      lastValidBlockHeight: (
                        await connection.getLatestBlockhash()
                      ).lastValidBlockHeight,
                    },
                    "confirmed"
                  );

                  if (confirmation.value.err) {
                    throw new Error(
                      `Transaction failed: ${confirmation.value.err}`
                    );
                  }

                  // Update transfer state with success
                  setTransferState({
                    status: "success",
                    signature: signature,
                    explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`,
                    amount: transferState.amount || 0,
                  });

                  // Invalidate swig wallet balance to trigger refetch after successful deposit
                  if (swigWalletAddress) {
                    console.log(
                      "🔄 [WALLET CONTEXT] Invalidating swig wallet balance query for:",
                      swigWalletAddress
                    );
                    queryClient.invalidateQueries({
                      queryKey: ["swigWallet", "balance", swigWalletAddress],
                    });
                    // Also manually trigger refetch as backup after blockchain finalization
                    setTimeout(() => {
                      refreshUSDCBalance();
                    }, 6000);
                  } else {
                    console.warn(
                      "⚠️ [WALLET CONTEXT] Cannot invalidate - no swig wallet address. userProfile:",
                      userProfile,
                      "swigWalletAddress:",
                      swigWalletAddress
                    );
                  }

                  // Navigate back to profile tab after successful transfer
                  router.push("/(tabs)/profile");
                } catch (txError) {
                  console.error(
                    "❌ Failed to process signed transaction:",
                    txError
                  );
                  throw new Error(
                    `Failed to send transaction: ${
                      txError instanceof Error
                        ? txError.message
                        : "Unknown error"
                    }`
                  );
                }
              } else {
                throw new Error("No signature or transaction in response");
              }
            } else {
              throw new Error("Failed to decrypt transaction response");
            }
          } else {
            throw new Error(
              "Missing transaction response data or shared secret"
            );
          }
        } catch (error) {
          console.error("❌ Failed to process transaction response:", error);
          setTransferState({
            status: "failed",
            error:
              error instanceof Error ? error.message : "Transaction failed",
            amount: transferState.amount || 0,
          });
        }
        return;
      }

      // Handle error responses
      if (url.includes("errorCode")) {
        try {
          const urlObj = new URL(url);
          const errorCode = urlObj.searchParams.get("errorCode");
          const errorMessage = urlObj.searchParams.get("errorMessage");
          console.error("iOS Phantom error:", errorCode, errorMessage);

          // Check if this is a transaction error (user rejection, etc.)
          if (
            transferState.status === "pending" ||
            transferState.status === "success"
          ) {
            // This is a transaction error, update transfer state (even if it was briefly set to success)
            const userFriendlyMessage =
              errorCode === "4001"
                ? t("Transaction was cancelled by user")
                : errorMessage || t("Transaction failed");

            setTransferState({
              status: "failed",
              error: userFriendlyMessage,
              amount: transferState.amount || 0,
            });
          } else {
            // This is a connection error, show alert
            Alert.alert(
              t("Connection Failed"),
              errorMessage || t("Unknown wallet error")
            );
          }
        } catch (error) {
          console.error("Failed to parse iOS error response:", error);
        }
        return;
      }
    };

    // Handle initial URL and listen for changes
    Linking.getInitialURL().then(url => {
      if (url) handleiOSUrl(url);
    });

    const subscription = Linking.addEventListener("url", event => {
      handleiOSUrl(event.url);
    });

    return () => subscription?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDappKeyPair, sharedSecret, transferState, connection]);

  const connect = useCallback(
    async (onSuccess?: () => void) => {
      if (connecting || connected) {
        return;
      }

      // Store the callback for iOS deep link response
      onSuccessCallbackRef.current = onSuccess || null;

      setConnecting(true);

      try {
        if (isAndroid) {
          const success = await connectAndroid();
          if (!success) {
            setConnecting(false);
          } else {
            setConnecting(false);
            // Call success callback for Android
            onSuccess?.();
          }
        } else if (Platform.OS === "ios") {
          // For iOS, show the wallet selection modal or handle as needed
          setShowWalletModal(true);
          setConnecting(false); // Reset connecting state, modal will handle it
        }
      } catch (error) {
        console.error("Wallet connection error:", error);
        setConnecting(false);
      }
    },
    [connecting, connected, connectAndroid]
  );

  // Transfer-only connection that doesn't trigger authentication flows
  const connectForTransfer = useCallback(async () => {
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
      } else if (Platform.OS === "ios") {
        // For iOS, show the wallet selection modal
        setShowWalletModal(true);
        setConnecting(false);
      }
    } catch (error) {
      console.error("Transfer wallet connection error:", error);
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

  // Get swig wallet address from user profile (not connected wallet)
  const swigWalletAddress = userProfile?.swigWalletAddress || "";
  const isQueryEnabled = !!isLoggedIn && swigWalletAddress.length > 0;

  // Use React Query to fetch USDC balance
  const {
    data: balanceData,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useSwigWalletBalanceQuery(swigWalletAddress, {
    enabled: isQueryEnabled,
  });

  // Create a wrapper function for refreshUSDCBalance to match the expected interface
  const refreshUSDCBalance = useCallback(async () => {
    if (refetchBalance) {
      await refetchBalance();
    }
  }, [refetchBalance]);

  // Update local state when balance data changes
  useEffect(() => {
    if (balanceData) {
      if (balanceData.status === "success") {
        setUsdcBalance(balanceData.balance);
      } else {
        setUsdcBalance(0);
      }
    } else if (!isLoggedIn || !swigWalletAddress) {
      setUsdcBalance(null);
    }
  }, [balanceData, swigWalletAddress, isLoggedIn]);

  // Reset balance when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setUsdcBalance(null);
    }
  }, [connected]);

  // Transfer methods - assumes wallet is already connected
  const initiateTransfer = useCallback(
    async (amount: number, toAddress: string) => {
      try {
        setTransferState({
          status: "pending",
          amount,
        });

        const transferService = createTransferService(connection);

        let result;
        if (Platform.OS === "android") {
          // Android MWA transfer
          const protocol = require("@solana-mobile/mobile-wallet-adapter-protocol-web3js");
          const transact = protocol.transact;

          if (publicKey) {
            // We have a connected wallet from main app - use it
            result = await transferService.transferUSDCAndroid(
              amount,
              toAddress,
              publicKey,
              transact,
              cluster
            );
          } else {
            // Transfer-only flow - we'll get the publicKey during authorization
            const placeholderKey = new PublicKey(
              "11111111111111111111111111111111"
            );
            result = await transferService.transferUSDCAndroid(
              amount,
              toAddress,
              placeholderKey,
              transact,
              cluster
            );
          }
        } else {
          // iOS Phantom transfer
          if (connected && publicKey && sharedSecret && session) {
            // Use existing connection (must be fully connected)
            result = await transferService.transferUSDCiOS(
              amount,
              toAddress,
              publicKey,
              sharedSecret,
              session,
              getDappKeyPair()
            );
          } else {
            setTransferState({
              status: "needs_connection",
              amount,
            });
            return;
          }
        }
        if (result.success) {
          setTransferState({
            status: "success",
            signature: result.signature,
            explorerUrl: result.explorerUrl,
            amount,
          });

          // Invalidate swig wallet balance to trigger refetch after successful deposit
          if (swigWalletAddress) {
            queryClient.invalidateQueries({
              queryKey: ["swigWallet", "balance", swigWalletAddress],
            });
            // Also manually trigger refetch as backup after blockchain finalization
            setTimeout(() => {
              refreshUSDCBalance();
            }, 6000);
          } else {
            console.warn(
              "⚠️ [WALLET CONTEXT] Cannot invalidate - no swig wallet address. userProfile:",
              userProfile,
              "swigWalletAddress:",
              swigWalletAddress
            );
          }
        } else {
          throw new Error(result.error || "Transfer failed");
        }
      } catch (error) {
        console.error("Transfer failed:", error);
        setTransferState({
          status: "failed",
          error: error instanceof Error ? error.message : "Transfer failed",
          amount,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      connected,
      publicKey,
      connection,
      cluster,
      sharedSecret,
      session,
      getDappKeyPair,
    ]
  );

  const resetTransfer = useCallback(() => {
    setTransferState({ status: "idle" });
  }, []);

  const setConnectionSuccessCallback = useCallback(
    (callback: (() => void) | null) => {
      onSuccessCallbackRef.current = callback;
    },
    []
  );

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
    transferState,
    connect,
    connectForTransfer,
    disconnect,
    setShowWalletModal,
    refreshUSDCBalance,
    initiateTransfer,
    resetTransfer,
    setConnectionSuccessCallback,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
