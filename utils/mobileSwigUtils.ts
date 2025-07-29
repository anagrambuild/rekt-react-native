import { Platform } from 'react-native';

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  Actions,
  createEd25519AuthorityInfo,
  findSwigPda,
  getCreateSwigInstruction,
} from '@swig-wallet/classic';

import bs58 from 'bs58';
import { Buffer } from 'buffer';
import * as Linking from 'expo-linking';
import { toByteArray } from 'react-native-quick-base64';
import nacl from 'tweetnacl';

/**
 * Diagnostic function to validate Swig account creation parameters
 */
export const validateSwigAccountParams = (
  id: Uint8Array,
  swigAddress: PublicKey,
  payer: PublicKey,
  authorityInfo: any,
  actions: any
) => {
  console.log('🔍 [DIAGNOSTIC] Validating Swig account parameters...');

  // Check ID
  console.log('- ID length:', id.length, '(should be 32)');
  console.log('- ID bytes:', Array.from(id).slice(0, 8), '... (first 8 bytes)');
  console.log(
    '- ID is all zeros:',
    id.every((byte) => byte === 0)
  );

  // Check addresses
  console.log('- Payer:', payer.toBase58());
  console.log('- Swig Address:', swigAddress.toBase58());

  // Deep inspect authority info structure
  console.log(
    '- Authority Info Structure:',
    JSON.stringify(authorityInfo, null, 2)
  );
  console.log('- Authority has ed25519 field:', 'ed25519' in authorityInfo);
  console.log('- Authority ed25519 value:', authorityInfo.ed25519);

  // Try different ways to access the public key
  let authorityPubkey = 'NOT FOUND';
  let authorityMatches = false;

  // Check if authority.data contains the public key bytes
  if (authorityInfo.data && Array.isArray(Object.values(authorityInfo.data))) {
    const dataBytes = Object.values(authorityInfo.data) as number[];
    if (dataBytes.length === 32) {
      try {
        const authorityPublicKey = new PublicKey(new Uint8Array(dataBytes));
        authorityPubkey = authorityPublicKey.toBase58();
        authorityMatches = authorityPubkey === payer.toBase58();
      } catch (error) {
        console.log('- Error creating PublicKey from data:', error);
      }
    }
  }

  // Fallback to other possible structures
  if (authorityPubkey === 'NOT FOUND') {
    authorityPubkey =
      authorityInfo.ed25519?.publicKey?.toBase58() ||
      authorityInfo.publicKey?.toBase58() ||
      authorityInfo.pubkey?.toBase58() ||
      'NOT FOUND';
  }

  console.log('- Authority PublicKey:', authorityPubkey);
  console.log('- Authority Type:', authorityInfo.type, '(1 = Ed25519)');
  console.log('- Payer == Authority:', authorityMatches);

  // Check actions
  console.log('- Actions:', JSON.stringify(actions, null, 2));

  // Validate PDA derivation
  try {
    const derivedAddress = findSwigPda(id);
    console.log(
      '- PDA derivation matches:',
      derivedAddress.toBase58() === swigAddress.toBase58()
    );
  } catch (error) {
    console.log('- PDA derivation error:', error);
  }

  console.log('🔍 [DIAGNOSTIC] Validation complete');
};

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

// Initialize MWA transact function for Android
const initializeMWA = async () => {
  if (isAndroid && !transact) {
    try {
      const { transact: mwaTransact } = await import(
        '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
      );
      transact = mwaTransact;
    } catch (error) {
      console.log(
        'Mobile wallet adapter not available on this platform',
        error
      );
    }
  }
};

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
  // Generate random ID (matching tutorial approach)
  const id = new Uint8Array(32);
  crypto.getRandomValues(id);

  // Derive the Swig PDA
  const swigAddress = findSwigPda(id);

  try {
    // Create authority info for the user's public key
    const rootAuthorityInfo = createEd25519AuthorityInfo(userPublicKey);

    // Set up actions - only manageAuthority for root (matching tutorial)
    const rootActions = Actions.set().manageAuthority().get();

    // Validate parameters before creating instruction
    validateSwigAccountParams(
      id,
      swigAddress,
      userPublicKey,
      rootAuthorityInfo,
      rootActions
    );

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
            'Transaction signing timeout - user did not complete signing in Phantom'
          )
        );
      }, 120000); // 2 minute timeout

      // Store the resolver in a global state so the URL handler can access it
      (global as any).phantomSwigSigningResolver = {
        resolve: async (responseData: any) => {
          clearTimeout(timeout);
          try {
            console.log('📤 Processing Swig creation response from Phantom...');
            console.log('Response data:', responseData);

            // Check if we got a signature (signAndSendTransaction response)
            if (responseData.signature) {
              console.log(
                '✅ Received transaction signature:',
                responseData.signature
              );
              resolve({
                swigAddress,
                transactionSignature: responseData.signature,
                success: true,
              });
              return;
            }

            // Check if we got a signed transaction (signTransaction response)
            if (responseData.transaction) {
              console.log('📤 Sending signed Swig creation transaction...');

              // Decode the signed transaction
              const signedTransaction = bs58.decode(responseData.transaction);

              // Send the signed transaction
              const signature = await connection.sendRawTransaction(
                signedTransaction,
                {
                  skipPreflight: false,
                  preflightCommitment: 'confirmed',
                }
              );

              console.log(
                '⏳ Confirming Swig creation transaction:',
                signature
              );

              // Confirm the transaction
              await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight: (
                  await connection.getLatestBlockhash()
                ).lastValidBlockHeight,
              });

              console.log('✅ Swig creation transaction confirmed!');

              resolve({
                swigAddress,
                transactionSignature: signature,
                success: true,
              });
              return;
            }

            // If we get here, the response format is unexpected
            console.error(
              '❌ Unexpected response format from Phantom:',
              responseData
            );
            reject(new Error('Unexpected response format from Phantom'));
          } catch (sendError) {
            console.error(
              '❌ Error processing Swig creation response:',
              sendError
            );
            reject(sendError);
          }
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
 * Creates a Swig account using Mobile Wallet Adapter (Android)
 * Following the EXACT same pattern as the working MWA test transaction
 */
export const createSwigAccountWithMWA = async (
  connection: Connection,
  solanaNetwork: string
): Promise<MobileSwigCreationResult> => {
  // Initialize MWA if needed
  await initializeMWA();

  if (!transact) {
    return {
      swigAddress: PublicKey.default,
      transactionSignature: '',
      success: false,
      error: 'Mobile Wallet Adapter not available',
    };
  }

  try {
    // Step 1: Get blockhash BEFORE any MWA operations (same as working test)
    const latestBlockhash = await connection.getLatestBlockhash();

    // Step 2: Use MWA ONLY for authorization (same as working test)
    const cluster = solanaNetwork.includes('mainnet') ? 'mainnet-beta' : 'devnet';
    const authResult = await transact(async (wallet: any) => {
      const result = await wallet.authorize({
        cluster: cluster, // Use proper cluster name
        identity: {
          name: 'Rekt', // Same as working test
          uri: 'https://rekt.app',
          icon: 'favicon.ico',
        },
        // NO cached auth token - same as working test
      });

      return result; // Simple return, just like working test
    });

    // Step 3: Now do ALL Swig transaction operations OUTSIDE of MWA
    // Convert base64 address to PublicKey
    const addressBytes = toByteArray(authResult.accounts[0].address);
    const authorizedPubkey = new PublicKey(addressBytes);

    // Generate random ID (matching tutorial approach)
    const id = new Uint8Array(32);
    crypto.getRandomValues(id);

    // Derive the Swig PDA
    const swigAddress = findSwigPda(id);

    // Create authority info for the authorized public key
    console.log(
      '🔧 Creating Ed25519 authority info for:',
      authorizedPubkey.toBase58()
    );
    const rootAuthorityInfo = createEd25519AuthorityInfo(authorizedPubkey);
    console.log('🔧 Authority info created:', rootAuthorityInfo);

    // Set up actions - only manageAuthority for root (matching tutorial)
    const rootActions = Actions.set().manageAuthority().get();

    // Create the Swig account instruction
    console.log('🔧 Creating Swig instruction...');
    console.log('- Payer:', authorizedPubkey.toBase58());
    console.log('- Swig Address:', swigAddress.toBase58());

    // Validate parameters before creating instruction
    validateSwigAccountParams(
      id,
      swigAddress,
      authorizedPubkey,
      rootAuthorityInfo,
      rootActions
    );

    const createSwigIx = await getCreateSwigInstruction({
      payer: authorizedPubkey,
      id,
      actions: rootActions,
      authorityInfo: rootAuthorityInfo,
    });

    console.log('✅ Swig instruction created');

    // Create the transaction using VersionedTransaction (same as working test)

    // Create the transaction message
    console.log('🔧 Building transaction message...');
    const txMessage = new TransactionMessage({
      payerKey: authorizedPubkey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [createSwigIx],
    }).compileToV0Message();

    // Construct the Versioned Transaction
    const versionedTransaction = new VersionedTransaction(txMessage);
    console.log('✅ Transaction built successfully');

    // Step 4: Use MWA ONLY for signing (minimal operation, same as working test)
    console.log('🔐 Starting MWA signing process...');
    const signResult = await transact(async (wallet: any) => {
      console.log('🔐 Re-authorizing with cached token...');
      // Re-authorize with the cached token from previous auth
      await wallet.authorize({
        cluster: cluster,
        identity: {
          name: 'Rekt',
          uri: 'https://rekt.app',
          icon: 'favicon.ico',
        },
        auth_token: authResult.auth_token, // Use the token from previous auth
      });

      console.log('🔐 Requesting transaction signature...');
      const signedTransactions = await wallet.signTransactions({
        transactions: [versionedTransaction],
      });

      console.log('✅ Transaction signed successfully');
      return signedTransactions[0]; // Simple return
    });

    // Step 5: Send transaction using connection (outside MWA, same as working test)
    const serializedTx = signResult.serialize();
    const txSignature = await connection.sendRawTransaction(serializedTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // Wait for confirmation
    await connection.confirmTransaction({
      signature: txSignature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    console.log('✅ Swig account created with MWA:', swigAddress.toBase58());
    console.log('✅ Transaction signature:', txSignature);

    return {
      swigAddress,
      transactionSignature: txSignature,
      success: true,
    };
  } catch (error) {
    console.error('Error creating Swig account with MWA:', error);

    if (error instanceof Error) {
      // Handle specific MWA session errors (same as working test)
      if (error.message.includes('CLOSED')) {
        return {
          swigAddress: PublicKey.default,
          transactionSignature: '',
          success: false,
          error: 'Wallet session closed. Please try again.',
        };
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      swigAddress: PublicKey.default,
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
  solanaNetwork: string,
  sharedSecret?: Uint8Array,
  session?: string,
  dappPublicKey?: Uint8Array
): Promise<MobileSwigCreationResult> => {
  if (isAndroid) {
    // Use MWA for Android
    return await createSwigAccountWithMWA(connection, solanaNetwork);
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
  // Initialize MWA if needed
  await initializeMWA();

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
    const cluster = solanaNetwork.includes('mainnet') ? 'mainnet-beta' : 'devnet';
    const authResult = await transact(async (wallet: any) => {
      const result = await wallet.authorize({
        cluster: cluster, // Use proper cluster name
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
        cluster: cluster,
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
  try {
    // Use legacy Transaction format for better compatibility

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
