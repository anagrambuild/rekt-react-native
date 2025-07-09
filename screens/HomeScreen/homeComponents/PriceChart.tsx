import { Dimensions } from 'react-native';

import rektBomb from '@/assets/images/app-pngs/rekt-bomb.png';
import { PulsatingContainer } from '@/components';
import { BodyXSEmphasized } from '@/components/common/texts';
import { useHomeContext } from '@/contexts';

import { Image } from 'expo-image';
// https://gifted-charts.web.app/linechart/#animated
import { LineChart } from 'react-native-gifted-charts';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

const solData = [
  { value: 167 },
  { value: 168 },
  { value: 169 },
  { value: 170 },
  { value: 170.5 },
  { value: 171 },
  { value: 171.2 },
];
const ethData = [
  { value: 2563 },
  { value: 2565 },
  { value: 2566 },
  { value: 2567 },
  { value: 2568 },
  { value: 2569 },
  { value: 2564 },
];
const btcData = [
  { value: 109250 },
  { value: 109258 },
  { value: 108966 },
  { value: 108824 },
  { value: 108682 },
  { value: 108640 },
  { value: 109261 },
];

// Mock liquidation prices - replace with actual liquidation price logic
const liquidationPrices = {
  sol: 169.3,
  eth: 2564.5,
  btc: 108800,
};

export const PriceChart = ({
  showLiquidation = false,
}: {
  showLiquidation?: boolean;
}) => {
  const theme = useTheme();
  const chartHeight = 200; // Define chart height
  const { selectedToken } = useHomeContext();

  const data =
    selectedToken === 'sol'
      ? solData
      : selectedToken === 'eth'
      ? ethData
      : btcData;

  // Use full width minus a few pixels to prevent overflow
  const chartWidth = Dimensions.get('window').width * 0.9 - 8; // Subtract 8px to prevent overflow

  const findYAxisOffset = (arr: number[]) => {
    if (!arr || arr.length === 0) return undefined;
    return Math.min(...arr);
  };

  // Calculate data values after data is determined
  const dataValues = data.map((item) => item.value);
  const yAxisOffset = findYAxisOffset(dataValues);

  // Get liquidation price for current token
  const liquidationPrice =
    liquidationPrices[selectedToken as keyof typeof liquidationPrices];

  // Calculate the position of the liquidation line using the chart's actual range
  const actualMinValue = yAxisOffset || Math.min(...dataValues);
  const actualMaxValue = Math.max(...dataValues);
  const actualValueRange = actualMaxValue - actualMinValue;

  // Simple ratio calculation using the chart's actual displayed range
  const priceRatio = (liquidationPrice - actualMinValue) / actualValueRange;

  // With stepHeight controlling the chart dimensions, we should need much less padding
  const topOffset = 20; // Reduced since chart should respect our height
  const bottomOffset = 20; // Reduced since chart should respect our height
  const plotArea = chartHeight - topOffset - bottomOffset;

  // Position from top (inverted because chart goes from high to low values top to bottom)
  const liquidationLineTop = topOffset + plotArea * (1 - priceRatio);

  return (
    <Wrapper>
      <ChartContainer>
        <LineChart
          data={data}
          isAnimated
          animationDuration={1200}
          areaChart
          color={theme.colors.tint}
          thickness={2}
          startFillColor={theme.colors.tint}
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

        {/* Custom y-axis labels overlaid on top of chart with proper spacing */}
        {Array.from({ length: 5 }, (_, i) => {
          const value = actualMinValue + (actualValueRange * i) / 4;
          // Better spacing calculation to match chart sections
          const sectionHeight = (chartHeight - 40) / 4; // Account for top/bottom padding
          const yPosition = 20 + (4 - i) * sectionHeight; // Reverse order (top to bottom)
          return (
            <YAxisLabel
              key={i}
              style={{
                top: yPosition,
                right: 15, // Add padding from right edge
              }}
            >
              <BodyXSEmphasized style={{ color: theme.colors.tint }}>
                {value.toFixed(0)}
              </BodyXSEmphasized>
            </YAxisLabel>
          );
        })}
        {showLiquidation && (
          <>
            {/* Custom liquidation line overlay */}
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

            {/* Liquidation price label with background */}
            <LiquidationLabel
              style={{
                top: liquidationLineTop - 10,
                right: 15, // Align with other labels, more padding from edge
              }}
            >
              <LiquidationText style={{ color: theme.colors.textPrimary }}>
                ${liquidationPrice.toFixed(2)}
              </LiquidationText>
            </LiquidationLabel>
          </>
        )}
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
  overflow: hidden;
`;

const YAxisLabel = styled.View`
  position: absolute;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background}80; /* Semi-transparent background */
  padding: 2px 4px;
  border-radius: 2px;
  z-index: 12;
`;

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
  border-radius: 4px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.liquidBorder};
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.liquidBg};
  z-index: 13; /* Higher than y-axis labels (12) */
`;

const LiquidationText = styled.Text`
  font-size: 12px;
  font-weight: 500;
  font-family: 'Geist';
`;
