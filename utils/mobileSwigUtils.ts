/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  Actions,
  createEd25519AuthorityInfo,
  findSwigPda,
  getCreateSwigInstruction,
} from '@swig-wallet/classic';

import * as Linking from 'expo-linking';
import { toByteArray } from 'react-native-quick-base64';

// Type definition for mobile Swig creation result
export interface MobileSwigCreationResult {
  swigAddress: PublicKey;
  transactionSignature: string;
  success: boolean;
  error?: string;
}

// Mobile wallet adapter imports (Android only)
let transact: any = null;
const isAndroid = Platform.OS === 'android';

if (isAndroid) {
  try {
    const mobileWalletAdapter = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
    transact = mobileWalletAdapter.transact;
  } catch (error) {
    console.log('Mobile wallet adapter not available on this platform', error);
  }
}

/**
 * Creates a Swig account using Phantom wallet deep linking (iOS)
 */
export const createSwigAccountWithPhantom = async (
  connection: Connection,
  userPublicKey: PublicKey,
  sharedSecret: Uint8Array,
  session: string,
  dappPublicKey: Uint8Array
): Promise<MobileSwigCreationResult> => {
  const bs58 = require('bs58');
  const nacl = require('tweetnacl');
  const Buffer = require('buffer').Buffer;

  // Create deterministic ID based on user's public key
  const id = new Uint8Array(32);
  const userBytes = userPublicKey.toBytes();
  for (let i = 0; i < Math.min(32, userBytes.length); i++) {
    id[i] = userBytes[i];
  }

  // Derive the Swig PDA
  const swigAddress = findSwigPda(id);

  try {
    // Create authority info for the user's public key
    const rootAuthorityInfo = createEd25519AuthorityInfo(userPublicKey);

    // Set up actions - giving the user full control initially
    const rootActions = Actions.set()
      .manageAuthority()
      .solLimit({ amount: BigInt(1000000000) }) // 1 SOL limit
      .get();

    // Create the Swig account instruction
    const createSwigIx = await getCreateSwigInstruction({
      payer: userPublicKey,
      id,
      actions: rootActions,
      authorityInfo: rootAuthorityInfo,
    });

    // Create transaction
    const transaction = new Transaction().add(createSwigIx);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    // Serialize transaction for Phantom (matching demo app exactly)
    const serializedTransaction = bs58.encode(
      transaction.serialize({
        requireAllSignatures: false,
      })
    );

    // Create payload for Phantom
    const payload = {
      transaction: serializedTransaction,
      session,
    };

    // Encrypt the payload
    const nonce = nacl.randomBytes(24);
    const encryptedPayload = nacl.box.after(
      Buffer.from(JSON.stringify(payload)),
      nonce,
      sharedSecret
    );

    // Get app URL scheme for test transaction (redirect to root with identifier)
    const redirectLink = Linking.createURL('');

    // Create Phantom signAndSendTransaction URL (matching demo app exactly)
    const phantomUrl = `https://phantom.app/ul/v1/signAndSendTransaction?dapp_encryption_public_key=${bs58.encode(
      dappPublicKey
    )}&nonce=${bs58.encode(nonce)}&payload=${bs58.encode(
      encryptedPayload
    )}&redirect_link=${encodeURIComponent(redirectLink)}`;

    try {
      await Linking.openURL(phantomUrl);
    } catch (linkingError) {
      console.error('Error opening Phantom URL:', linkingError);
      throw linkingError;
    }

    // Return a promise that will be resolved by the URL scheme handler
    return new Promise((resolve, reject) => {
      // Set up a timeout for the signing process
      const timeout = setTimeout(() => {
        reject(
          new Error(
            'Transaction signing timeout - user did not complete signing in Phantom'
          )
        );
      }, 120000); // 2 minute timeout

      // Store the resolver in a global state so the URL handler can access it
      (global as any).phantomSigningResolver = {
        resolve: (signature: string) => {
          clearTimeout(timeout);
          resolve({
            swigAddress,
            transactionSignature: signature,
            success: true,
          });
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
      };
    });
  } catch (error) {
    console.error('Error creating Swig account with Phantom:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      swigAddress,
      transactionSignature: '',
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Determines the appropriate method to create a Swig account based on platform and wallet
 */
export const createSwigAccountForMobile = async (
  connection: Connection,
  _userPublicKey: PublicKey,
  _solanaNetwork: string,
  sharedSecret?: Uint8Array,
  session?: string,
  dappPublicKey?: Uint8Array
): Promise<MobileSwigCreationResult> => {
  if (isAndroid) {
    // For now, return an error since this function is not implemented
    return {
      swigAddress: _userPublicKey, // placeholder
      transactionSignature: '',
      success: false,
      error: 'MWA Swig account creation not implemented',
    };
  } else if (
    Platform.OS === 'ios' &&
    sharedSecret &&
    session &&
    dappPublicKey
  ) {
    return await createSwigAccountWithPhantom(
      connection,
      _userPublicKey,
      sharedSecret,
      session,
      dappPublicKey
    );
  } else {
    const missingParams = [];
    if (Platform.OS === 'ios') {
      if (!sharedSecret) missingParams.push('sharedSecret');
      if (!session) missingParams.push('session');
      if (!dappPublicKey) missingParams.push('dappPublicKey');
    }

    throw new Error(
      `No supported wallet method available for Swig account creation. Platform: ${
        Platform.OS
      }. Missing: ${missingParams.join(', ')}`
    );
  }
};

/**
 * Creates a test transaction for wallet signing verification
 */
export const createTestTransaction = async (
  connection: Connection,
  userPublicKey: PublicKey
): Promise<Transaction> => {
  // Create a simple transaction that transfers minimal SOL to specified test address
  const { SystemProgram } = require('@solana/web3.js');

  // Test recipient address
  const testRecipientAddress = new PublicKey(
    '9PFiMki6eJKF238GDyEBt7yfeNL6JGD2YFKs41VyVHQp'
  );

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: userPublicKey,
      toPubkey: testRecipientAddress,
      lamports: 200, // 100 lamports (0.0000001 SOL) - minimal test amount
    })
  );

  transaction.feePayer = userPublicKey;

  // Get recent blockhash (matching demo app pattern)
  const { blockhash } = await connection.getLatestBlockhash();
  (transaction as any).recentBlockhash = blockhash;

  return transaction;
};
/**
 * Signs a test transaction using Mobile Wallet Adapter (Android)
 * Following the EXACT same pattern as the working connection
 */
export const signTestTransactionWithMWA = async (
  connection: Connection,
  _userPublicKey: PublicKey,
  solanaNetwork: string
): Promise<{ signature: string; success: boolean; error?: string }> => {
  if (!transact) {
    return {
      signature: '',
      success: false,
      error: 'Mobile Wallet Adapter not available',
    };
  }

  try {
    // Step 1: Get blockhash BEFORE any MWA operations
    const latestBlockhash = await connection.getLatestBlockhash();

    // Step 2: Use MWA ONLY for authorization (same as working connection)
    const authResult = await transact(async (wallet: any) => {
      const result = await wallet.authorize({
        cluster: solanaNetwork, // Same as working connection
        identity: {
          name: 'Rekt', // Same as working connection
          uri: 'https://rekt.app',
          icon: 'favicon.ico',
        },
        // NO cached auth token - same as working connection
      });

      return result; // Simple return, just like working connection
    });

    // Step 3: Now do ALL transaction operations OUTSIDE of MWA
    // Convert base64 address to PublicKey
    const addressBytes = toByteArray(authResult.accounts[0].address);
    const authorizedPubkey = new PublicKey(addressBytes);

    // Create test transaction using the authorized public key
    const {
      SystemProgram,
      TransactionMessage,
      VersionedTransaction,
    } = require('@solana/web3.js');

    const testRecipientAddress = new PublicKey(
      '9PFiMki6eJKF238GDyEBt7yfeNL6JGD2YFKs41VyVHQp'
    );

    // Create instructions array
    const instructions = [
      SystemProgram.transfer({
        fromPubkey: authorizedPubkey,
        toPubkey: testRecipientAddress,
        lamports: 100,
      }),
    ];

    // Create the transaction message
    const txMessage = new TransactionMessage({
      payerKey: authorizedPubkey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message();

    // Construct the Versioned Transaction
    const versionedTransaction = new VersionedTransaction(txMessage);

    // Step 4: Use MWA ONLY for signing (minimal operation)
    const signResult = await transact(async (wallet: any) => {
      // Re-authorize with the cached token from previous auth
      await wallet.authorize({
        cluster: solanaNetwork,
        identity: {
          name: 'Rekt',
          uri: 'https://rekt.app',
          icon: 'favicon.ico',
        },
        auth_token: authResult.auth_token, // Use the token from previous auth
      });

      const signedTransactions = await wallet.signTransactions({
        transactions: [versionedTransaction],
      });

      return signedTransactions[0]; // Simple return
    });

    // Step 5: Send transaction using your connection (outside MWA)
    const serializedTx = signResult.serialize();
    const txSignature = await connection.sendRawTransaction(serializedTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // Wait for confirmation
    await connection.confirmTransaction(txSignature, 'confirmed');

    return {
      signature: txSignature,
      success: true,
    };
  } catch (error) {
    console.error('Error in MWA test transaction:', error);

    if (error instanceof Error) {
      // Handle specific MWA session errors
      if (error.message.includes('CLOSED')) {
        return {
          signature: '',
          success: false,
          error: 'Wallet session closed. Please try again.',
        };
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      signature: '',
      success: false,
      error: errorMessage,
    };
  }
};
/**
 * Signs a test transaction using Phantom wallet deep linking (iOS)
 * Using signTransaction (compatible with more Phantom versions)
 */
export const signTestTransactionWithPhantom = async (
  connection: Connection,
  userPublicKey: PublicKey,
  sharedSecret: Uint8Array,
  session: string,
  dappPublicKey: Uint8Array
): Promise<{ signature: string; success: boolean; error?: string }> => {
  const bs58 = require('bs58');
  const nacl = require('tweetnacl');
  const Buffer = require('buffer').Buffer;

  try {
    // Use legacy Transaction format for better compatibility
    const { SystemProgram, Transaction } = require('@solana/web3.js');

    const testRecipientAddress = new PublicKey(
      '9PFiMki6eJKF238GDyEBt7yfeNL6JGD2YFKs41VyVHQp'
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();

    // Create legacy transaction for better compatibility
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: testRecipientAddress,
        lamports: 100,
      })
    );

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    // Serialize transaction for Phantom (legacy format)
    const serializedTransaction = bs58.encode(
      transaction.serialize({
        requireAllSignatures: false,
      })
    );

    // Create payload for Phantom
    const payload = {
      transaction: serializedTransaction,
      session,
    };

    // Encrypt the payload
    const nonce = nacl.randomBytes(24);
    const encryptedPayload = nacl.box.after(
      Buffer.from(JSON.stringify(payload)),
      nonce,
      sharedSecret
    );

    // Get app URL scheme for redirect
    const redirectLink = Linking.createURL('');

    // Create Phantom signTransaction URL (compatible method)
    const phantomUrl = `https://phantom.app/ul/v1/signTransaction?dapp_encryption_public_key=${bs58.encode(
      dappPublicKey
    )}&nonce=${bs58.encode(nonce)}&payload=${bs58.encode(
      encryptedPayload
    )}&redirect_link=${encodeURIComponent(redirectLink)}`;

    try {
      await Linking.openURL(phantomUrl);
    } catch (linkingError) {
      console.error('Error opening Phantom URL:', linkingError);
      throw linkingError;
    }

    // Return a promise that will be resolved by the URL scheme handler
    return new Promise((resolve, reject) => {
      // Set up a timeout for the signing process
      const timeout = setTimeout(() => {
        reject(
          new Error(
            'Test transaction signing timeout - user did not complete signing in Phantom'
          )
        );
      }, 300000); // 5 minute timeout for testing

      // Store the resolver in a global state so the URL handler can access it
      (global as any).phantomTestSigningResolver = {
        resolve: (signature: string) => {
          clearTimeout(timeout);
          resolve({
            signature: signature,
            success: true,
          });
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          resolve({
            signature: '',
            success: false,
            error: error.message,
          });
        },
      };
    });
  } catch (error) {
    console.error('Error creating test transaction with Phantom:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      signature: '',
      success: false,
      error: errorMessage,
    };
  }
};
