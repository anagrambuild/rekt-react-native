import { Dimensions } from 'react-native';

import { useHomeContext } from '@/contexts';

// https://gifted-charts.web.app/linechart/#animated
import { LineChart, yAxisSides } from 'react-native-gifted-charts';
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

export const PriceChart = () => {
  const theme = useTheme();
  const chartWidth = Dimensions.get('window').width * 0.7;
  const chartHeight = 200; // Define chart height
  const { selectedToken } = useHomeContext();

  const data =
    selectedToken === 'sol'
      ? solData
      : selectedToken === 'eth'
      ? ethData
      : btcData;

  const findYAxisOffset = (arr: number[]) => {
    if (!arr || arr.length === 0) return undefined;
    return Math.min(...arr);
  };

  const yAxisOffset = findYAxisOffset(data.map((item) => item.value));

  // Get liquidation price for current token
  const liquidationPrice =
    liquidationPrices[selectedToken as keyof typeof liquidationPrices];

  // Calculate the position of the liquidation line using the chart's actual range
  const dataValues = data.map((item) => item.value);
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
          // curved
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
          yAxisTextStyle={{ color: theme.colors.tint }}
          xAxisLabelTextStyle={{ color: theme.colors.tint }}
          backgroundColor='transparent'
          initialSpacing={0}
          yAxisOffset={yAxisOffset}
          width={chartWidth}
          height={chartHeight}
          yAxisSide={yAxisSides.RIGHT}
          // Props to control chart dimensions more precisely
          adjustToWidth={false}
          parentWidth={chartWidth}
          // Remove any default padding
          stepHeight={chartHeight / 4}
          stepValue={
            (Math.max(...dataValues) -
              (yAxisOffset || Math.min(...dataValues))) /
            4
          }
        />

        {/* Custom liquidation line overlay */}
        <LiquidationLine
          style={{
            top: liquidationLineTop,
            width: chartWidth,
            borderColor: theme.colors.liquidBorder,
          }}
        />

        {/* Liquidation price label */}
        <LiquidationLabel
          style={{
            top: liquidationLineTop - 10,
            right: -30,
            borderWidth: 1,
            borderColor: theme.colors.liquidBorder,
            backgroundColor: theme.colors.liquidBg,
          }}
        >
          <LiquidationText style={{ color: theme.colors.textPrimary }}>
            ${liquidationPrice.toFixed(2)}
          </LiquidationText>
        </LiquidationLabel>
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
`;

const LiquidationLine = styled.View`
  position: absolute;
  height: 1px;
  border-width: 1px;
  border-style: dashed;
  z-index: 10;
`;

const LiquidationLabel = styled.View`
  position: absolute;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 11;
`;

const LiquidationText = styled.Text`
  font-size: 12px;
  font-weight: 500;
  font-family: 'Geist';
`;
