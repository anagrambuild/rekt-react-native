import { createContext, ReactNode, useContext, useMemo } from "react";

import { clusterApiUrl, Connection } from "@solana/web3.js";

import Constants from "expo-constants";

interface SolanaContextState {
  connection: Connection;
  cluster: "devnet" | "mainnet-beta";
}

const SolanaContext = createContext<SolanaContextState | null>(null);

export const useSolana = () => {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error("useSolana must be used within a SolanaProvider");
  }
  return context;
};

interface SolanaProviderProps {
  children: ReactNode;
}

export const SolanaProvider = ({ children }: SolanaProviderProps) => {
  const solanaNetwork =
    Constants.expoConfig?.extra?.solanaNetwork || "solana:devnet";
  const cluster = solanaNetwork.includes("mainnet") ? "mainnet-beta" : "devnet";

  const connection = useMemo(() => {
    // Use the appropriate RPC endpoint based on environment
    if (__DEV__) {
      // For development, you might want to use a custom RPC or the default
      return new Connection(clusterApiUrl(cluster), "confirmed");
    } else {
      // For production, consider using a dedicated RPC provider like Helius, QuickNode, etc.
      return new Connection(clusterApiUrl(cluster), "confirmed");
    }
  }, [cluster]);

  const value: SolanaContextState = {
    connection,
    cluster,
  };

  return (
    <SolanaContext.Provider value={value}>{children}</SolanaContext.Provider>
  );
};
