import { Dimensions } from "react-native";

import { BodyXSMonoEmphasized } from "@/components";
import { Trade } from "@/contexts";

import { LineChart } from "react-native-gifted-charts";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

interface TradeActivityChartProps {
  trade: Trade;
  symbol: "btc" | "eth" | "sol";
}

export const TradeActivityChart = ({
  trade,
  symbol,
}: TradeActivityChartProps) => {
  const theme = useTheme();
  const chartHeight = 120; // Smaller height for modal

  // Generate simple mock data for the chart
  // In a real app, this would fetch historical price data for the trade period
  const generateMockData = (basePrice: number) => {
    const data = [];
    for (let i = 0; i < 10; i++) {
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      data.push({
        value: basePrice * (1 + variation),
        timestamp: Date.now() - (9 - i) * 60000, // 1 minute intervals
      });
    }
    return data;
  };

  // Use entry price from trade as base price, with fallback values
  const basePrice =
    trade?.entryPrice ||
    (symbol === "sol" ? 150 : symbol === "eth" ? 2500 : 45000);
  const data = generateMockData(basePrice);

  const chartWidth = Dimensions.get("window").width * 0.8 - 62; // Adjusted for modal

  const findYAxisOffset = (arr: number[]) => {
    if (!arr || arr.length === 0) return undefined;
    return Math.min(...arr);
  };

  const dataValues = data.map(item => item.value);
  const yAxisOffset = findYAxisOffset(dataValues);

  // Calculate the position of entry price line
  const actualMinValue = yAxisOffset || Math.min(...dataValues);
  const actualMaxValue = Math.max(...dataValues);
  const actualValueRange = actualMaxValue - actualMinValue;

  const calculateLinePosition = (price: number) => {
    const priceRatio = (price - actualMinValue) / actualValueRange;
    const topOffset = 10;
    const bottomOffset = 10;
    const plotArea = chartHeight - topOffset - bottomOffset;
    return topOffset + plotArea * (1 - priceRatio);
  };

  const entryPriceLineTop = calculateLinePosition(trade.entryPrice);

  // Set chart color based on trade side and current status
  let chartColor = theme.colors.tint;
  let fillColor = theme.colors.tint;

  if (trade.status === "closed") {
    // For closed trades, we'll use a neutral color or base it on the final outcome
    chartColor = theme.colors.textSecondary;
    fillColor = theme.colors.textSecondary;
  } else {
    // For open trades, use profit/loss colors (this would need to be calculated based on current price)
    chartColor = theme.colors.profit;
    fillColor = theme.colors.profit;
  }

  return (
    <ChartContainer>
      <LineChart
        data={data}
        isAnimated
        animationDuration={800}
        areaChart
        color={chartColor}
        thickness={1.5}
        startFillColor={fillColor}
        endFillColor={theme.colors.background}
        startOpacity={0.15}
        endOpacity={0.01}
        hideDataPoints
        yAxisColor="transparent"
        xAxisColor="transparent"
        rulesColor={theme.colors.secondary + "40"}
        noOfSections={3}
        backgroundColor="transparent"
        initialSpacing={0}
        yAxisOffset={yAxisOffset}
        width={chartWidth}
        height={chartHeight}
        hideYAxisText={true}
        adjustToWidth={false}
        parentWidth={chartWidth}
        stepHeight={chartHeight / 3}
        stepValue={
          (Math.max(...dataValues) - (yAxisOffset || Math.min(...dataValues))) /
          3
        }
      />

      {/* Custom y-axis labels */}
      {Array.from({ length: 4 }, (_, i) => {
        const value = actualMinValue + (actualValueRange * i) / 3;
        const sectionHeight = (chartHeight - 20) / 3;
        const yPosition = 10 + (3 - i) * sectionHeight;
        return (
          <YAxisLabel
            key={i}
            style={{
              top: yPosition,
              right: 0,
            }}
          >
            <BodyXSMonoEmphasized style={{ color: theme.colors.textSecondary }}>
              {value.toFixed(0)}
            </BodyXSMonoEmphasized>
          </YAxisLabel>
        );
      })}

      {/* Entry Price Line and Label */}
      <EntryPriceLabel
        style={{
          top: entryPriceLineTop - 8,
          right: 10,
        }}
      >
        <EntryPriceBubble>
          <EntryPriceText style={{ color: theme.colors.textPrimary }}>
            ${trade.entryPrice.toFixed(2)}
          </EntryPriceText>
        </EntryPriceBubble>
      </EntryPriceLabel>

      {/* Entry Price Line */}
      <EntryPriceLine
        style={{
          top: entryPriceLineTop,
          width: chartWidth - 60,
        }}
      />
    </ChartContainer>
  );
};

const ChartContainer = styled.View`
  position: relative;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
`;

const YAxisLabel = styled.View`
  position: absolute;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background}80;
  padding: 2px 4px;
  border-radius: 2px;
  z-index: 12;
`;

const EntryPriceLabel = styled.View`
  position: absolute;
  z-index: 16;
`;

const EntryPriceBubble = styled.View`
  padding: 2px 6px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.borderEmphasized};
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

const EntryPriceText = styled.Text`
  font-size: 10px;
  font-weight: 500;
  font-family: "Geist Mono";
`;

const EntryPriceLine = styled.View`
  position: absolute;
  height: 1px;
  border-width: 1px;
  border-style: dashed;
  border-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.textSecondary};
  z-index: 10;
`;
