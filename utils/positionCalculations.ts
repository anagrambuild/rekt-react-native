import { Position } from "./backendApi";

/**
 * Calculate PnL for a trading position with leverage
 * @param entryPrice - Price when position was opened
 * @param currentPrice - Current market price from Pyth oracle
 * @param collateral - Collateral amount (backend value, needs to be multiplied by 100 for actual USDC)
 * @param leverage - Leverage multiplier (e.g., 50 for 50x leverage)
 * @param direction - "LONG" or "SHORT"
 * @returns PnL value in USDC
 */
export const calculatePnL = (
  entryPrice: number,
  currentPrice: number,
  collateral: number,
  leverage: number = 1,
  direction: "LONG" | "SHORT"
): number => {
  // Convert backend collateral to actual USDC amount (multiply by 100)
  const actualCollateral = collateral * 100;
  
  // Calculate position size with leverage
  const positionSize = actualCollateral * leverage;

  // Calculate asset quantity (how much of the asset we actually hold)
  const assetQuantity = positionSize / entryPrice;

  // Calculate PnL based on direction
  let pnl: number;
  if (direction === "LONG") {
    // Long: profit when current price > entry price
    pnl = (currentPrice - entryPrice) * assetQuantity;
  } else {
    // Short: profit when current price < entry price
    pnl = (entryPrice - currentPrice) * assetQuantity;
  }

  return Number(pnl.toFixed(6)); // Round to 6 decimal places for precision
};

/**
 * Calculate PnL percentage for a trading position with leverage
 * @param entryPrice - Price when position was opened
 * @param currentPrice - Current market price from Pyth oracle
 * @param collateral - Collateral amount (backend value, needs to be multiplied by 100 for actual USDC)
 * @param leverage - Leverage multiplier (e.g., 50 for 50x leverage)
 * @param direction - "LONG" or "SHORT"
 * @returns PnL percentage based on initial collateral investment
 */
export const calculatePnLPercentage = (
  entryPrice: number,
  currentPrice: number,
  collateral: number,
  leverage: number = 1,
  direction: "LONG" | "SHORT"
): number => {
  // Convert backend collateral to actual USDC amount (multiply by 100)
  const actualCollateral = collateral * 100;
  
  const pnl = calculatePnL(
    entryPrice,
    currentPrice,
    collateral,
    leverage,
    direction
  );

  if (actualCollateral === 0) return 0;

  // PnL percentage is based on the initial collateral investment, not the leveraged position size
  const pnlPercentage = (pnl / actualCollateral) * 100;

  return Number(pnlPercentage.toFixed(2)); // Round to 2 decimal places for display
};

/**
 * Calculate current value of a position (initial collateral investment + PnL)
 * @param entryPrice - Price when position was opened
 * @param currentPrice - Current market price from Pyth oracle
 * @param collateral - Collateral amount (backend value, needs to be multiplied by 100 for actual USDC)
 * @param leverage - Leverage multiplier (e.g., 50 for 50x leverage)
 * @param direction - "LONG" or "SHORT"
 * @returns Current value in USDC (what the investment is worth now)
 */
export const calculateCurrentValue = (
  entryPrice: number,
  currentPrice: number,
  collateral: number,
  leverage: number = 1,
  direction: "LONG" | "SHORT"
): number => {
  // Convert backend collateral to actual USDC amount (multiply by 100)
  const actualCollateral = collateral * 100;
  
  const pnl = calculatePnL(
    entryPrice,
    currentPrice,
    collateral,
    leverage,
    direction
  );

  // Current value = initial investment + PnL
  return Number((actualCollateral + pnl).toFixed(6));
};

/**
 * Update a position with calculated PnL values using current market price
 * @param position - Position object to update
 * @param currentPrice - Current market price from Pyth oracle
 * @returns Updated position with calculated pnl and pnlPercentage
 */
export const updatePositionWithCalculatedPnL = (
  position: Position,
  currentPrice: number
): Position => {
  // Use leverage from position, default to 1x if undefined
  const leverage = position.leverage || 1;

  const pnl = calculatePnL(
    position.entryPrice,
    currentPrice,
    position.size,
    leverage,
    position.direction
  );

  const pnlPercentage = calculatePnLPercentage(
    position.entryPrice,
    currentPrice,
    position.size,
    leverage,
    position.direction
  );

  return {
    ...position,
    currentPrice,
    pnl,
    pnlPercentage,
  };
};

/**
 * Calculate position duration in seconds
 * @param openedAt - ISO timestamp when position was opened
 * @returns Duration in seconds
 */
export const calculatePositionDuration = (openedAt: string): number => {
  const openTime = new Date(openedAt).getTime();
  const currentTime = Date.now();
  const durationMs = currentTime - openTime;

  return Math.floor(durationMs / 1000); // Return seconds
};

/**
 * Format duration in seconds to human readable string
 * @param durationSeconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m", "45s")
 */
export const formatDuration = (durationSeconds: number): string => {
  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

// =============================================================================
// UI-FRIENDLY WRAPPER FUNCTIONS
// These functions expect values that have already been converted for UI display
// (i.e., USDC amounts already multiplied by 100)
// =============================================================================

/**
 * Calculate PnL for a trading position (UI-friendly version)
 * @param entryPrice - Price when position was opened
 * @param currentPrice - Current market price from Pyth oracle
 * @param usdcAmount - USDC amount already converted for UI (multiplied by 100)
 * @param leverage - Leverage multiplier (e.g., 50 for 50x leverage)
 * @param direction - "LONG" or "SHORT"
 * @returns PnL value in USDC
 */
export const calculatePnLFromUI = (
  entryPrice: number,
  currentPrice: number,
  usdcAmount: number,
  leverage: number = 1,
  direction: "LONG" | "SHORT"
): number => {
  // Convert UI amount back to backend format for internal calculation
  return calculatePnL(entryPrice, currentPrice, usdcAmount / 100, leverage, direction);
};

/**
 * Calculate PnL percentage for a trading position (UI-friendly version)
 * @param entryPrice - Price when position was opened
 * @param currentPrice - Current market price from Pyth oracle
 * @param usdcAmount - USDC amount already converted for UI (multiplied by 100)
 * @param leverage - Leverage multiplier (e.g., 50 for 50x leverage)
 * @param direction - "LONG" or "SHORT"
 * @returns PnL percentage based on initial collateral investment
 */
export const calculatePnLPercentageFromUI = (
  entryPrice: number,
  currentPrice: number,
  usdcAmount: number,
  leverage: number = 1,
  direction: "LONG" | "SHORT"
): number => {
  return calculatePnLPercentage(entryPrice, currentPrice, usdcAmount / 100, leverage, direction);
};

/**
 * Calculate current value of a position (UI-friendly version)
 * @param entryPrice - Price when position was opened
 * @param currentPrice - Current market price from Pyth oracle
 * @param usdcAmount - USDC amount already converted for UI (multiplied by 100)
 * @param leverage - Leverage multiplier (e.g., 50 for 50x leverage)
 * @param direction - "LONG" or "SHORT"
 * @returns Current value in USDC (what the investment is worth now)
 */
export const calculateCurrentValueFromUI = (
  entryPrice: number,
  currentPrice: number,
  usdcAmount: number,
  leverage: number = 1,
  direction: "LONG" | "SHORT"
): number => {
  return calculateCurrentValue(entryPrice, currentPrice, usdcAmount / 100, leverage, direction);
};

/**
 * Calculate all position metrics at once (UI-friendly version)
 * @param entryPrice - Price when position was opened
 * @param currentPrice - Current market price from Pyth oracle
 * @param usdcAmount - USDC amount already converted for UI (multiplied by 100)
 * @param leverage - Leverage multiplier (e.g., 50 for 50x leverage)
 * @param direction - "LONG" or "SHORT"
 * @returns Object with calculated pnl, pnlPercentage, currentValue, and isProfit
 */
export const calculatePositionMetricsFromUI = (
  entryPrice: number,
  currentPrice: number,
  usdcAmount: number,
  leverage: number = 1,
  direction: "LONG" | "SHORT"
) => {
  const pnl = calculatePnLFromUI(entryPrice, currentPrice, usdcAmount, leverage, direction);
  const pnlPercentage = calculatePnLPercentageFromUI(entryPrice, currentPrice, usdcAmount, leverage, direction);
  const currentValue = calculateCurrentValueFromUI(entryPrice, currentPrice, usdcAmount, leverage, direction);
  
  return {
    pnl,
    pnlPercentage,
    currentValue,
    isProfit: pnl >= 0,
  };
};
