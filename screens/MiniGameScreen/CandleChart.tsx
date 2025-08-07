import { Dimensions } from 'react-native';

import { BodyXSEmphasized, BodyXSMonoEmphasized } from '@/components';
import { useMiniGameContext } from '@/contexts';

import { CandlestickChart } from './CandlestickChart';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

export const CandleChart = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const chartHeight = 200;
  const { getCurrentTokenGame } = useMiniGameContext();

  // Get candle data from MiniGameContext
  const currentGame = getCurrentTokenGame();
  const candleData = currentGame.candles;
  const chartWidth = Dimensions.get('window').width * 0.9 - 8;

  // Extract all price values for range calculation
  const allPrices = candleData.flatMap((candle: any) => [
    candle.open,
    candle.high,
    candle.low,
    candle.close,
  ]);
  const dataValues = allPrices;

  // Get current price from candlestick data (last candle's close)
  const currentPrice =
    candleData.length > 0 ? candleData[candleData.length - 1].close : 65000;

  // Calculate dynamic y-axis range based on chart data
  const actualMinValue = Math.min(...dataValues);
  const actualMaxValue = Math.max(...dataValues);

  // Add some padding (5%) to the range for better visualization
  const padding = (actualMaxValue - actualMinValue) * 0.05;
  const paddedMinValue = actualMinValue - padding;
  const paddedMaxValue = actualMaxValue + padding;
  const actualValueRange = paddedMaxValue - paddedMinValue;

  // Calculate position for current price line
  const calculateLinePosition = (price: number) => {
    const priceRatio = (price - paddedMinValue) / actualValueRange;
    const topOffset = 20;
    const bottomOffset = 20;
    const plotArea = chartHeight - topOffset - bottomOffset;
    return topOffset + plotArea * (1 - priceRatio);
  };

  const currentPriceLineTop = calculateLinePosition(currentPrice);

  // Show loading state if data is not available
  if (candleData.length === 0) {
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

  return (
    <Wrapper>
      <ChartContainer>
        <CandlestickChart
          data={candleData}
          width={chartWidth}
          height={chartHeight}
          minPrice={paddedMinValue}
          maxPrice={paddedMaxValue}
          topOffset={20}
          bottomOffset={20}
        />

        {/* Custom y-axis labels (now pressable as a group) */}

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

        <CurrentPriceLabel
          style={{
            top: currentPriceLineTop - 12,
            right: 15,
          }}
        >
          <CurrentPriceBubble>
            <CurrentPriceText style={{ color: theme.colors.background }}>
              $
              {currentPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CurrentPriceText>
          </CurrentPriceBubble>
        </CurrentPriceLabel>
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
  border-radius: 8px;
  z-index: 12;
  min-width: 70px;
  align-items: center;
`;

const CurrentPriceLabel = styled.View`
  position: absolute;
  z-index: 20;
`;

const CurrentPriceBubble = styled.View`
  padding: 4px 8px;
  border-radius: 12px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.tint};
`;

const CurrentPriceText = styled.Text`
  font-size: 11px;
  font-weight: 600;
  font-family: 'Geist Mono';
`;
