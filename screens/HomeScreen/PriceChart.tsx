import { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { BodyXSEmphasized } from "@/components";
import { Trade, useHomeContext } from "@/contexts";
import {
  calculatePriceChange,
  getCurrentPriceFromHistorical,
  SupportedTimeframe,
  SupportedToken,
  useHistoricalDataQuery,
} from "@/utils";
import { calculatePricePositions } from "@/utils/chartUtils";

import {
  DashPathEffect,
  LinearGradient,
  useFont,
  vec,
} from "@shopify/react-native-skia";

import { EntryPriceLabel } from "./EntryPriceLabel";
import { LiquidationLine } from "./LiquidationLine";
import { LiquidationPriceLabel } from "./LiquidationPriceLabel";
import { PerformantTextLabel } from "./PerformantTextLabel";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme } from "styled-components/native";
import {
  Area,
  CartesianChart,
  Line,
  Scatter,
  useChartPressState,
} from "victory-native";

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

export const PriceChart = ({
  showLiquidation = false,
  trade = null,
  dummyData,
}: {
  showLiquidation?: boolean;
  trade?: Trade | null;
  dummyData?: { value: number; timestamp: number }[];
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [chartHeight] = useState(200);
  const { selectedToken, selectedTimeframe, tokenPrices, openPositions } =
    useHomeContext();

  // Initialize chart press state here (before any conditional returns)
  const chartPressState = useChartPressState({
    x: 0,
    y: { y: 0 },
  });

  // Fetch historical chart data only if no dummy data is provided
  const {
    data: historicalData,
    isLoading: isChartLoading,
    error: chartError,
  } = useHistoricalDataQuery(
    selectedToken as SupportedToken,
    selectedTimeframe as SupportedTimeframe
  );

  // Use dummy data if provided, otherwise use real data or fallback to loading state
  const data = dummyData || historicalData || [];

  // Get current price from data to match the chart data
  const currentPrice = data.length > 0 ? data[data.length - 1].value : 0;

  // Calculate price change percentage
  const { changePercent } = calculatePriceChange(data);

  // Find current position for this token to get real PnL
  const currentPosition = openPositions.find(position => {
    const tokenMap = { sol: "SOL", eth: "ETH", btc: "BTC" };
    return position.market === tokenMap[selectedToken as keyof typeof tokenMap];
  });

  const tradeDirection = currentPosition?.direction || trade?.side;
  const entryPrice =
    currentPosition?.entryPrice ||
    (trade?.entryPrice && trade.entryPrice > 0 ? trade.entryPrice : 0);
  const leverage = currentPosition?.leverage || trade?.leverage || 1;

  // Calculate liquidation price
  const liquidationPrice =
    currentPosition?.liquidationPrice ||
    (tradeDirection && leverage > 1
      ? calculateLiquidationPrice(
          entryPrice > 0 ? entryPrice : currentPrice,
          leverage,
          tradeDirection
        )
      : 0);

  // Only show profit/loss styling when there's an actual open position or open trade
  const hasOpenTrade = (trade && trade.status === "open") || currentPosition;

  // Determine if position is in profit or loss
  const isProfit = hasOpenTrade
    ? currentPosition
      ? currentPosition.pnl >= 0
      : trade && trade.status === "open"
      ? (trade.side === "LONG" && currentPrice > trade.entryPrice) ||
        (trade.side === "SHORT" && currentPrice < trade.entryPrice)
      : null
    : null;

  // Set chart color - only apply profit/loss colors when there's an open trade/position
  let chartColor = theme.colors.tint;
  let fillColor = theme.colors.tint;
  if (hasOpenTrade && isProfit !== null) {
    if (isProfit === true) {
      chartColor = theme.colors.profit;
      fillColor = theme.colors.profit;
    } else if (isProfit === false) {
      chartColor = theme.colors.loss;
      fillColor = theme.colors.loss;
    }
  }

  // Toggle state for price/percentage view
  const [showPercent, setShowPercent] = useState(false);

  // Toggle percentage display when chart is pressed
  const handleChartPress = () => {
    setShowPercent(prev => !prev);
  };

  // Load font for chart
  const font = useFont(
    require("@/assets/fonts/Geist-VariableFont_wght.ttf"),
    12
  );

  // Format data for Victory Native (requires x and y fields)
  const chartData = data.map((item, index) => ({
    x: index,
    y: item.value,
  }));

  // Calculate price proximity for dynamic zoom - must be before any returns
  const priceProximityRatio = useMemo(() => {
    if (!liquidationPrice || !currentPrice || !showLiquidation) return 1;
    return Math.abs(currentPrice - liquidationPrice) / currentPrice;
  }, [currentPrice, liquidationPrice, showLiquidation]);

  // Check if liquidation would be pinned
  const yValues = chartData.map(d => d.y);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const yRange = yMax - yMin;

  const isCloseRange = priceProximityRatio < 0.05; // Within 5%
  const isMediumRange = priceProximityRatio < 0.15; // Within 15%

  // Check if liquidation is off the chart (with buffer)
  const bufferRatio = 0.2; // 20% buffer
  const isLiquidationAbove =
    liquidationPrice > 0 &&
    showLiquidation &&
    liquidationPrice > yMax + yRange * bufferRatio;
  const isLiquidationBelow =
    liquidationPrice > 0 &&
    showLiquidation &&
    liquidationPrice < yMin - yRange * bufferRatio;

  // Dynamic domain calculation for zoom
  const getDynamicDomain = (): [number, number] => {
    if (!showLiquidation || !liquidationPrice) {
      // Default domain when no liquidation
      return [yMin - yRange * 0.1, yMax + yRange * 0.1] as [number, number];
    }

    // When liquidation is visible and close to current price
    if (!isLiquidationAbove && !isLiquidationBelow) {
      if (isCloseRange) {
        // Tight zoom around current price and liquidation
        const center = (currentPrice + liquidationPrice) / 2;
        const zoomRange = Math.abs(currentPrice - liquidationPrice) * 2;
        return [center - zoomRange, center + zoomRange] as [number, number];
      } else if (isMediumRange) {
        // Medium zoom
        const center = (currentPrice + liquidationPrice) / 2;
        const zoomRange = Math.abs(currentPrice - liquidationPrice) * 3;
        return [center - zoomRange, center + zoomRange] as [number, number];
      }
    }

    // Default domain - don't extend for pinned liquidation
    return [yMin - yRange * 0.1, yMax + yRange * 0.1] as [number, number];
  };

  // Dynamic domain padding based on proximity and pinned state
  let domainPaddingTop = 10;
  let domainPaddingBottom = 10;

  // Add extra padding when liquidation is pinned to prevent label overlap
  if (showLiquidation && liquidationPrice > 0) {
    if (isLiquidationAbove) {
      // Extra padding at top when liquidation is pinned above
      domainPaddingTop = 40;
    } else if (isLiquidationBelow) {
      // Extra padding at bottom when liquidation is pinned below
      domainPaddingBottom = 40;
    }
  }

  // Show loading state if data is not available and no dummy data is provided
  if ((!dummyData && isChartLoading) || data.length === 0 || !font) {
    return (
      <Wrapper>
        <ChartContainer
          style={{
            height: chartHeight,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <BodyXSEmphasized style={{ color: theme.colors.textSecondary }}>
            {t("Loading chart data...")}
          </BodyXSEmphasized>
        </ChartContainer>
      </Wrapper>
    );
  }

  // Show error state only if no dummy data is provided
  if (!dummyData && chartError) {
    return (
      <Wrapper>
        <ChartContainer
          style={{
            flex: 1,
            minHeight: chartHeight,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <BodyXSEmphasized style={{ color: theme.colors.textSecondary }}>
            {t("Failed to load chart data")}
          </BodyXSEmphasized>
        </ChartContainer>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <ChartContainer>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["y"]}
          padding={styles.chartPadding}
          domainPadding={{
            top: domainPaddingTop,
            bottom: domainPaddingBottom,
            right: 8, // the last point
          }}
          domain={{
            y: getDynamicDomain(),
          }}
          chartPressState={chartPressState.state}
          yAxis={[
            {
              labelOffset: 15,
              labelColor: "rgba(255, 255, 255, 0.6)",
              tickCount: 5,
              font: font,
              labelPosition: "outset",
              axisSide: "right",
              enableRescaling: true,
              formatYLabel: value => {
                if (typeof value === "number") {
                  return formatPrice(value);
                }
                return String(value);
              },
            },
          ]}
          renderOutside={({ points, chartBounds }) => {
            const visiblePoints =
              points.y?.filter(
                p => p && p.x !== undefined && p.y !== undefined
              ) || [];
            const lastPoint = visiblePoints[visiblePoints.length - 1];

            // Calculate all price positions centrally
            const pricePositions = calculatePricePositions(
              entryPrice,
              liquidationPrice,
              chartData,
              chartBounds,
              showLiquidation
            );

            return (
              <>
                {/* Entry Price Label */}
                <EntryPriceLabel
                  pricePositions={pricePositions}
                  chartBounds={chartBounds}
                  formatPrice={formatPrice}
                />

                {/* Liquidation Price Label - only show if not handled by LiquidationLine */}
                {!pricePositions.bothPinnedSameDirection && (
                  <LiquidationPriceLabel
                    pricePositions={pricePositions}
                    chartBounds={chartBounds}
                    formatPrice={formatPrice}
                  />
                )}

                {/* Current price dot and label */}
                {lastPoint && lastPoint.x != null && lastPoint.y != null && (
                  <PerformantTextLabel
                    text={
                      showPercent && currentPosition
                        ? `${
                            currentPosition.pnl >= 0 ? "+" : ""
                          }${currentPosition.pnlPercentage.toFixed(1)}%`
                        : showPercent
                        ? `${
                            changePercent >= 0 ? "+" : ""
                          }${changePercent.toFixed(1)}%`
                        : formatPrice(currentPrice)
                    }
                    x={chartBounds.right + 10}
                    y={lastPoint.y - 10}
                    type="white"
                  />
                )}
              </>
            );
          }}
        >
          {({ points, chartBounds }) => (
            <>
              <Area
                points={points.y}
                y0={chartBounds.bottom}
                color={chartColor}
                curveType="natural"
                animate={{ type: "timing", duration: 60 }}
              >
                <LinearGradient
                  start={vec(0, chartBounds.top)}
                  end={vec(0, chartBounds.bottom)}
                  colors={[
                    `${fillColor}40`, // More opacity at top (40% = 66/255)
                    `${fillColor}20`, // Mid-range opacity
                    `${fillColor}08`, // Very subtle at bottom
                    `${fillColor}00`, // Fully transparent at bottom
                  ]}
                  positions={[0, 0.3, 0.7, 1]}
                />
              </Area>

              <Line
                points={points.y}
                color={chartColor}
                strokeWidth={2}
                curveType="natural"
                animate={{ type: "timing", duration: 60 }}
              />

              <Scatter
                points={[points.y[points.y.length - 1]]}
                radius={8}
                style="fill"
                color={`${chartColor}30`}
                animate={{ type: "timing", duration: 60 }}
              />
              <Scatter
                points={[points.y[points.y.length - 1]]}
                radius={5}
                style="fill"
                color={chartColor}
                animate={{ type: "timing", duration: 60 }}
              />

              {/* Liquidation Line */}
              <LiquidationLine
                pricePositions={calculatePricePositions(
                  entryPrice,
                  liquidationPrice,
                  chartData,
                  chartBounds,
                  showLiquidation
                )}
                chartBounds={chartBounds}
                formatPrice={formatPrice}
              />
            </>
          )}
        </CartesianChart>

        {/* Pressable overlay for current price label */}
        <Pressable
          onPress={handleChartPress}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 100,
            justifyContent: "center",
            alignItems: "flex-end",
            zIndex: 100,
          }}
        />
      </ChartContainer>
    </Wrapper>
  );
};

const Wrapper = styled.View`
  flex: 1;
  min-height: 200px;
  width: 100%;
  overflow: hidden;
  align-items: center;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
  border-radius: 16px;
`;

const ChartContainer = styled.View`
  min-height: 200px;
  width: 100%;
  flex: 1;
  position: relative;
  width: 100%;
`;

const styles = StyleSheet.create({
  chartPadding: {
    left: 0,
    right: 10,
    top: 0,
    bottom: -41,
  },
});
