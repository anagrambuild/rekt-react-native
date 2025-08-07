import { createContext, useContext, useEffect, useState } from 'react';

import { CandleData } from '@/screens/MiniGameScreen/Candlestick';
import { generateDummyCandleData } from '@/screens/MiniGameScreen/CandlestickChart';

export type MiniGamePrediction = 'green' | 'red' | null;
export type MiniGameStatus =
  | 'waiting'
  | 'predicting'
  | 'revealing'
  | 'finished';
export type SupportedToken = 'sol' | 'eth' | 'btc';

export interface TokenGameState {
  candles: CandleData[];
  prediction: MiniGamePrediction;
  gameStatus: MiniGameStatus;
  timeRemaining: number;
  isGameActive: boolean;
  lastCandleResult: 'green' | 'red' | null;
}

export interface MiniGameState {
  selectedToken: SupportedToken;
  tokenGames: Record<SupportedToken, TokenGameState>;
  globalScore: number;
  globalStreak: number;
  totalGames: number;
  correctPredictions: number;
  betAmount: number;
  potentialWinnings: number;
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
  setBetAmount: (amount: number) => void;
  startNewGame: () => void;
  resetGame: () => void;
  refreshCandles: () => void;
}

// Helper function to create initial token game state
const createInitialTokenGame = (basePrice: number): TokenGameState => ({
  candles: generateDummyCandleData(10, basePrice),
  prediction: null,
  gameStatus: 'waiting',
  timeRemaining: 60,
  isGameActive: false,
  lastCandleResult: null,
});

const initialGameState: MiniGameState = {
  selectedToken: 'sol',
  tokenGames: {
    sol: createInitialTokenGame(170), // SOL ~$170
    eth: createInitialTokenGame(2500), // ETH ~$2500
    btc: createInitialTokenGame(105000), // BTC ~$65000
  },
  globalScore: 0,
  globalStreak: 0,
  totalGames: 0,
  correctPredictions: 0,
  betAmount: 1,
  potentialWinnings: 0,
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
  setBetAmount: () => {},
  startNewGame: () => {},
  resetGame: () => {},
  refreshCandles: () => {},
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

  // Timer for countdown - only for the selected token
  const currentGame = getCurrentTokenGame();
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (currentGame.isGameActive && currentGame.timeRemaining > 0) {
      interval = setInterval(() => {
        setGameState((prev) => {
          const currentTokenGame = prev.tokenGames[prev.selectedToken];
          const newTimeRemaining = currentTokenGame.timeRemaining - 1;

          // When timer reaches 0, reveal the result
          if (newTimeRemaining <= 0) {
            return {
              ...prev,
              tokenGames: {
                ...prev.tokenGames,
                [prev.selectedToken]: {
                  ...currentTokenGame,
                  timeRemaining: 0,
                  gameStatus: 'revealing',
                },
              },
            };
          }

          return {
            ...prev,
            tokenGames: {
              ...prev.tokenGames,
              [prev.selectedToken]: {
                ...currentTokenGame,
                timeRemaining: newTimeRemaining,
              },
            },
          };
        });
      }, 1000);
    }

    // Handle game result when revealing
    if (currentGame.gameStatus === 'revealing') {
      const revealTimeout = setTimeout(() => {
        finishGame();
      }, 2000); // Show result for 2 seconds

      return () => clearTimeout(revealTimeout);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.selectedToken, currentGame]);

  const makePrediction = (prediction: MiniGamePrediction) => {
    const currentGame = getCurrentTokenGame();
    if (currentGame.gameStatus !== 'waiting') return;

    const winnings = prediction ? gameState.betAmount * 1.8 : 0; // 1.8x multiplier

    setGameState((prev) => ({
      ...prev,
      potentialWinnings: winnings,
      tokenGames: {
        ...prev.tokenGames,
        [prev.selectedToken]: {
          ...currentGame,
          prediction,
          gameStatus: 'predicting',
          isGameActive: true,
        },
      },
    }));
  };

  const setBetAmount = (amount: number) => {
    const currentGame = getCurrentTokenGame();
    if (currentGame.isGameActive) return;

    const winnings = currentGame.prediction ? amount * 1.8 : 0;

    setGameState((prev) => ({
      ...prev,
      betAmount: Math.max(1, Math.min(100, amount)), // Clamp between $1-$100
      potentialWinnings: winnings,
    }));
  };

  const startNewGame = () => {
    const currentGame = getCurrentTokenGame();
    // Generate a new candle to add to the chart
    const newCandle = generateNewCandle(
      currentGame.candles[currentGame.candles.length - 1]
    );

    setGameState((prev) => ({
      ...prev,
      potentialWinnings: 0,
      tokenGames: {
        ...prev.tokenGames,
        [prev.selectedToken]: {
          ...currentGame,
          candles: [...currentGame.candles.slice(1), newCandle], // Remove first, add new
          prediction: null,
          gameStatus: 'waiting',
          timeRemaining: 60,
          isGameActive: false,
          lastCandleResult: null,
        },
      },
    }));
  };

  const resetGame = () => {
    const basePrices = { sol: 170, eth: 2500, btc: 65000 };

    setGameState((prev) => ({
      ...prev,
      globalScore: 0,
      globalStreak: 0,
      totalGames: 0,
      correctPredictions: 0,
      betAmount: 1,
      potentialWinnings: 0,
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
      20,
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

  const finishGame = () => {
    const currentGame = getCurrentTokenGame();
    if (!currentGame.prediction) {
      // No prediction made, just start new game
      startNewGame();
      return;
    }

    // Generate the final candle result
    const lastCandle = currentGame.candles[currentGame.candles.length - 1];
    const newCandle = generateNewCandle(lastCandle);
    const isGreen = newCandle.close > newCandle.open;
    const actualResult: 'green' | 'red' = isGreen ? 'green' : 'red';
    const isCorrect = currentGame.prediction === actualResult;

    // Update candles with the new result candle
    const updatedCandles = [...currentGame.candles.slice(1), newCandle];

    setGameState((prev) => ({
      ...prev,
      globalScore: isCorrect
        ? prev.globalScore + prev.betAmount * 0.8
        : prev.globalScore - prev.betAmount,
      globalStreak: isCorrect ? prev.globalStreak + 1 : 0,
      totalGames: prev.totalGames + 1,
      correctPredictions: isCorrect
        ? prev.correctPredictions + 1
        : prev.correctPredictions,
      tokenGames: {
        ...prev.tokenGames,
        [prev.selectedToken]: {
          ...currentGame,
          candles: updatedCandles,
          gameStatus: 'finished',
          lastCandleResult: actualResult,
        },
      },
    }));

    // Auto-start new game after showing result
    setTimeout(() => {
      startNewGame();
    }, 3000);
  };

  // Helper function to generate a new candle based on the last one
  const generateNewCandle = (lastCandle: CandleData): CandleData => {
    const basePrice = lastCandle.close;
    const volatility = basePrice * 0.02; // 2% volatility
    const trend = (Math.random() - 0.5) * volatility * 0.5;

    const open = basePrice;
    const priceChange = (Math.random() - 0.5) * volatility;
    const close = open + priceChange + trend;

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
        setBetAmount,
        startNewGame,
        resetGame,
        refreshCandles,
      }}
    >
      {children}
    </MiniGameContext.Provider>
  );
};
