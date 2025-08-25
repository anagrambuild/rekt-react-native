import { Linking } from "react-native";

import {
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

import bs58 from "bs58";
import * as nacl from "tweetnacl";

// USDC mint address on mainnet
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export interface TransferState {
  status: "idle" | "pending" | "success" | "failed" | "needs_connection";
  signature?: string;
  error?: string;
  explorerUrl?: string;
  amount?: number;
}

export interface TransferResult {
  success: boolean;
  signature?: string;
  error?: string;
  explorerUrl?: string;
}

export class TransferService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Generate explorer URL for a transaction signature
   */
  private getExplorerUrl(signature: string): string {
    return `https://explorer.solana.com/tx/${signature}`;
  }

  /**
   * Create a USDC transfer transaction
   */
  private async createUSDCTransferTransaction(
    fromWallet: PublicKey,
    toWallet: PublicKey,
    amount: number
  ): Promise<Transaction> {
    // Convert amount to USDC units (6 decimals)
    const usdcAmount = Math.floor(amount * 1_000_000);

    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      fromWallet
    );
    const toTokenAccount = await getAssociatedTokenAddress(USDC_MINT, toWallet);

    const transaction = new Transaction();

    // Check if destination token account exists
    try {
      await getAccount(this.connection, toTokenAccount);
    } catch (error) {
      if (
        error instanceof TokenAccountNotFoundError ||
        error instanceof TokenInvalidAccountOwnerError
      ) {
        // TODO - test and see if this is needed with a new swig - with new swig changes then we whould not need to create the ATA
        // Create associated token account for destination
        // TODO: Fix TypeScript issue with createAssociatedTokenAccountInstruction
        // const createATAInstruction = createAssociatedTokenAccountInstruction(
        //   fromWallet, toTokenAccount, toWallet, USDC_MINT
        // );
        // transaction.add(createATAInstruction);
      } else {
        throw error;
      }
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount, // source
        toTokenAccount, // destination
        fromWallet, // owner
        usdcAmount // amount
      )
    );

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromWallet;

    return transaction;
  }

  /**
   * Transfer USDC on iOS using Phantom wallet (with existing connection)
   */
  async transferUSDCiOS(
    amount: number,
    toAddress: string,
    fromWallet: PublicKey,
    sharedSecret: Uint8Array,
    session: string,
    dappKeyPair: nacl.BoxKeyPair
  ): Promise<TransferResult> {
    try {
      const toWallet = new PublicKey(toAddress);
      const transaction = await this.createUSDCTransferTransaction(
        fromWallet,
        toWallet,
        amount
      );

      // Serialize transaction (matching working implementation)
      const serializedTransaction = bs58.encode(
        transaction.serialize({
          requireAllSignatures: false,
        })
      );

      // Create sign transaction request
      const payload = {
        transaction: serializedTransaction,
        session: session,
      };

      const nonce = nacl.randomBytes(24);
      const encryptedPayload = nacl.box.after(
        global.Buffer.from(JSON.stringify(payload), "utf8"),
        nonce,
        sharedSecret
      );

      const url = `https://phantom.app/ul/v1/signTransaction?dapp_encryption_public_key=${bs58.encode(
        dappKeyPair.publicKey
      )}&nonce=${bs58.encode(nonce)}&payload=${bs58.encode(
        encryptedPayload
      )}&redirect_link=${encodeURIComponent("rektreactnative://")}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return { success: true };
      } else {
        throw new Error("Cannot open Phantom wallet");
      }
    } catch (error) {
      console.error("❌ iOS USDC transfer failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Transfer USDC on Android using Mobile Wallet Adapter
   */
  async transferUSDCAndroid(
    amount: number,
    toAddress: string,
    fromWallet: PublicKey,
    transact: any,
    cluster: "devnet" | "mainnet-beta" = "mainnet-beta"
  ): Promise<TransferResult> {
    try {
      // Step 1: Authorize wallet (separate transact call)
      const authResult = await transact(async (wallet: any) => {
        const result = await wallet.authorize({
          cluster: cluster,
          identity: {
            name: "Rekt",
            uri: "https://rekt.app",
            icon: "favicon.ico",
          },
        });
        return result;
      });

      // Get the authorized public key
      const addressBytes = global.Buffer.from(
        authResult.accounts[0].address,
        "base64"
      );
      const authorizedPubkey = new PublicKey(addressBytes);

      // Create the transaction with the real authorized public key
      const toWallet = new PublicKey(toAddress);
      const realTransaction = await this.createUSDCTransferTransaction(
        authorizedPubkey, // Use the real authorized key
        toWallet,
        amount
      );

      // Step 2: Sign transaction (separate transact call with auth_token)
      const signResult = await transact(async (wallet: any) => {
        // Re-authorize with the cached token
        await wallet.authorize({
          cluster: cluster,
          identity: {
            name: "Rekt",
            uri: "https://rekt.app",
            icon: "favicon.ico",
          },
          auth_token: authResult.auth_token, // Use cached token
        });

        const signedTransactions = await wallet.signTransactions({
          transactions: [realTransaction],
        });

        return signedTransactions[0];
      });

      // Step 3: Send transaction manually using connection
      const serializedTx = signResult.serialize();
      const signature = await this.connection.sendRawTransaction(serializedTx, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      const result = { signature };

      if (result.signature) {
        return {
          success: true,
          signature: result.signature,
          explorerUrl: this.getExplorerUrl(result.signature),
        };
      } else {
        throw new Error("No transaction signature returned");
      }
    } catch (error) {
      console.error("❌ Android USDC transfer failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Monitor transaction confirmation status
   */
  async monitorTransaction(
    signature: string,
    blockhash: string,
    lastValidBlockHeight: number
  ): Promise<boolean> {
    try {
      // Wait for confirmation with timeout
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        console.error("❌ Transaction failed:", confirmation.value.err);
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Transaction monitoring failed:", error);
      return false;
    }
  }

  /**
   * Get transaction details for display
   */
  async getTransactionDetails(signature: string) {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      return {
        signature,
        slot: transaction?.slot,
        blockTime: transaction?.blockTime,
        fee: transaction?.meta?.fee,
        status: transaction?.meta?.err ? "failed" : "success",
      };
    } catch (error) {
      console.error("Failed to get transaction details:", error);
      return null;
    }
  }
}

/**
 * Create a transfer service instance
 */
export const createTransferService = (
  connection: Connection
): TransferService => {
  return new TransferService(connection);
};
