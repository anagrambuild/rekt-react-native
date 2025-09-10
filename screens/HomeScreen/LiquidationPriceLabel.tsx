import React from "react";

import { ChartBounds, PricePositions } from "@/utils/chartUtils";

import { SkiaTextLabel } from "./SkiaTextLabel";

interface LiquidationPriceLabelProps {
  pricePositions: PricePositions;
  chartBounds: ChartBounds;
  formatPrice: (price: number) => string;
}

export const LiquidationPriceLabel: React.FC<LiquidationPriceLabelProps> = ({
  pricePositions,
  chartBounds,
  formatPrice,
}) => {
  const {
    liquidationPrice,
    liquidationPriceY,
    isLiquidationPinnedAbove,
    isLiquidationPinnedBelow,
    bothPinnedSameDirection,
  } = pricePositions;

  if (liquidationPriceY === null || liquidationPrice <= 0) {
    return null;
  }

  // Check if actually outside view (for arrows)
  const isActuallyAbove = liquidationPriceY < chartBounds.top;
  const isActuallyBelow = liquidationPriceY > chartBounds.bottom;

  // Calculate label position
  let labelText: string = formatPrice(liquidationPrice);
  let labelX: number;
  let labelY: number;

  if (bothPinnedSameDirection && liquidationPriceY !== null) {
    // When both are pinned in same direction, show liquidation on its actual line position
    // Place it on the line, but ensure it's visible
    labelX = chartBounds.right - 70;
    // Clamp Y to be within visible bounds
    labelY = liquidationPriceY;
  } else if (isLiquidationPinnedAbove) {
    // Pin to top - only show arrow if actually outside view
    labelText = isActuallyAbove ? `↑ ${labelText}` : labelText;
    labelX = isActuallyAbove ? chartBounds.right : chartBounds.right + 12;
    labelY = chartBounds.top + 10;
  } else if (isLiquidationPinnedBelow) {
    // Pin to bottom - only show arrow if actually outside view
    labelText = isActuallyBelow ? `↓ ${labelText}` : labelText;
    labelX = isActuallyBelow ? chartBounds.right : chartBounds.right + 12;
    labelY = chartBounds.bottom - 30;
  } else {
    // Normal position when safely in view
    labelX = chartBounds.right + 10;
    labelY = liquidationPriceY - 9;
  }

  return <SkiaTextLabel text={labelText} x={labelX} y={labelY} type="red" />;
};
