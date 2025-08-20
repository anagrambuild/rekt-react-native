import { Connection, PublicKey } from '@solana/web3.js';

import {
  ClosePositionRequest,
  closeTradingPosition,
  getOpenPositions,
  getTradingHistory,
  getUserByUserId,
  OpenPositionRequest,
  openTradingPosition,
  Position,
  submitSignedTransaction,
} from './backendApi';
import { getCurrentUser } from './supabaseApi';
import {
  signTransactionWithSwig,
  SwigTransactionData,
  validateSwigWalletSetup,
} from './swigTradingUtils';

export interface TradingFlowResult {
  success: boolean;
  data?: {
    positionId?: string;
    transactionSignature?: string;
    confirmation?: {
      slot: number;
      confirmations: number | null;
      confirmationStatus: string;
      err: string | null;
    };
    entryPrice?: number;
    exitPrice?: number;
    pnl?: number;
    pnlPercentage?: number;
    closedAt?: string;
    positionSize?: number;
    marginUsed?: number;
    status?: string;
    openedAt?: string;
  };
  error?: string;
  requiresInitialization?: boolean;
  initializationData?: SwigTransactionData;
}

export interface ExecuteTradeParams {
  asset: 'SOL-PERP' | 'BTC-PERP' | 'ETH-PERP';
  direction: 'long' | 'short';
  amount: number;
  leverage: number;
}

/**
 * Complete trading service that handles the full flow:
 * 1. Open position (get transaction data)
 * 2. Sign with Swig wallet
 * 3. Submit to blockchain
 * 4. Handle initialization if needed
 */
export class TradingService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Execute a complete trade flow
   */
  async executeTrade(params: ExecuteTradeParams): Promise<TradingFlowResult> {
    try {
      console.log('🚀 Starting trade execution:', params);

      // Get user info from Supabase
      const currentUser = await getCurrentUser();
      if (!currentUser?.id) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      const userId = currentUser.id;
      const walletAddress = currentUser.user_metadata?.wallet_address;
      if (!walletAddress) {
        return {
          success: false,
          error: 'Wallet address not found in user metadata',
        };
      }

      const userPublicKey = new PublicKey(walletAddress);

      // Skip Swig validation for now - will be handled when needed
      console.log(
        '🔍 Swig wallet setup will be validated when signing is required...'
      );

      // Step 1: Request position opening from backend
      console.log('📡 Requesting position opening from backend...');
      const openRequest: OpenPositionRequest = {
        userId: userId,
        asset: params.asset,
        direction: params.direction,
        amount: params.amount,
        leverage: params.leverage,
      };

      const openResponse = await openTradingPosition(openRequest);
      console.log('📨 Backend response received:', openResponse.success);

      // Check if initialization is required
      if (
        openResponse.data?.needsInitialization ||
        openResponse.data?.initializationRequired
      ) {
        console.log('⚠️ Drift account initialization required');

        if (openResponse.data.initializationInstructions) {
          return {
            success: false,
            requiresInitialization: true,
            initializationData: openResponse.data.initializationInstructions,
            error: 'Drift account initialization required',
          };
        } else {
          return {
            success: false,
            error: 'Initialization required but no instructions provided',
          };
        }
      }

      // Check if we have transaction data to sign
      if (openResponse.data?.transactionData) {
        console.log(
          '🔐 Transaction data received, signing with Swig wallet...'
        );

        // Validate Swig setup only when we need to sign
        const swigValidation = await validateSwigWalletSetup(
          this.connection,
          userPublicKey
        );
        if (!swigValidation.isValid) {
          return {
            success: false,
            error: `Swig wallet validation failed: ${swigValidation.error}`,
          };
        }

        // Step 2: Sign the transaction with Swig
        const signingResult = await signTransactionWithSwig(
          this.connection,
          openResponse.data.transactionData,
          userPublicKey
        );

        if (!signingResult.success || !signingResult.signedTransaction) {
          return {
            success: false,
            error: `Transaction signing failed: ${signingResult.error}`,
          };
        }

        // Step 3: Submit the signed transaction
        console.log('📤 Submitting signed transaction to blockchain...');
        const submitResult = await submitSignedTransaction({
          signedTransaction: signingResult.signedTransaction,
          walletAddress: walletAddress,
          positionId: openResponse.data.positionId,
        });

        if (!submitResult.success) {
          return {
            success: false,
            error: `Transaction submission failed: ${submitResult.message}`,
          };
        }

        console.log('✅ Trade executed successfully with Swig signing!');
        console.log('Transaction signature:', submitResult.data?.signature);

        return {
          success: true,
          data: {
            positionId: openResponse.data.positionId,
            transactionSignature: submitResult.data?.signature,
            confirmation: submitResult.data?.confirmation,
          },
        };
      } else if (openResponse.data?.positionId) {
        // Backend returned position data directly (old flow) - this means the trade was executed on the backend
        console.log(
          '✅ Trade executed successfully by backend (no signing required)'
        );

        return {
          success: true,
          data: {
            positionId: openResponse.data.positionId,
            entryPrice: openResponse.data.entryPrice,
            positionSize: openResponse.data.positionSize,
            marginUsed: openResponse.data.marginUsed,
          },
        };
      } else {
        return {
          success: false,
          error: 'No transaction data or position data received from backend',
        };
      }
    } catch (error) {
      console.error('❌ Trade execution failed:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown trade execution error',
      };
    }
  }

  /**
   * Handle Drift account initialization
   */
  async initializeDriftAccount(
    initializationData: SwigTransactionData
  ): Promise<TradingFlowResult> {
    try {
      console.log('🔧 Starting Drift account initialization...');

      // Get user info from Supabase
      const currentUser = await getCurrentUser();
      if (!currentUser?.user_metadata?.wallet_address) {
        return {
          success: false,
          error: 'Wallet address not found in user metadata',
        };
      }

      const userPublicKey = new PublicKey(
        currentUser.user_metadata.wallet_address
      );

      // Sign the initialization transaction
      console.log('🔐 Signing initialization transaction...');
      const signingResult = await signTransactionWithSwig(
        this.connection,
        initializationData,
        userPublicKey
      );

      if (!signingResult.success || !signingResult.signedTransaction) {
        return {
          success: false,
          error: `Initialization signing failed: ${signingResult.error}`,
        };
      }

      // Submit the initialization transaction
      console.log('📤 Submitting initialization transaction...');
      const submitResult = await submitSignedTransaction({
        signedTransaction: signingResult.signedTransaction,
        walletAddress: currentUser.user_metadata.wallet_address,
      });

      if (!submitResult.success) {
        return {
          success: false,
          error: `Initialization submission failed: ${submitResult.message}`,
        };
      }

      console.log('✅ Drift account initialized successfully!');
      console.log('Transaction signature:', submitResult.data?.signature);

      return {
        success: true,
        data: {
          transactionSignature: submitResult.data?.signature,
          confirmation: submitResult.data?.confirmation,
        },
      };
    } catch (error) {
      console.error('❌ Drift initialization failed:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown initialization error',
      };
    }
  }

  /**
   * Close a trading position
   */
  async closePosition(positionId: string): Promise<TradingFlowResult> {
    try {
      console.log('🔒 Starting position close:', positionId);

      // Get user info from Supabase
      const currentUser = await getCurrentUser();
      if (!currentUser?.id) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      // Get user profile to get the profile ID
      const userProfile = await getUserByUserId(currentUser.id);
      if (!userProfile) {
        return {
          success: false,
          error: 'User profile not found',
        };
      }

      const userId = userProfile.id;
      const walletAddress = userProfile.swigWalletAddress;

      if (!walletAddress) {
        return {
          success: false,
          error: 'User wallet address not found',
        };
      }

      const userPublicKey = new PublicKey(walletAddress);

      // Request position closing from backend
      console.log('📡 Requesting position close from backend...');
      const closeRequest: ClosePositionRequest = {
        userId: userId,
        positionId: positionId,
      };

      const closeResponse = await closeTradingPosition(closeRequest);
      console.log('📨 Close response received:', closeResponse.success);

      // Check if we have transaction data to sign
      if (closeResponse.data?.transactionData) {
        console.log(
          '🔐 Transaction data received, signing close transaction...'
        );

        // Validate Swig setup only when we need to sign
        const swigValidation = await validateSwigWalletSetup(
          this.connection,
          userPublicKey
        );
        if (!swigValidation.isValid) {
          return {
            success: false,
            error: `Swig wallet validation failed: ${swigValidation.error}`,
          };
        }

        // Sign the close transaction
        const signingResult = await signTransactionWithSwig(
          this.connection,
          closeResponse.data.transactionData,
          userPublicKey
        );

        if (!signingResult.success || !signingResult.signedTransaction) {
          return {
            success: false,
            error: `Close transaction signing failed: ${signingResult.error}`,
          };
        }

        // Submit the close transaction
        console.log('📤 Submitting close transaction...');
        const submitResult = await submitSignedTransaction({
          signedTransaction: signingResult.signedTransaction,
          walletAddress: walletAddress,
          positionId: positionId,
        });

        if (!submitResult.success) {
          return {
            success: false,
            error: `Close transaction submission failed: ${submitResult.message}`,
          };
        }

        console.log('✅ Position closed successfully with Swig signing!');

        return {
          success: true,
          data: {
            positionId: positionId,
            transactionSignature: submitResult.data?.signature,
            confirmation: submitResult.data?.confirmation,
            exitPrice: closeResponse.data.exitPrice,
            pnl: closeResponse.data.pnl,
            pnlPercentage: closeResponse.data.pnlPercentage,
          },
        };
      } else if (closeResponse.data?.positionId) {
        // Backend closed position directly (legacy mode)
        console.log(
          '✅ Position closed successfully by backend (no signing required)'
        );

        return {
          success: true,
          data: {
            positionId: closeResponse.data.positionId,
            exitPrice: closeResponse.data.exitPrice,
            pnl: closeResponse.data.pnl,
            pnlPercentage: closeResponse.data.pnlPercentage,
            closedAt: closeResponse.data.closedAt,
          },
        };
      } else {
        return {
          success: false,
          error: 'No transaction data or position data received for close',
        };
      }
    } catch (error) {
      console.error('❌ Position close failed:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown position close error',
      };
    }
  }

  /**
   * Get user's open positions
   */
  async getPositions(): Promise<Position[]> {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      // Use the authenticated API wrapper - no need to pass token
      const positions = await getOpenPositions(currentUser.id);
      return positions;
    } catch (error) {
      console.error('Failed to get positions:', error);
      throw error;
    }
  }

  /**
   * Get user's trading history
   */
  async getHistory(status?: 'open' | 'closed'): Promise<Position[]> {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      // Use the authenticated API wrapper - no need to pass token
      const history = await getTradingHistory(currentUser.id, status, 50); // Default limit of 50
      return history;
    } catch (error) {
      console.error('Failed to get position history:', error);
      throw error;
    }
  }

  async updatePosition(
    positionId: string,
    updates: Partial<Position>
  ): Promise<Position> {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      // TODO: Implement position update logic
      // For now, just return the current position data
      throw new Error('Position update not implemented yet');
    } catch (error) {
      console.error('Failed to update position:', error);
      throw error;
    }
  }
}

/**
 * Create a trading service instance with the provided connection
 */
export const createTradingService = (
  connection: Connection
): TradingService => {
  return new TradingService(connection);
};
