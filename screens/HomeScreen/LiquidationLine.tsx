import React, { useMemo } from "react";

import {
  ChartBounds,
  getPinnedYPosition,
  PricePositions,
} from "@/utils/chartUtils";

import {
  Circle,
  DashPathEffect,
  Paragraph,
  Path,
  Skia,
  useFonts,
} from "@shopify/react-native-skia";

import { PerformantTextLabel } from "./PerformantTextLabel";

interface LiquidationLineProps {
  pricePositions: PricePositions;
  chartBounds: ChartBounds;
  formatPrice?: (price: number) => string;
}

export const LiquidationLine: React.FC<LiquidationLineProps> = ({
  pricePositions,
  chartBounds,
  formatPrice = price => price.toFixed(2),
}) => {
  // Load custom fonts for bomb emoji
  const customFontMgr = useFonts({
    Geist: [require("@/assets/fonts/Geist-VariableFont_wght.ttf")],
  });

  // Create bomb emoji paragraph
  const bombParagraph = useMemo(() => {
    if (!customFontMgr) return null;
    const paragraph = Skia.ParagraphBuilder.Make({}, customFontMgr)
      .pushStyle({ fontSize: 16 })
      .addText("💣")
      .build();
    paragraph.layout(20);
    return paragraph;
  }, [customFontMgr]);

  const {
    liquidationPrice,
    liquidationPriceY,
    isLiquidationPinnedAbove,
    isLiquidationPinnedBelow,
    bothPinnedSameDirection,
    bothPinnedAbove,
    bothPinnedBelow,
  } = pricePositions;

  if (liquidationPrice <= 0 || liquidationPriceY === null) {
    return null;
  }

  // Get pinned Y position
  const pinnedY = getPinnedYPosition(
    liquidationPriceY,
    isLiquidationPinnedAbove,
    isLiquidationPinnedBelow,
    chartBounds
  );

  // Position bomb emoji
  const bombX = chartBounds.left + 20;

  // Show label on line when both are pinned in same direction
  const shouldShowLabelOnLine = bothPinnedSameDirection;
  let labelTextWidth = 0;

  if (shouldShowLabelOnLine) {
    const labelText = `${
      bothPinnedAbove ? "↑ " : bothPinnedBelow ? "↓ " : ""
    }${formatPrice(liquidationPrice)}`;
    labelTextWidth = labelText.length * 6; // Text width estimate
  }

  // Always use red color for liquidation line
  const lineColor = "rgba(255, 87, 34, 0.5)";

  return (
    <>
      {/* Dashed liquidation line */}
      <Path
        path={
          shouldShowLabelOnLine
            ? `M ${chartBounds.left + 40} ${pinnedY} L ${
                chartBounds.right - labelTextWidth - 20
              } ${pinnedY}`
            : `M ${chartBounds.left + 40} ${pinnedY} L ${
                chartBounds.right
              } ${pinnedY}`
        }
        color={lineColor}
        style="stroke"
        strokeWidth={3}
      >
        <DashPathEffect intervals={[3, 8]} />
      </Path>

      {/* Bomb emoji background circle */}
      <Circle
        cx={bombX}
        cy={pinnedY}
        r={15}
        color="rgba(255, 87, 34, 0.2)"
        style="fill"
      />

      {/* Bomb emoji border circle */}
      <Circle
        cx={bombX}
        cy={pinnedY}
        r={15}
        color="#FF5722"
        style="stroke"
        strokeWidth={1}
      />

      {/* Bomb emoji */}
      {bombParagraph && (
        <Paragraph
          paragraph={bombParagraph}
          x={bombX - 8}
          y={pinnedY - 14}
          width={20}
        />
      )}

      {/* Show price label on the line when entry is also pinned */}
      {shouldShowLabelOnLine &&
        (() => {
          const labelText = `${
            bothPinnedAbove ? "↑ " : bothPinnedBelow ? "↓ " : ""
          }${formatPrice(liquidationPrice)}`;
          // Estimate text width (roughly 7-8 pixels per character for this font size)
          const estimatedWidth = labelText.length * 6;
          // Position from the right edge with padding
          const xPosition = chartBounds.right - estimatedWidth - 15;

          return (
            <PerformantTextLabel
              x={xPosition}
              y={pinnedY - 10}
              text={labelText}
              type="red"
            />
          );
        })()}
    </>
  );
};
