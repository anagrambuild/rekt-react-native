import { useState } from 'react';
import { Dimensions, Pressable } from 'react-native';

import rektBomb from '@/assets/images/app-pngs/rekt-bomb.png';
import FlagIcon from '@/assets/images/app-svgs/flag.svg';
import { BodyXSMonoEmphasized, PulsatingContainer } from '@/components';
import { Trade, useHomeContext } from '@/contexts';

import { EmojiContainer } from './EmojiContainer';
import { FloatingEmoji } from './FloatingEmoji';
import {
  btcPriceData,
  currentPrices,
  ethPriceData,
  liquidationPrices,
  solPriceData,
} from './mockData';
import { Image } from 'expo-image';
import { LineChart } from 'react-native-gifted-charts';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

// TODO - overflow hidden problems - rule lines go too far right and top is cut off

export const PriceChart = ({
  showLiquidation = false,
  trade = null,
}: {
  showLiquidation?: boolean;
  trade?: Trade | null;
}) => {
  const theme = useTheme();
  const chartHeight = 200;
  const { selectedToken } = useHomeContext();

  // Floating emoji reactions state
  const [reactions, setReactions] = useState<{ id: string; emoji: string }[]>(
    []
  );
  const [isAnimating, setIsAnimating] = useState(false);

  // Handler to add a new floating emoji
  const handleEmojiReaction = (emoji: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setReactions((prev) => [...prev, { id, emoji }]);
    setIsAnimating(true);
  };

  const data =
    selectedToken === 'sol'
      ? solPriceData
      : selectedToken === 'eth'
      ? ethPriceData
      : btcPriceData;

  const chartWidth = Dimensions.get('window').width * 0.9 - 8;

  const findYAxisOffset = (arr: number[]) => {
    if (!arr || arr.length === 0) return undefined;
    return Math.min(...arr);
  };

  const dataValues = data.map((item) => item.value);
  const yAxisOffset = findYAxisOffset(dataValues);

  // Get current price for selected token
  const currentPrice =
    currentPrices[selectedToken as keyof typeof currentPrices];

  // Get liquidation price for current token
  const liquidationPrice =
    liquidationPrices[selectedToken as keyof typeof liquidationPrices];

  // Calculate the position of lines using the chart's actual range
  const actualMinValue = yAxisOffset || Math.min(...dataValues);
  const actualMaxValue = Math.max(...dataValues);
  const actualValueRange = actualMaxValue - actualMinValue;

  // Calculate positions for different price lines
  const calculateLinePosition = (price: number) => {
    const priceRatio = (price - actualMinValue) / actualValueRange;
    const topOffset = 20;
    const bottomOffset = 20;
    const plotArea = chartHeight - topOffset - bottomOffset;
    return topOffset + plotArea * (1 - priceRatio);
  };

  const liquidationLineTop = calculateLinePosition(liquidationPrice);
  const currentPriceLineTop = calculateLinePosition(currentPrice);
  const entryPriceLineTop = trade ? calculateLinePosition(trade.entryPrice) : 0;

  // Determine if position is in profit or loss
  const isProfit =
    !trade || trade.status !== 'open'
      ? null
      : (trade.side === 'long' && currentPrice > trade.entryPrice) ||
        (trade.side === 'short' && currentPrice < trade.entryPrice);

  // Set chart color based on isProfit
  let chartColor = theme.colors.tint;
  let fillColor = theme.colors.tint;
  if (trade && isProfit !== null) {
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
  // Mock percentage value
  const mockPercent = 28.2;

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
          yAxisOffset={yAxisOffset}
          width={chartWidth}
          height={chartHeight}
          hideYAxisText={true}
          adjustToWidth={false}
          parentWidth={chartWidth}
          stepHeight={chartHeight / 4}
          stepValue={
            (Math.max(...dataValues) -
              (yAxisOffset || Math.min(...dataValues))) /
            4
          }
        />

        {/* Custom y-axis labels (now pressable as a group) */}
        <Pressable
          onPress={() => setShowPercent((prev) => !prev)}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 60,
            height: chartHeight,
          }}
          accessibilityRole='button'
          accessibilityLabel='Toggle price/percentage'
        >
          {Array.from({ length: 5 }, (_, i) => {
            const value = actualMinValue + (actualValueRange * i) / 4;
            const sectionHeight = (chartHeight - 40) / 4;
            const yPosition = 20 + (4 - i) * sectionHeight;
            return (
              <YAxisLabel
                key={i}
                style={{
                  top: yPosition,
                  right: 15,
                }}
              >
                <BodyXSMonoEmphasized
                  style={{ color: theme.colors.textSecondary }}
                >
                  {value.toFixed(0)}
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
          <CurrentPriceBubble $isProfit={isProfit}>
            <CurrentPriceText style={{ color: theme.colors.background }}>
              {/* Toggle between price and percentage */}
              {trade && showPercent
                ? isProfit === true
                  ? `+${mockPercent.toFixed(2)}%`
                  : isProfit === false
                  ? `-${mockPercent.toFixed(2)}%`
                  : `${mockPercent.toFixed(2)}%`
                : `$${currentPrice.toFixed(2)}`}
            </CurrentPriceText>
          </CurrentPriceBubble>
        </CurrentPriceLabel>

        {/* Entry Price Line and Label (only show if trade exists) */}
        {trade && (
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
                  ${trade.entryPrice.toFixed(2)}
                </EntryPriceText>
              </EntryPriceBubble>
            </EntryPriceLabel>
          </>
        )}

        {/* Liquidation Line and Label */}
        {showLiquidation && (
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
                ${liquidationPrice.toFixed(2)}
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
  padding: 2px 4px;
  border-radius: 2px;
  z-index: 12;
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
