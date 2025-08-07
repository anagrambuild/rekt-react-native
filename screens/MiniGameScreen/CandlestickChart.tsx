import React from 'react';
import { View } from 'react-native';

import { useMiniGameContext } from '@/contexts';

import { CandleData, Candlestick } from './Candlestick';
import Svg, { Line } from 'react-native-svg';
import { useTheme } from 'styled-components/native';

interface CandlestickChartProps {
  data: CandleData[];
  width: number;
  height: number;
  minPrice: number;
  maxPrice: number;
  topOffset?: number;
  bottomOffset?: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  width,
  height,
  minPrice,
  maxPrice,
  topOffset = 20,
  bottomOffset = 20,
}) => {
  const theme = useTheme();

  const { selectedToken } = useMiniGameContext();

  if (!data || data.length === 0) {
    return null;
  }

  const chartOffset =
    selectedToken === 'sol' ? 84 : selectedToken === 'eth' ? 94 : 110;

  // Calculate dimensions - leave 80px for y-axis labels
  const chartAreaWidth = width - chartOffset;
  const plotHeight = height - topOffset - bottomOffset;
  const candleWidth = chartAreaWidth / data.length;
  const spacing = candleWidth * 0.1; // 10% spacing between candles
  const actualCandleWidth = candleWidth - spacing;

  // Grid lines (4 sections like the original)
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = topOffset + (plotHeight * i) / 4;
    gridLines.push(
      <Line
        key={`grid-${i}`}
        x1={0}
        y1={y}
        x2={chartAreaWidth}
        y2={y}
        stroke={theme.colors.secondary}
        strokeWidth={0.5}
        opacity={0.3}
      />
    );
  }

  return (
    <View style={{ width, height }}>
      <Svg width={chartAreaWidth} height={height}>
        {/* Grid lines */}
        {gridLines}

        {/* Candlesticks */}
        {data.map((candleData, index) => {
          const x = index * candleWidth + spacing / 2;

          return (
            <Candlestick
              key={`candle-${index}-${candleData.timestamp}`}
              data={candleData}
              x={x}
              width={actualCandleWidth}
              minPrice={minPrice}
              maxPrice={maxPrice}
              height={plotHeight}
              topOffset={topOffset}
            />
          );
        })}
      </Svg>
    </View>
  );
};

// Utility function to generate dummy OHLC data
export const generateDummyCandleData = (
  count: number = 10,
  startPrice: number = 65000
): CandleData[] => {
  const data: CandleData[] = [];
  let basePrice = startPrice;

  for (let i = 0; i < count; i++) {
    // Generate some realistic price movement
    const volatility = basePrice * 0.02; // 2% volatility
    const trend = (Math.random() - 0.5) * volatility * 0.5; // Small trend

    // Generate OHLC values
    const open = basePrice;
    const priceChange = (Math.random() - 0.5) * volatility;
    const close = open + priceChange + trend;

    // High and low should encompass open and close
    const minOC = Math.min(open, close);
    const maxOC = Math.max(open, close);
    const wickRange = volatility * 0.3;

    const high = maxOC + Math.random() * wickRange;
    const low = minOC - Math.random() * wickRange;

    data.push({
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      timestamp: Date.now() - (count - i) * 60000, // 1 minute intervals
    });

    // Update base price for next candle
    basePrice = close;
  }

  return data;
};
