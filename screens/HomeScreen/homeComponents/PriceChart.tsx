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

export const PriceChart = () => {
  const theme = useTheme();
  const chartWidth = Dimensions.get('window').width * 0.7;
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

  return (
    <Wrapper>
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
        yAxisSide={yAxisSides.RIGHT}
      />
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
