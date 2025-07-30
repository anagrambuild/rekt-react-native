import { Platform } from 'react-native';

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { Actions, createEd25519AuthorityInfo } from '@swig-wallet/classic';
import { getCreateV1InstructionDataCodec } from '@swig-wallet/coder';

import bs58 from 'bs58';
import { Buffer } from 'buffer';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { toByteArray } from 'react-native-quick-base64';
import nacl from 'tweetnacl';



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
      console.error(
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
  // Generate a random 32-byte ID for the Swig account
  const id = new Uint8Array(32);
  crypto.getRandomValues(id);

  // FIXED: Use manual PDA derivation with correct seeds (matching findSwigPda implementation)
  const SWIG_PROGRAM_ID = new PublicKey(
    'swigypWHEksbC64pWKwah1WTeh9JXwx8H1rJHLdbQMB'
  );
  const [swigAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('swig'), Buffer.from(id)],
    SWIG_PROGRAM_ID
  );

  try {
    // Get USDC mint address from app config
    const usdcMint = new PublicKey(
      Constants.expoConfig?.extra?.usdcMint || 
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Mainnet USDC fallback
    );

    // Create authority info for the user's public key
    const rootAuthorityInfo = createEd25519AuthorityInfo(userPublicKey);

    // Set up actions - manageAuthority AND USDC token permissions in one transaction
    const rootActions = Actions.set()
      .manageAuthority()
      .tokenLimit({ 
        mint: usdcMint, 
        amount: BigInt(1000 * 10 ** 6) // 1000 USDC (6 decimals)
      })
      .get();

    // Create the Swig account instruction manually with correct address
    // We need to calculate the bump seed for the PDA
    const [, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('swig'), Buffer.from(id)],
      SWIG_PROGRAM_ID
    );

    // Encode the instruction data
    const instructionDataCodec = getCreateV1InstructionDataCodec();
    const instructionData = instructionDataCodec.encoder.encode({
      id,
      actions: rootActions.bytes(),
      authorityData: rootAuthorityInfo.data,
      authorityType: rootAuthorityInfo.type,
      noOfActions: rootActions.count,
      bump,
    });

    // Create the instruction manually with correct accounts
    const createSwigIx = new TransactionInstruction({
      programId: SWIG_PROGRAM_ID,
      keys: [
        {
          pubkey: swigAddress,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: userPublicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      data: Buffer.from(instructionData),
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
            // Check if we got a signature (signAndSendTransaction response)
            if (responseData.signature) {
              resolve({
                swigAddress,
                transactionSignature: responseData.signature,
                success: true,
              });
              return;
            }

            // Check if we got a signed transaction (signTransaction response)
            if (responseData.transaction) {
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

              // Confirm the transaction
              await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight: (
                  await connection.getLatestBlockhash()
                ).lastValidBlockHeight,
              });

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
    const cluster = solanaNetwork.includes('mainnet')
      ? 'mainnet-beta'
      : 'devnet';
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

    // Generate a random 32-byte ID for the Swig account
    const id = new Uint8Array(32);
    crypto.getRandomValues(id);

    // FIXED: Use manual PDA derivation with correct seeds (matching findSwigPda implementation)
    const SWIG_PROGRAM_ID = new PublicKey(
      'swigypWHEksbC64pWKwah1WTeh9JXwx8H1rJHLdbQMB'
    );
    const [swigAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('swig'), Buffer.from(id)],
      SWIG_PROGRAM_ID
    );

    // Get USDC mint address from app config
    const usdcMint = new PublicKey(
      Constants.expoConfig?.extra?.usdcMint || 
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Mainnet USDC fallback
    );

    // Create authority info for the authorized public key
    const rootAuthorityInfo = createEd25519AuthorityInfo(authorizedPubkey);

    // Set up actions - manageAuthority AND USDC token permissions in one transaction
    const rootActions = Actions.set()
      .manageAuthority()
      .tokenLimit({ 
        mint: usdcMint, 
        amount: BigInt(1000 * 10 ** 6) // 1000 USDC (6 decimals)
      })
      .get();



    // Create the Swig account instruction manually with correct address
    // We need to calculate the bump seed for the PDA
    const [, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('swig'), Buffer.from(id)],
      SWIG_PROGRAM_ID
    );

    // Encode the instruction data
    const instructionDataCodec = getCreateV1InstructionDataCodec();
    const instructionData = instructionDataCodec.encoder.encode({
      id,
      actions: rootActions.bytes(),
      authorityData: rootAuthorityInfo.data,
      authorityType: rootAuthorityInfo.type,
      noOfActions: rootActions.count,
      bump,
    });

    // Create the instruction manually with correct accounts
    const createSwigIx = new TransactionInstruction({
      programId: SWIG_PROGRAM_ID,
      keys: [
        {
          pubkey: swigAddress,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: authorizedPubkey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      data: Buffer.from(instructionData),
    });

    // Create the transaction using VersionedTransaction (same as working test)

    // Create the transaction message
    const txMessage = new TransactionMessage({
      payerKey: authorizedPubkey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [createSwigIx],
    }).compileToV0Message();

    // Construct the Versioned Transaction
    const versionedTransaction = new VersionedTransaction(txMessage);

    // Step 4: Use MWA ONLY for signing (minimal operation, same as working test)
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
