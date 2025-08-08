import { createContext, useContext, useEffect, useState } from 'react';

import { CandleData, generateDummyCandleData } from '@/utils/miniGameData';

export type MiniGamePrediction = 'green' | 'red' | null;
export type SupportedToken = 'sol' | 'eth' | 'btc';

export interface PendingCandle {
  id: string;
  prediction: MiniGamePrediction;
  betAmount: number;
  status: 'predicting' | 'decision' | 'finished';
  timeRemaining: number; // for prediction phase (50s) or decision phase (10s)
  finalResult?: 'green' | 'red';
  isWin?: boolean;
  winAmount?: number;
  currentColor?: 'green' | 'red'; // for decision mode flickering
}

export interface TokenGameState {
  candles: CandleData[];
  pendingCandles: PendingCandle[]; // Multiple candles can be in different phases
  totalWinnings: number;
  totalLosses: number;
  currentStreak: number;
  gamesPlayed: number;
}

export interface MiniGameState {
  selectedToken: SupportedToken;
  tokenGames: Record<SupportedToken, TokenGameState>;
  // Mock token prices for display
  tokenPrices: Record<
    SupportedToken,
    { current_price: number; symbol: string; name: string }
  >;
}

interface MiniGameContextType {
  gameState: MiniGameState;
  selectedToken: SupportedToken;
  setSelectedToken: (token: SupportedToken) => void;
  getCurrentTokenGame: () => TokenGameState;
  makePrediction: (prediction: MiniGamePrediction) => void;
  increaseBet: () => void; // Tap to increase bet by $1
  resetGame: () => void;
  refreshCandles: () => void;
  // Helper functions for UI state
  getCurrentPrediction: () => PendingCandle | null;
  isInDecisionMode: () => boolean;
  canMakePrediction: (prediction: MiniGamePrediction) => boolean;
  getCurrentBetAmount: () => number;
  getTimeRemaining: () => number;
}

// Helper function to create initial token game state
const createInitialTokenGame = (basePrice: number): TokenGameState => ({
  candles: generateDummyCandleData(10, basePrice),
  pendingCandles: [],
  totalWinnings: 0,
  totalLosses: 0,
  currentStreak: 0,
  gamesPlayed: 0,
});

const initialGameState: MiniGameState = {
  selectedToken: 'sol',
  tokenGames: {
    sol: createInitialTokenGame(170), // SOL ~$170
    eth: createInitialTokenGame(2500), // ETH ~$2500
    btc: createInitialTokenGame(65000), // BTC ~$65000
  },
  tokenPrices: {
    sol: { current_price: 170.5, symbol: 'SOL', name: 'Solana' },
    eth: { current_price: 2568.45, symbol: 'ETH', name: 'Ethereum' },
    btc: { current_price: 65200, symbol: 'BTC', name: 'Bitcoin' },
  },
};

export const MiniGameContext = createContext<MiniGameContextType>({
  gameState: initialGameState,
  selectedToken: 'sol',
  setSelectedToken: () => {},
  getCurrentTokenGame: () => initialGameState.tokenGames.sol,
  makePrediction: () => {},
  increaseBet: () => {},
  resetGame: () => {},
  refreshCandles: () => {},
  getCurrentPrediction: () => null,
  isInDecisionMode: () => false,
  canMakePrediction: () => true,
  getCurrentBetAmount: () => 1,
  getTimeRemaining: () => 0,
});

export const useMiniGameContext = () => {
  return useContext(MiniGameContext);
};

export const MiniGameProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [gameState, setGameState] = useState<MiniGameState>(initialGameState);

  const getCurrentTokenGame = (): TokenGameState => {
    return gameState.tokenGames[gameState.selectedToken];
  };

  const setSelectedToken = (token: SupportedToken) => {
    setGameState((prev) => ({
      ...prev,
      selectedToken: token,
    }));
  };

  // Main game timer - handles all pending candles across all tokens
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        const newTokenGames = { ...prev.tokenGames };
        let hasChanges = false;

        // Process each token's pending candles
        Object.keys(newTokenGames).forEach((tokenKey) => {
          const token = tokenKey as SupportedToken;
          const tokenGame = newTokenGames[token];
          const updatedPendingCandles = [...tokenGame.pendingCandles];

          updatedPendingCandles.forEach((candle) => {
            if (candle.timeRemaining > 0) {
              candle.timeRemaining -= 1;
              hasChanges = true;

              // Handle phase transitions
              if (candle.status === 'predicting' && candle.timeRemaining <= 0) {
                // Move from prediction to decision phase
                candle.status = 'decision';
                candle.timeRemaining = 10; // 10 seconds for decision
                candle.currentColor = Math.random() > 0.5 ? 'green' : 'red'; // Start with random color
                hasChanges = true;
              } else if (candle.status === 'decision') {
                // Flicker between colors during decision phase
                if (candle.timeRemaining > 0) {
                  candle.currentColor = Math.random() > 0.5 ? 'green' : 'red';
                } else {
                  // Decision phase complete - finalize result and start new round
                  const finalResult: 'green' | 'red' =
                    Math.random() > 0.5 ? 'green' : 'red';
                  const isWin = candle.prediction === finalResult;

                  candle.status = 'finished';
                  candle.finalResult = finalResult;
                  candle.isWin = isWin;
                  candle.winAmount = isWin ? candle.betAmount * 1.8 : 0; // 1.8x payout
                  candle.currentColor = finalResult;

                  // Update game stats
                  if (isWin) {
                    tokenGame.totalWinnings += candle.winAmount!;
                    tokenGame.currentStreak += 1;
                  } else {
                    tokenGame.totalLosses += candle.betAmount;
                    tokenGame.currentStreak = 0;
                  }
                  tokenGame.gamesPlayed += 1;

                  // Generate new candle and add to chart (remove first, add new)
                  const newCandle = generateNewCandle(
                    tokenGame.candles[tokenGame.candles.length - 1],
                    finalResult
                  );
                  tokenGame.candles = [
                    ...tokenGame.candles.slice(1),
                    newCandle,
                  ];

                  hasChanges = true;
                }
              }
            }
          });

          // Remove finished candles after 3 seconds to show result
          const filteredCandles = updatedPendingCandles.filter((candle) => {
            if (candle.status === 'finished') {
              // Keep finished candles for 3 seconds to show result
              return candle.timeRemaining > -3;
            }
            return true;
          });

          if (filteredCandles.length !== tokenGame.pendingCandles.length) {
            hasChanges = true;
          }

          newTokenGames[token] = {
            ...tokenGame,
            pendingCandles: filteredCandles,
          };
        });

        return hasChanges ? { ...prev, tokenGames: newTokenGames } : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper functions for UI state
  const getCurrentPrediction = (): PendingCandle | null => {
    const currentGame = getCurrentTokenGame();
    return (
      currentGame.pendingCandles.find((c) => c.status === 'predicting') || null
    );
  };

  const isInDecisionMode = (): boolean => {
    const currentGame = getCurrentTokenGame();
    return currentGame.pendingCandles.some((c) => c.status === 'decision');
  };

  const canMakePrediction = (prediction: MiniGamePrediction): boolean => {
    if (isInDecisionMode()) return false; // No predictions during decision mode

    const currentPrediction = getCurrentPrediction();
    if (!currentPrediction) return true; // No active prediction, can make any

    // Can only increase bet on same prediction
    return currentPrediction.prediction === prediction;
  };

  const getCurrentBetAmount = (): number => {
    const currentPrediction = getCurrentPrediction();
    return currentPrediction?.betAmount || 1;
  };

  const getTimeRemaining = (): number => {
    const currentGame = getCurrentTokenGame();
    const activePrediction = currentGame.pendingCandles.find(
      (c) => c.status === 'predicting'
    );
    const activeDecision = currentGame.pendingCandles.find(
      (c) => c.status === 'decision'
    );

    return (
      activePrediction?.timeRemaining || activeDecision?.timeRemaining || 0
    );
  };

  const makePrediction = (prediction: MiniGamePrediction) => {
    if (!prediction || !canMakePrediction(prediction)) return;

    const currentGame = getCurrentTokenGame();
    const existingPrediction = getCurrentPrediction();
    console.log('existingPrediction', existingPrediction);
    if (existingPrediction) {
      // Increase bet on same prediction
      increaseBet();
      return;
    }

    // Create new prediction candle
    const newCandle: PendingCandle = {
      id: `${Date.now()}-${Math.random()}`,
      prediction,
      betAmount: 1, // Start with $1
      status: 'predicting',
      timeRemaining: 50, // 50 seconds for prediction phase
    };

    setGameState((prev) => ({
      ...prev,
      tokenGames: {
        ...prev.tokenGames,
        [prev.selectedToken]: {
          ...currentGame,
          pendingCandles: [...currentGame.pendingCandles, newCandle],
        },
      },
    }));
  };

  const increaseBet = () => {
    const currentGame = getCurrentTokenGame();
    const existingPrediction = currentGame.pendingCandles.find(
      (c) => c.status === 'predicting'
    );

    if (!existingPrediction) return;

    setGameState((prev) => ({
      ...prev,
      tokenGames: {
        ...prev.tokenGames,
        [prev.selectedToken]: {
          ...currentGame,
          pendingCandles: currentGame.pendingCandles.map((candle) =>
            candle.id === existingPrediction.id
              ? { ...candle, betAmount: candle.betAmount + 1 }
              : candle
          ),
        },
      },
    }));
  };

  const resetGame = () => {
    const basePrices = { sol: 170, eth: 2500, btc: 65000 };

    setGameState((prev) => ({
      ...prev,
      tokenGames: {
        sol: createInitialTokenGame(basePrices.sol),
        eth: createInitialTokenGame(basePrices.eth),
        btc: createInitialTokenGame(basePrices.btc),
      },
    }));
  };

  const refreshCandles = () => {
    const currentGame = getCurrentTokenGame();
    const basePrices = { sol: 170, eth: 2500, btc: 65000 };
    const newCandles = generateDummyCandleData(
      10,
      basePrices[gameState.selectedToken]
    );

    setGameState((prev) => ({
      ...prev,
      tokenGames: {
        ...prev.tokenGames,
        [prev.selectedToken]: {
          ...currentGame,
          candles: newCandles,
        },
      },
    }));
  };

  // Helper function to generate a new candle with specific result
  const generateNewCandle = (
    lastCandle: CandleData,
    forceResult?: 'green' | 'red'
  ): CandleData => {
    const basePrice = lastCandle.close;
    const volatility = basePrice * 0.02; // 2% volatility

    const open = basePrice;
    let close: number;

    if (forceResult) {
      // Force the candle to be green or red
      const minChange = volatility * 0.1; // Minimum 0.1% change
      if (forceResult === 'green') {
        close = open + minChange + Math.random() * volatility * 0.5;
      } else {
        close = open - minChange - Math.random() * volatility * 0.5;
      }
    } else {
      // Natural random movement
      const priceChange = (Math.random() - 0.5) * volatility;
      close = open + priceChange;
    }

    const minOC = Math.min(open, close);
    const maxOC = Math.max(open, close);
    const wickRange = volatility * 0.3;

    const high = maxOC + Math.random() * wickRange;
    const low = minOC - Math.random() * wickRange;

    return {
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      timestamp: Date.now(),
    };
  };

  return (
    <MiniGameContext.Provider
      value={{
        gameState,
        selectedToken: gameState.selectedToken,
        setSelectedToken,
        getCurrentTokenGame,
        makePrediction,
        increaseBet,
        resetGame,
        refreshCandles,
        getCurrentPrediction,
        isInDecisionMode,
        canMakePrediction,
        getCurrentBetAmount,
        getTimeRemaining,
      }}
    >
      {children}
    </MiniGameContext.Provider>
  );
};
