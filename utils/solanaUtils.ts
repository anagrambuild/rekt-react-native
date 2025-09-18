import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

import { SwigWalletBalanceResponse } from "./backendApi";

console.log("✅ [SOLANA UTILS] SPL Token imports successful");

// USDC Token Mint Address on Solana Mainnet
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// Associated Token Program ID
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

// Manual calculation of associated token address as fallback
const findAssociatedTokenAddress = async (
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<PublicKey> => {
  const [associatedTokenAddress] = PublicKey.findProgramAddressSync(
    [
      walletAddress.toBytes(),
      TOKEN_PROGRAM_ID.toBytes(),
      tokenMintAddress.toBytes(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return associatedTokenAddress;
};

// Solana RPC Configuration
const SOLANA_RPC_ENDPOINTS = {
  mainnet: "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

// Use mainnet by default, can be configured later
const DEFAULT_RPC_ENDPOINT = SOLANA_RPC_ENDPOINTS.mainnet;

// Create connection with retry logic
const createConnection = (
  rpcEndpoint: string = DEFAULT_RPC_ENDPOINT
): Connection => {
  try {
    const connection = new Connection(rpcEndpoint, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 30000,
    });
    return connection;
  } catch (error) {
    throw error;
  }
};

// Format USDC balance (USDC has 6 decimals)
const formatUSDCBalance = (
  rawBalance: bigint
): { balance: number; formatted: string } => {
  const USDC_DECIMALS = 6;
  const balance = Number(rawBalance) / Math.pow(10, USDC_DECIMALS);
  const formatted = `$${balance.toFixed(2)}`;

  return { balance, formatted };
};

// Get USDC balance for a Solana wallet address
export const getUSDCBalanceFromSolana = async (
  walletAddress: string,
  rpcEndpoint?: string
): Promise<SwigWalletBalanceResponse> => {
  // Check if we have the required imports

  try {
    // Validate wallet address
    let walletPublicKey: PublicKey;
    try {
      walletPublicKey = new PublicKey(walletAddress);
    } catch (error) {
      throw new Error(`Invalid wallet address: ${walletAddress}, ${error}`);
    }

    // Create connection
    const connection = createConnection(rpcEndpoint);

    let associatedTokenAddress: PublicKey;
    try {
      // Try using the SPL Token library first
      associatedTokenAddress = await getAssociatedTokenAddress(
        USDC_MINT,
        walletPublicKey,
        true
      );
    } catch (error) {
      // Try fallback method if SPL Token library failed
      try {
        associatedTokenAddress = await findAssociatedTokenAddress(
          walletPublicKey,
          USDC_MINT
        );
      } catch (fallbackError) {
        console.error(
          "❌ [SOLANA API] Fallback method also failed:",
          fallbackError
        );
        throw new Error(
          `Both methods failed. Original: ${error instanceof Error ? error.message : "Unknown error"
          }, Fallback: ${fallbackError instanceof Error
            ? fallbackError.message
            : "Unknown error"
          }`
        );
      }
    }

    try {
      // Get the token account info
      const tokenAccount = await getAccount(connection, associatedTokenAddress);

      // Format the balance
      const { balance, formatted } = formatUSDCBalance(tokenAccount.amount);
      const result = {
        balance,
        formatted,
        source: "solana_rpc",
        status: "success",
        tokenAccount: associatedTokenAddress.toString(),
      };

      return result;
    } catch (accountError: any) {
      // Token account doesn't exist (wallet has no USDC)
      if (
        accountError.name === "TokenAccountNotFoundError" ||
        accountError.message?.includes("could not find account")
      ) {
        const result = {
          balance: 0,
          formatted: "$0.00",
          source: "solana_rpc",
          status: "success",
          tokenAccount: associatedTokenAddress.toString(),
        };

        return result;
      }

      // Re-throw other account-related errors

      throw accountError;
    }
  } catch (error: any) {
    // Return error response in expected format
    const errorResult = {
      balance: 0,
      formatted: "$0.00",
      source: "solana_rpc",
      status: "error",
      error: error.message || "Failed to fetch USDC balance from Solana RPC",
    };

    return errorResult;
  }
};

// Get multiple token balances (extensible for future use)
export const getTokenBalances = async (
  walletAddress: string,
  tokenMints: PublicKey[],
  rpcEndpoint?: string
): Promise<Record<string, SwigWalletBalanceResponse>> => {
  const connection = createConnection(rpcEndpoint);
  const walletPublicKey = new PublicKey(walletAddress);
  const results: Record<string, SwigWalletBalanceResponse> = {};

  for (const mint of tokenMints) {
    try {
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mint,
        walletPublicKey
      );
      const tokenAccount = await getAccount(connection, associatedTokenAddress);

      // For now, assume all tokens have 6 decimals (can be made configurable)
      const { balance, formatted } = formatUSDCBalance(tokenAccount.amount);

      results[mint.toString()] = {
        balance,
        formatted,
        source: "solana_rpc",
        status: "success",
        tokenAccount: associatedTokenAddress.toString(),
      };
    } catch (error: any) {
      results[mint.toString()] = {
        balance: 0,
        formatted: "$0.00",
        source: "solana_rpc",
        status: "error",
        error: error.message,
      };
    }
  }

  return results;
};

// Utility to check if a wallet address is valid
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Utility to get Solana network info
export const getSolanaNetworkInfo = async (rpcEndpoint?: string) => {
  try {
    const connection = createConnection(rpcEndpoint);
    const version = await connection.getVersion();
    const slot = await connection.getSlot();

    return {
      version: version["solana-core"],
      slot,
      rpcEndpoint: rpcEndpoint || DEFAULT_RPC_ENDPOINT,
    };
  } catch (error) {
    console.error("Failed to get Solana network info:", error);
    return null;
  }
};
