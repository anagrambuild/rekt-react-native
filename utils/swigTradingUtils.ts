import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { fetchSwig, getSignInstructions } from '@swig-wallet/classic';

import { getSecureAuth } from './secureAuth';

export interface SwigSigningResult {
  success: boolean;
  signedTransaction?: string; // base64 encoded
  error?: string;
}

export interface SwigTransactionData {
  serializedTransaction: string; // base64 encoded transaction from backend
  description: string;
}

/**
 * Signs a transaction using Swig wallet
 * This function takes a serialized transaction from the backend and signs it with the user's Swig wallet
 */
export const signTransactionWithSwig = async (
  connection: Connection,
  transactionData: SwigTransactionData,
  userPublicKey: PublicKey
): Promise<SwigSigningResult> => {
  try {
    console.log('🔐 Starting Swig transaction signing...');
    console.log('Transaction description:', transactionData.description);

    // Get user's Swig wallet address from secure storage
    const authResult = await getSecureAuth();
    if (!authResult.isValid || !authResult.data?.swigAddress) {
      return {
        success: false,
        error: 'No Swig wallet address found in secure storage',
      };
    }

    const swigAddress = new PublicKey(authResult.data.swigAddress);
    console.log('Using Swig address:', swigAddress.toBase58());

    // Fetch the Swig account to get role information
    console.log('📡 Fetching Swig account data...');
    const swig = await fetchSwig(connection, swigAddress);

    // Find the role for the user's public key
    const userRole = swig.findRolesByEd25519SignerPk(userPublicKey)[0];
    if (!userRole) {
      return {
        success: false,
        error: 'No role found for user public key in Swig account',
      };
    }

    console.log('✓ Found user role:', userRole.id);

    // Deserialize the transaction from the backend
    const transactionBuffer = Buffer.from(
      transactionData.serializedTransaction,
      'base64'
    );
    const transaction = Transaction.from(transactionBuffer);

    console.log(
      '📝 Transaction instructions count:',
      transaction.instructions.length
    );

    // Use Swig to sign the transaction instructions
    console.log('🔏 Signing transaction with Swig...');
    const signedInstructions = await getSignInstructions(
      swig,
      userRole.id,
      transaction.instructions
    );

    // Create a new transaction with the signed instructions
    const signedTransaction = new Transaction();
    signedTransaction.add(...signedInstructions);

    // Copy over the transaction metadata
    signedTransaction.recentBlockhash = transaction.recentBlockhash;
    signedTransaction.feePayer = transaction.feePayer;

    // Serialize the signed transaction
    const signedTransactionBuffer = signedTransaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const signedTransactionBase64 = signedTransactionBuffer.toString('base64');

    console.log('✅ Transaction signed successfully with Swig');

    return {
      success: true,
      signedTransaction: signedTransactionBase64,
    };
  } catch (error) {
    console.error('❌ Error signing transaction with Swig:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown signing error',
    };
  }
};

/**
 * Helper function to check if user has a valid Swig wallet setup
 */
export const validateSwigWalletSetup = async (
  connection: Connection,
  userPublicKey: PublicKey
): Promise<{ isValid: boolean; error?: string; swigAddress?: PublicKey }> => {
  try {
    // Get Swig address from secure storage
    const authResult = await getSecureAuth();
    if (!authResult.isValid || !authResult.data?.swigAddress) {
      return {
        isValid: false,
        error: 'No Swig wallet address found in secure storage',
      };
    }

    const swigAddress = new PublicKey(authResult.data.swigAddress);

    // Check if Swig account exists and user has a role
    const swig = await fetchSwig(connection, swigAddress);
    const userRole = swig.findRolesByEd25519SignerPk(userPublicKey)[0];

    if (!userRole) {
      return {
        isValid: false,
        error: 'User does not have a role in the Swig account',
        swigAddress,
      };
    }

    return {
      isValid: true,
      swigAddress,
    };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
};

/**
 * Helper function to get user's Swig address from secure storage
 */
export const getUserSwigAddress = async (): Promise<PublicKey | null> => {
  try {
    const authResult = await getSecureAuth();
    if (!authResult.isValid || !authResult.data?.swigAddress) {
      return null;
    }
    return new PublicKey(authResult.data.swigAddress);
  } catch (error) {
    console.error('Error getting user Swig address:', error);
    return null;
  }
};
