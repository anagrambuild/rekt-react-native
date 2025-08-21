import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import {
  Actions,
  createEd25519AuthorityInfo,
  fetchSwig,
  findSwigPda,
  getCreateSwigInstruction,
} from "@swig-wallet/classic";

export interface SwigAccountResult {
  swigAddress: PublicKey;
  transactionSignature: string;
}

export interface SwigAccountInfo {
  exists: boolean;
  swigAddress: PublicKey;
  swig?: any; // Swig account data if it exists
}

/**
 * Creates a new Swig account for a user
 */
export const createSwigAccount = async (
  connection: Connection,
  userKeypair: Keypair
): Promise<SwigAccountResult> => {
  try {
    // Generate a random ID for the Swig account
    const id = new Uint8Array(32);
    crypto.getRandomValues(id);

    // Derive the Swig PDA
    const swigAddress = findSwigPda(id);

    // Create authority info for the user's public key
    const rootAuthorityInfo = createEd25519AuthorityInfo(userKeypair.publicKey);

    // Set up actions - giving the user full control initially
    const rootActions = Actions.set()
      .manageAuthority()
      .solLimit({ amount: BigInt(1000000000) }) // 1 SOL limit
      .get();

    // Create the Swig account instruction
    const createSwigIx = await getCreateSwigInstruction({
      payer: userKeypair.publicKey,
      id,
      actions: rootActions,
      authorityInfo: rootAuthorityInfo,
    });

    // Create and send transaction
    const transaction = new Transaction().add(createSwigIx);
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      userKeypair,
    ]);

    console.log("✓ Swig account created at:", swigAddress.toBase58());
    console.log("Transaction signature:", signature);

    return {
      swigAddress,
      transactionSignature: signature,
    };
  } catch (error) {
    console.error("Error creating Swig account:", error);
    throw error;
  }
};

/**
 * Checks if a Swig account exists and returns account info
 */
export const checkSwigAccount = async (
  connection: Connection,
  swigAddress: PublicKey
): Promise<SwigAccountInfo> => {
  try {
    const swig = await fetchSwig(connection, swigAddress);

    return {
      exists: true,
      swigAddress,
      swig,
    };
  } catch (error) {
    console.error("Error checking Swig account:", error);
    // If fetchSwig fails, the account doesn't exist
    return {
      exists: false,
      swigAddress,
    };
  }
};

/**
 * Derives a Swig PDA from a user's wallet address (deterministic)
 * This ensures each user gets the same Swig address every time
 */
export const deriveUserSwigAddress = (userPublicKey: PublicKey): PublicKey => {
  // Create a deterministic ID based on the user's public key
  const id = new Uint8Array(32);
  const userBytes = userPublicKey.toBytes();

  // Use the first 32 bytes of the user's public key as the ID
  // If the public key is shorter, pad with zeros
  for (let i = 0; i < Math.min(32, userBytes.length); i++) {
    id[i] = userBytes[i];
  }

  return findSwigPda(id);
};

/**
 * Gets or creates a Swig account for a user
 */
export const getOrCreateSwigAccount = async (
  connection: Connection,
  userKeypair: Keypair
): Promise<SwigAccountResult> => {
  const swigAddress = deriveUserSwigAddress(userKeypair.publicKey);
  const accountInfo = await checkSwigAccount(connection, swigAddress);

  if (accountInfo.exists) {
    console.log("✓ Swig account already exists at:", swigAddress.toBase58());
    return {
      swigAddress,
      transactionSignature: "", // No transaction needed
    };
  }

  // Account doesn't exist, create it
  console.log("Creating new Swig account...");
  return await createSwigAccount(connection, userKeypair);
};
