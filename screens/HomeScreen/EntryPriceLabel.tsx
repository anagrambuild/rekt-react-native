import React from "react";

import { ChartBounds, PricePositions } from "@/utils/chartUtils";

import { PerformantTextLabel } from "./PerformantTextLabel";

interface EntryPriceLabelProps {
  pricePositions: PricePositions;
  chartBounds: ChartBounds;
  formatPrice: (price: number) => string;
}

export const EntryPriceLabel: React.FC<EntryPriceLabelProps> = ({
  pricePositions,
  chartBounds,
  formatPrice,
}) => {
  const {
    entryPrice,
    entryPriceY,
    isEntryPinnedAbove,
    isEntryPinnedBelow,
    isEntryInView,
  } = pricePositions;

  if (entryPrice <= 0 || entryPriceY === null) {
    return null;
  }

  // Determine label position and text
  let labelX = chartBounds.right + 10;
  let labelY = entryPriceY - 10;
  let labelText = formatPrice(entryPrice);

  if (isEntryPinnedAbove) {
    labelText = `↑ ` + labelText;
    labelX = chartBounds.right;
    labelY = chartBounds.top + 10;
  } else if (isEntryPinnedBelow) {
    labelText = `↓ ` + labelText;
    labelX = chartBounds.right;
    labelY = chartBounds.bottom - 30;
  }

  // Only show label when pinned or in view
  if (!isEntryInView && !isEntryPinnedAbove && !isEntryPinnedBelow) {
    return null;
  }

  return (
    <PerformantTextLabel text={labelText} x={labelX} y={labelY} type="dark" />
  );
};
