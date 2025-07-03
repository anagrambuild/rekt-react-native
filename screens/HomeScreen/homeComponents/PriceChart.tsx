import React from 'react';
import { Dimensions, View } from 'react-native';

// https://gifted-charts.web.app/linechart/#animated
import { LineChart, yAxisSides } from 'react-native-gifted-charts';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

const data = [
  { value: 167 },
  { value: 168 },
  { value: 169 },
  { value: 170 },
  { value: 170.5 },
  { value: 171 },
  { value: 171.2 },
];

export const PriceChart = () => {
  const theme = useTheme();
  const chartWidth = Dimensions.get('window').width * 0.7;

  return (
    <Wrapper>
      <LineChart
        data={data}
        isAnimated
        animationDuration={1200}
        areaChart
        curved
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
        yAxisOffset={166} // set to your min value for better axis
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
