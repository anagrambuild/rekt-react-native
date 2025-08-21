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

import { getSwigWalletBalance } from "@/utils/backendApi";

import { PublicKey } from "@solana/web3.js";

import { Buffer } from "buffer";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import * as nacl from "tweetnacl";

// Persistent wallet state outside React lifecycle
let persistentWalletState = {
  connected: false,
  publicKey: null as PublicKey | null,
  sharedSecret: null as Uint8Array | null,
  session: null as string | null,
};

// Use require for bs58 to avoid PRNG issues
const bs58 = require("bs58");

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

  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  setShowWalletModal: (show: boolean) => void;
  refreshUSDCBalance: () => Promise<void>;
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

  connect: async () => {},
  disconnect: () => {},
  setShowWalletModal: () => {},
  refreshUSDCBalance: async () => {},
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

  // USDC Balance state
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

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
        const addressBytes = Buffer.from(base64Address, "base64");
        const pubKey = new PublicKey(addressBytes);

        // Update persistent state first
        persistentWalletState.connected = true;
        persistentWalletState.publicKey = pubKey;

        if (mountedRef.current) {
          setPublicKey(pubKey);
          setConnected(true);

          // Wallet connected successfully - no auth needed
          const publicKeyString = pubKey.toBase58();
          console.log("✅ Android wallet connected:", publicKeyString);
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
      console.log("🔗 Android URL received:", url);
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
      console.log("🔗 iOS URL received:", url);

      // Handle wallet connection response from Phantom
      if (
        url.includes("rektreactnative://") &&
        url.includes("phantom_encryption_public_key")
      ) {
        try {
          console.log("🔐 Processing wallet connection response from Phantom");

          const urlObj = new URL(url);
          const phantomPublicKey = urlObj.searchParams.get(
            "phantom_encryption_public_key"
          );
          const data = urlObj.searchParams.get("data");
          const nonce = urlObj.searchParams.get("nonce");

          if (phantomPublicKey && data && nonce) {
            console.log("📡 Decrypting wallet connection response...");

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
                Buffer.from(decryptedData).toString("utf8")
              );
              console.log("🔓 Decrypted wallet data:", connectData);

              if (connectData.public_key && connectData.session) {
                console.log("🔗 Processing wallet connection...");

                // Set wallet state
                setSharedSecret(sharedSecretDapp);
                setSession(connectData.session);
                const pubKey = new PublicKey(connectData.public_key);
                setPublicKey(pubKey);
                setConnected(true);
                setConnecting(false);

                // Wallet connected successfully - no auth needed
                const publicKeyString = connectData.public_key;
                console.log("✅ iOS wallet connected:", publicKeyString);
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

      // Handle error responses
      if (url.includes("errorCode")) {
        try {
          const urlObj = new URL(url);
          const errorCode = urlObj.searchParams.get("errorCode");
          const errorMessage = urlObj.searchParams.get("errorMessage");
          console.error("iOS Phantom error:", errorCode, errorMessage);

          Alert.alert(
            t("Connection Failed"),
            errorMessage || t("Unknown wallet error")
          );
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
  }, [getDappKeyPair, t]);

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
      } else if (Platform.OS === "ios") {
        // For iOS, show the wallet selection modal or handle as needed
        setShowWalletModal(true);
        setConnecting(false); // Reset connecting state, modal will handle it
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
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

  // Refresh USDC balance from Swig wallet
  const refreshUSDCBalance = useCallback(async () => {
    if (!publicKey) return;

    try {
      setIsLoadingBalance(true);
      // Get the user profile to get the swig wallet address
      // This would typically come from your user context or API
      // For now, we'll use a placeholder - you may need to adjust this
      const swigWalletAddress = publicKey.toBase58(); // Placeholder

      const balanceResult = await getSwigWalletBalance(swigWalletAddress);

      if (balanceResult.status === "success") {
        setUsdcBalance(balanceResult.balance);
      } else {
        console.warn("Failed to get USDC balance:", balanceResult.error);
        setUsdcBalance(0);
      }
    } catch (error) {
      console.error("Error refreshing USDC balance:", error);
      setUsdcBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [publicKey]);

  // Refresh USDC balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      refreshUSDCBalance();
    } else if (!connected) {
      setUsdcBalance(null);
      setIsLoadingBalance(false);
    }
  }, [connected, publicKey, refreshUSDCBalance]);

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
    connect,
    disconnect,
    setShowWalletModal,
    refreshUSDCBalance,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
