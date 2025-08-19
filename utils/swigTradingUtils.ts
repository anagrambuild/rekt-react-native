import { Connection, PublicKey } from '@solana/web3.js';

export interface SwigSigningResult {
  success: boolean;
  signedTransaction?: any;
  error?: string;
}

export interface SwigTransactionData {
  serializedTransaction: string; // base64 encoded transaction from backend
  description: string;
}

export interface SwigValidationResult {
  isValid: boolean;
  error?: string;
  swigAddress?: PublicKey;
}

/**
 * Signs a transaction using the user's Swig wallet
 */
export const signTransactionWithSwig = async (
  connection: Connection,
  transactionData: any,
  userPublicKey: PublicKey
): Promise<SwigSigningResult> => {
  try {
    console.log('🔐 Starting Swig transaction signing...');
    console.log('Transaction description:', transactionData.description);

    // Get user's Swig wallet address from user profile
    // Note: This should come from the userProfile prop, not Supabase metadata
    // For now, we'll need to pass it in or get it from the profile context
    throw new Error(
      'Swig wallet address must be provided from user profile - not implemented yet'
    );

    // TODO: Implement proper Swig signing logic
    // const swigAddress = new PublicKey(userProfile.swigWalletAddress);
    // console.log('Using Swig address:', swigAddress.toBase58());

    // Fetch the Swig account to get role information
    // console.log('📡 Fetching Swig account data...');
    // const swig = await fetchSwig(connection, swigAddress);

    // Find the role for the user's public key
    // const userRole = swig.findRolesByEd25519SignerPk(userPublicKey)[0];
    // if (!userRole) {
    //   return {
    //     success: false,
    //     error: 'No role found for user public key in Swig account',
    //   };
    // }

    // console.log('✓ Found user role:', userRole.id);

    // Deserialize the transaction from the backend
    // const transactionBuffer = Buffer.from(
    //   transactionData.serializedTransaction,
    //   'base64'
    // );
    // const transaction = Transaction.from(transactionBuffer);

    // console.log(
    //   '📝 Transaction instructions count:',
    //   transaction.instructions.length
    // );

    // Use Swig to sign the transaction instructions
    // console.log('🔏 Signing transaction with Swig...');
    // const signedInstructions = await getSignInstructions(
    //   swig,
    //   userRole.id,
    //   transaction.instructions
    // );

    // Create a new transaction with the signed instructions
    // const signedTransaction = new Transaction();
    // signedTransaction.add(...signedInstructions);

    // Copy over the transaction metadata
    // signedTransaction.recentBlockhash = transaction.recentBlockhash;
    // signedTransaction.feePayer = transaction.feePayer;

    // Serialize the signed transaction
    // const signedTransactionBuffer = signedTransaction.serialize({
    //   requireAllSignatures: false,
    //   verifySignatures: false,
    // });

    // const signedTransactionBase64 = signedTransactionBuffer.toString('base64');

    // console.log('✅ Transaction signed successfully with Swig');

    // return {
    //   success: true,
    //   signedTransaction: signedTransactionBase64,
    // };
  } catch (error) {
    console.error('❌ Swig transaction signing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown signing error',
    };
  }
};

/**
 * Validates that the user's Swig wallet is properly set up
 */
export const validateSwigWalletSetup = async (
  connection: Connection,
  userPublicKey: PublicKey
): Promise<SwigValidationResult> => {
  try {
    // Get Swig address from user profile
    // Note: This should come from the userProfile prop, not Supabase metadata
    throw new Error(
      'Swig wallet address must be provided from user profile - not implemented yet'
    );

    // TODO: Implement proper validation logic
    // const swigAddress = new PublicKey(userProfile.swigWalletAddress);

    // Check if Swig account exists and user has a role
    // ... rest of validation logic
  } catch (error) {
    console.error('❌ Swig wallet validation failed:', error);
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
};

/**
 * Gets the user's Swig wallet address from their profile
 * This should be called with the userProfile object, not from Supabase metadata
 */
export const getUserSwigAddress = (userProfile: any): PublicKey | null => {
  try {
    if (!userProfile?.swigWalletAddress) {
      return null;
    }
    return new PublicKey(userProfile.swigWalletAddress);
  } catch (error) {
    console.error('Error getting user Swig address:', error);
    return null;
  }
};
