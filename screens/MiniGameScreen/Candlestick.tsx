import React from 'react';

import Svg, { Line, Rect } from 'react-native-svg';
import { useTheme } from 'styled-components/native';

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

interface CandlestickProps {
  data: CandleData;
  x: number;
  width: number;
  minPrice: number;
  maxPrice: number;
  height: number;
  topOffset: number;
}

export const Candlestick: React.FC<CandlestickProps> = ({
  data,
  x,
  width,
  minPrice,
  maxPrice,
  height,
  topOffset,
}) => {
  const theme = useTheme();
  const { open, high, low, close } = data;

  // Determine if candle is bullish (green) or bearish (red)
  const isBullish = close >= open;

  // Calculate price range for positioning
  const priceRange = maxPrice - minPrice;

  // Helper function to convert price to y coordinate
  const priceToY = (price: number) => {
    const ratio = (price - minPrice) / priceRange;
    return topOffset + height * (1 - ratio);
  };

  // Calculate positions
  const highY = priceToY(high);
  const lowY = priceToY(low);
  const openY = priceToY(open);
  const closeY = priceToY(close);

  // Body dimensions
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.abs(closeY - openY);
  const bodyWidth = width * 0.8; // 80% of available width
  const bodyX = x + (width - bodyWidth) / 2;

  // Wick positions
  const wickX = x + width / 2;

  // Colors
  const candleColor = isBullish ? theme.colors.profit : theme.colors.loss;
  const wickColor = isBullish ? theme.colors.profit : theme.colors.loss;

  return (
    <Svg>
      {/* Upper wick */}
      <Line
        x1={wickX}
        y1={highY}
        x2={wickX}
        y2={bodyTop}
        stroke={wickColor}
        strokeWidth={1}
      />

      {/* Lower wick */}
      <Line
        x1={wickX}
        y1={bodyTop + bodyHeight}
        x2={wickX}
        y2={lowY}
        stroke={wickColor}
        strokeWidth={1}
      />

      {/* Candle body */}
      <Rect
        x={bodyX}
        y={bodyTop}
        width={bodyWidth}
        height={Math.max(bodyHeight, 1)} // Minimum height of 1 for doji candles
        fill={isBullish ? candleColor : candleColor}
        stroke={candleColor}
        strokeWidth={isBullish ? 1 : 0}
        fillOpacity={1}
      />
    </Svg>
  );
};
