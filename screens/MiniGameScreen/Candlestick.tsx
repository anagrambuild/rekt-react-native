import React from "react";

import questionCandle from "@/assets/images/app-pngs/question-candle.png";
import { Column } from "@/components/common/containers";
import { CandleData } from "@/utils/miniGameData";

import { Image } from "expo-image";
import Svg, { Line, Rect } from "react-native-svg";
import { useTheme } from "styled-components/native";

interface CandlestickProps {
  data: CandleData;
  x: number;
  width: number;
  minPrice: number;
  maxPrice: number;
  height: number;
  topOffset: number;
  viewHeight: number;
}

export const Candlestick: React.FC<CandlestickProps> = ({
  data,
  x,
  width,
  minPrice,
  maxPrice,
  height,
  topOffset,
  viewHeight,
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

  if (data.result === "pending") {
    return (
      <Column
        style={{
          height: viewHeight,
          width,
          // backgroundColor: 'red',
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          right: 0,
          top: 0,
        }}
      >
        <Image
          source={questionCandle}
          style={{
            width: 24,
            height: 24,
            // position: 'absolute',
            // top: 0,
            // left: 0,
          }}
        />
      </Column>
    );
  }

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
