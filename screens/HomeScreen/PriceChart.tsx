import { useState } from 'react';
import { Dimensions, Pressable } from 'react-native';

import rektBomb from '@/assets/images/app-pngs/rekt-bomb.png';
import FlagIcon from '@/assets/images/app-svgs/flag.svg';
import {
  BodyXSEmphasized,
  BodyXSMonoEmphasized,
  PulsatingContainer,
} from '@/components';
import { Trade, useHomeContext } from '@/contexts';
import {
  calculatePriceChange,
  getCurrentPriceFromHistorical,
  SupportedTimeframe,
  SupportedToken,
  useHistoricalDataQuery,
} from '@/utils';

import { EmojiContainer } from './EmojiContainer';
import { FloatingEmoji } from './FloatingEmoji';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-gifted-charts';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

// TODO - overflow hidden problems - rule lines go too far right and top is cut off

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
  const chartHeight = 200;
  const { selectedToken, selectedTimeframe, tokenPrices, openPositions } =
    useHomeContext();

  // Fetch historical chart data only if no dummy data is provided
  const {
    data: historicalData,
    isLoading: isChartLoading,
    error: chartError,
  } = useHistoricalDataQuery(
    selectedToken as SupportedToken,
    selectedTimeframe as SupportedTimeframe
  );

  // Floating emoji reactions state
  const [reactions, setReactions] = useState<{ id: string; emoji: string }[]>(
    []
  );
  const [isAnimating, setIsAnimating] = useState(false);

  // Handler to add a new floating emoji
  const handleEmojiReaction = (emoji: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setReactions((prev) => [...prev, { id, emoji }]);
    setIsAnimating(true);
  };

  // Use dummy data if provided, otherwise use real data or fallback to loading state
  const data = dummyData || historicalData || [];
  const chartWidth = Dimensions.get('window').width * 0.9 - 8;

  const dataValues = data.map((item: { value: number }) => item.value);

  // Get current price from real-time data or historical data
  const currentPrice =
    tokenPrices?.[selectedToken as SupportedToken]?.current_price ||
    getCurrentPriceFromHistorical(data);

  // Calculate price change percentage
  const { changePercent } = calculatePriceChange(data);

  // Find current position for this token to get real PnL
  const currentPosition = openPositions.find((position) => {
    const tokenMap = { sol: 'SOL-PERP', eth: 'ETH-PERP', btc: 'BTC-PERP' };
    return position.asset === tokenMap[selectedToken as keyof typeof tokenMap];
  });

  // Get liquidation price from real position data only
  const liquidationPrice = currentPosition?.liquidationPrice;

  // Use real entry price from backend position, fallback to trade state
  const entryPrice = currentPosition?.entryPrice || trade?.entryPrice || 0;

  // Calculate dynamic y-axis range to include all important prices
  const importantPrices = [
    ...dataValues, // Historical chart data
    currentPrice, // Current market price
    ...(entryPrice > 0 ? [entryPrice] : []), // Entry price if exists
    ...(liquidationPrice ? [liquidationPrice] : []), // Liquidation price if exists
  ].filter((price) => price > 0); // Remove any zero/invalid prices

  const actualMinValue = Math.min(...importantPrices);
  const actualMaxValue = Math.max(...importantPrices);

  // Add some padding (5%) to the range for better visualization
  const padding = (actualMaxValue - actualMinValue) * 0.05;
  const paddedMinValue = actualMinValue - padding;
  const paddedMaxValue = actualMaxValue + padding;
  const actualValueRange = paddedMaxValue - paddedMinValue;

  // Calculate positions for different price lines using the new padded range
  const calculateLinePosition = (price: number) => {
    const priceRatio = (price - paddedMinValue) / actualValueRange;
    const topOffset = 20;
    const bottomOffset = 20;
    const plotArea = chartHeight - topOffset - bottomOffset;
    return topOffset + plotArea * (1 - priceRatio);
  };

  const liquidationLineTop = liquidationPrice
    ? calculateLinePosition(liquidationPrice)
    : 0;
  const currentPriceLineTop = calculateLinePosition(currentPrice);
  const entryPriceLineTop = entryPrice ? calculateLinePosition(entryPrice) : 0;

  // Only show profit/loss styling when there's an actual open position or open trade
  const hasOpenTrade = (trade && trade.status === 'open') || currentPosition;

  // Determine if position is in profit or loss
  const isProfit = hasOpenTrade
    ? currentPosition
      ? currentPosition.pnl >= 0
      : trade && trade.status === 'open'
      ? (trade.side === 'long' && currentPrice > trade.entryPrice) ||
        (trade.side === 'short' && currentPrice < trade.entryPrice)
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

  // Show loading state if data is not available and no dummy data is provided
  if ((!dummyData && isChartLoading) || data.length === 0) {
    return (
      <Wrapper>
        <ChartContainer
          style={{
            height: chartHeight,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <BodyXSEmphasized style={{ color: theme.colors.textSecondary }}>
            {t('Loading chart data...')}
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
            height: chartHeight,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <BodyXSEmphasized style={{ color: theme.colors.textSecondary }}>
            {t('Failed to load chart data')}
          </BodyXSEmphasized>
        </ChartContainer>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <ChartContainer>
        <LineChart
          data={data}
          isAnimated
          animationDuration={1200}
          areaChart
          color={chartColor}
          thickness={2}
          startFillColor={fillColor}
          endFillColor={theme.colors.background}
          startOpacity={0.2}
          endOpacity={0.01}
          hideDataPoints
          yAxisColor='transparent'
          xAxisColor='transparent'
          rulesColor={theme.colors.secondary}
          noOfSections={4}
          backgroundColor='transparent'
          initialSpacing={0}
          yAxisOffset={paddedMinValue}
          width={chartWidth}
          height={chartHeight}
          hideYAxisText={true}
          adjustToWidth={false}
          parentWidth={chartWidth}
          stepHeight={chartHeight / 4}
          stepValue={actualValueRange / 4}
        />

        {/* Custom y-axis labels (now pressable as a group) */}
        <Pressable
          onPress={() => setShowPercent((prev) => !prev)}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 80,
            height: chartHeight,
          }}
          accessibilityRole='button'
          accessibilityLabel='Toggle price/percentage'
        >
          {Array.from({ length: 5 }, (_, i) => {
            const value = paddedMinValue + (actualValueRange * i) / 4;
            const sectionHeight = (chartHeight - 40) / 4;
            const yPosition = 20 + (4 - i) * sectionHeight;
            return (
              <YAxisLabel
                key={i}
                style={{
                  top: yPosition,
                  right: 5,
                }}
              >
                <BodyXSMonoEmphasized
                  style={{ color: theme.colors.textSecondary }}
                >
                  ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </BodyXSMonoEmphasized>
              </YAxisLabel>
            );
          })}
        </Pressable>

        <CurrentPriceLabel
          style={{
            top: currentPriceLineTop - 12,
            right: 15,
          }}
        >
          <CurrentPriceBubble $isProfit={hasOpenTrade ? isProfit : null}>
            <CurrentPriceText style={{ color: theme.colors.background }}>
              {/* Toggle between price and PnL percentage */}
              {showPercent && currentPosition
                ? currentPosition.pnl >= 0
                  ? `+${currentPosition.pnlPercentage.toFixed(2)}%`
                  : `${currentPosition.pnlPercentage.toFixed(2)}%`
                : showPercent && !currentPosition
                ? `${changePercent.toFixed(2)}%`
                : `$${currentPrice.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </CurrentPriceText>
          </CurrentPriceBubble>
        </CurrentPriceLabel>

        {/* Entry Price Line and Label (show only if there's an open position or open trade) */}
        {hasOpenTrade && entryPrice > 0 && (
          <>
            <EntryPriceLabel
              style={{
                top: entryPriceLineTop - 10,
                right: 15,
              }}
            >
              <EntryPriceBubble>
                <FlagIcon />
                <EntryPriceText style={{ color: theme.colors.textPrimary }}>
                  $
                  {entryPrice.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </EntryPriceText>
              </EntryPriceBubble>
            </EntryPriceLabel>
          </>
        )}

        {/* Liquidation Line and Label */}
        {showLiquidation && liquidationPrice && (
          <>
            <LiquidationLineContainer
              style={{
                top: liquidationLineTop,
                width: chartWidth - 80,
              }}
            >
              <PulsatingContainer
                duration={1000}
                style={{ position: 'absolute', top: -14, left: 0, zIndex: 20 }}
              >
                <Image source={rektBomb} style={{ width: 30, height: 30 }} />
              </PulsatingContainer>
              <LiquidationLine />
            </LiquidationLineContainer>

            <LiquidationLabel
              style={{
                top: liquidationLineTop - 10,
                right: 15,
              }}
            >
              <LiquidationText style={{ color: theme.colors.textPrimary }}>
                $
                {liquidationPrice.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </LiquidationText>
            </LiquidationLabel>
          </>
        )}
        {trade && trade.status === 'open' && (
          <EmojiContainer
            onEmojiPress={handleEmojiReaction}
            isAnimating={isAnimating}
          />
        )}
        {/* Floating emoji reactions */}
        {reactions.map(({ id, emoji }) => (
          <FloatingEmoji
            key={id}
            emoji={emoji}
            chartHeight={chartHeight}
            onDone={() => {
              setReactions((prev) => prev.filter((r) => r.id !== id));
              setIsAnimating(false);
            }}
          />
        ))}
      </ChartContainer>
    </Wrapper>
  );
};

const Wrapper = styled.View`
  align-items: center;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
  border-radius: 16px;
  padding: 16px;
`;

const ChartContainer = styled.View`
  position: relative;
  /* overflow: hidden; */
`;

const YAxisLabel = styled.View`
  position: absolute;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background}80;
  padding: 2px 6px;
  border-radius: 2px;
  z-index: 12;
  min-width: 70px;
  align-items: center;
`;

const CurrentPriceLabel = styled.View`
  position: absolute;
  z-index: 20;
`;

const CurrentPriceBubble = styled.View<{ $isProfit: boolean | null }>`
  padding: 4px 8px;
  border-radius: 12px;
  background-color: ${({
    theme,
    $isProfit,
  }: {
    theme: DefaultTheme;
    $isProfit: boolean | null;
  }) =>
    $isProfit === true
      ? theme.colors.profit
      : $isProfit === false
      ? theme.colors.loss
      : theme.colors.tint};
`;

const CurrentPriceText = styled.Text`
  font-size: 11px;
  font-weight: 600;
  font-family: 'Geist Mono';
`;

// Entry Price Styles
const EntryPriceLabel = styled.View`
  position: absolute;
  z-index: 16;
`;

const EntryPriceBubble = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.borderEmphasized};
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

const EntryPriceText = styled.Text`
  font-size: 11px;
  font-weight: 500;
  font-family: 'Geist Mono';
`;

// Liquidation Styles (existing)
const LiquidationLineContainer = styled.View`
  position: absolute;
  flex: 1;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  margin-left: 20px;
`;

const LiquidationLine = styled.View`
  flex: 1;
  height: 1px;
  border-width: 1px;
  border-style: dashed;
  border-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.liquidBorder};
  z-index: 10;
`;

const LiquidationLabel = styled.View`
  position: absolute;
  padding: 2px 6px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.liquidBorder};
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.liquidBg};
  z-index: 13;
`;

const LiquidationText = styled.Text`
  font-size: 12px;
  font-weight: 500;
  font-family: 'Geist Mono';
`;
