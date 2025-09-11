export interface ChartBounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ChartData {
  x?: number;
  y: number;
}

export interface PricePositions {
  entryPrice: number;
  entryPriceY: number | null;
  isEntryPinnedAbove: boolean;
  isEntryPinnedBelow: boolean;
  isEntryInView: boolean;
  
  liquidationPrice: number;
  liquidationPriceY: number | null;
  isLiquidationPinnedAbove: boolean;
  isLiquidationPinnedBelow: boolean;
  isLiquidationInView: boolean;
  
  bothPinnedSameDirection: boolean;
  bothPinnedAbove: boolean;
  bothPinnedBelow: boolean;
}

const EDGE_BUFFER = 20;

export const calculateYPosition = (
  price: number,
  data: ChartData[],
  chartBounds: ChartBounds
): number | null => {
  if (price <= 0 || data.length === 0) return null;
  
  const yValues = data.map(d => d.y);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const chartHeight = chartBounds.bottom - chartBounds.top;
  const valueRange = yMax - yMin || 1;
  
  return chartBounds.top + ((yMax - price) / valueRange) * chartHeight;
};

export const calculatePricePositions = (
  entryPrice: number,
  liquidationPrice: number,
  data: ChartData[],
  chartBounds: ChartBounds,
  showLiquidation: boolean
): PricePositions => {
  const entryPriceY = calculateYPosition(entryPrice, data, chartBounds);
  const liquidationPriceY = showLiquidation 
    ? calculateYPosition(liquidationPrice, data, chartBounds) 
    : null;
  
  // Entry price pinning logic
  const isEntryPinnedAbove = entryPriceY !== null && entryPriceY < chartBounds.top;
  const isEntryPinnedBelow = entryPriceY !== null && entryPriceY > chartBounds.bottom;
  const isEntryInView = entryPriceY !== null && !isEntryPinnedAbove && !isEntryPinnedBelow;
  
  // Liquidation price pinning logic with edge buffer
  const isLiquidationActuallyAbove = liquidationPriceY !== null && liquidationPriceY < chartBounds.top;
  const isLiquidationActuallyBelow = liquidationPriceY !== null && liquidationPriceY > chartBounds.bottom;
  
  // Pin if outside view OR too close to edges
  const isLiquidationPinnedAbove = isLiquidationActuallyAbove || 
    (liquidationPriceY !== null && 
     liquidationPriceY >= chartBounds.top && 
     liquidationPriceY < chartBounds.top + EDGE_BUFFER);
     
  const isLiquidationPinnedBelow = isLiquidationActuallyBelow ||
    (liquidationPriceY !== null &&
     liquidationPriceY <= chartBounds.bottom &&
     liquidationPriceY > chartBounds.bottom - EDGE_BUFFER);
     
  const isLiquidationInView = liquidationPriceY !== null && 
    !isLiquidationPinnedAbove && 
    !isLiquidationPinnedBelow;
  
  // Check if both are pinned in same direction
  const bothPinnedAbove = isEntryPinnedAbove && isLiquidationPinnedAbove;
  const bothPinnedBelow = isEntryPinnedBelow && isLiquidationPinnedBelow;
  const bothPinnedSameDirection = bothPinnedAbove || bothPinnedBelow;
  
  return {
    entryPrice,
    entryPriceY,
    isEntryPinnedAbove,
    isEntryPinnedBelow,
    isEntryInView,
    
    liquidationPrice,
    liquidationPriceY,
    isLiquidationPinnedAbove,
    isLiquidationPinnedBelow,
    isLiquidationInView,
    
    bothPinnedSameDirection,
    bothPinnedAbove,
    bothPinnedBelow,
  };
};

export const getPinnedYPosition = (
  actualY: number | null,
  isPinnedAbove: boolean,
  isPinnedBelow: boolean,
  chartBounds: ChartBounds,
  offset: { top?: number; bottom?: number } = {}
): number => {
  if (actualY === null) return chartBounds.top;
  
  if (isPinnedAbove) {
    return chartBounds.top + (offset.top || 20);
  } else if (isPinnedBelow) {
    return chartBounds.bottom - (offset.bottom || 20);
  }
  
  return actualY;
};

export const formatPrice = (price: number) => {
  const decimalPlaces = price > 100000 ? 1 : 3;
  const formatted = price.toFixed(decimalPlaces);
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

/**
 * Calculate liquidation price based on position parameters
 *
 * @param entryPrice - Entry price of the position
 * @param leverage - Leverage used
 * @param direction - Trade direction (long/short)
 * @param maintenanceMargin - Maintenance margin ratio (default 0.5%)
 * @returns Liquidation price
 */
export const calculateLiquidationPrice = (
  entryPrice: number,
  leverage: number,
  direction: "LONG" | "SHORT",
  maintenanceMargin: number = 0.005
): number => {
  // Initial margin = 1 / leverage
  const initialMargin = 1 / leverage;

  // Maximum loss before liquidation
  const maxLoss = initialMargin - maintenanceMargin;

  if (direction === "LONG") {
    // Long position liquidates when price drops
    return entryPrice * (1 - maxLoss);
  } else {
    // Short position liquidates when price rises
    return entryPrice * (1 + maxLoss);
  }
};