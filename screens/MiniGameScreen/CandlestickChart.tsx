import React, { useState } from "react";
import { View } from "react-native";

import { useMiniGameContext } from "@/contexts/MiniGameContext";
import { CandleData } from "@/utils/miniGameData";

import { Candlestick } from "./Candlestick";
import Svg, { Line } from "react-native-svg";
import { useTheme } from "styled-components/native";

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
  const [viewHeight, setViewHeight] = useState(0);

  const { selectedToken } = useMiniGameContext();

  if (!data || data.length === 0) {
    return null;
  }

  const chartOffset =
    selectedToken === "sol" ? 84 : selectedToken === "eth" ? 94 : 110;

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
        stroke={theme.colors.textPrimary}
        strokeWidth={0.5}
        opacity={0.3}
        strokeDasharray="5,5"
      />
    );
  }

  return (
    <View
      onLayout={event => {
        const { height: layoutHeight } = event.nativeEvent.layout;
        setViewHeight(layoutHeight);
      }}
      style={{
        width,
        height,
      }}
    >
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
              viewHeight={viewHeight}
            />
          );
        })}
      </Svg>
    </View>
  );
};

// Utility function to generate dummy OHLC data
export { generateDummyCandleData } from "@/utils/miniGameData";
