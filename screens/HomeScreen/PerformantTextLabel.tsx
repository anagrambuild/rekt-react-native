import React from "react";

import {
  Blur,
  Group,
  Paint,
  RoundedRect,
  Text,
  useFont,
} from "@shopify/react-native-skia";

export const SkiaTextGlowStyles = {
  white: {
    backgroundColor: "#FFFFFF",
    glowColor: "rgba(255, 255, 255, 0.3)",
    textColor: "#000000",
  },
  green: {
    backgroundColor: "#10B981",
    glowColor: "rgba(16, 185, 129, 0.3)",
    textColor: "#FFFFFF",
  },
  red: {
    backgroundColor: "#EF4444",
    glowColor: "rgba(239, 68, 68, 0.3)",
    textColor: "#FFFFFF",
  },
  blue: {
    backgroundColor: "#3B82F6",
    glowColor: "rgba(59, 130, 246, 0.3)",
    textColor: "#FFFFFF",
  },
  purple: {
    backgroundColor: "#8B5CF6",
    glowColor: "rgba(139, 92, 246, 0.3)",
    textColor: "#FFFFFF",
  },
  dark: {
    backgroundColor: "#1F2937",
    glowColor: "rgba(75, 85, 99, 0.3)",
    textColor: "#FFFFFF",
  },
  gold: {
    backgroundColor: "#F59E0B",
    glowColor: "rgba(245, 158, 11, 0.3)",
    textColor: "#FFFFFF",
  },
};

export type SkiaTextGlowType = keyof typeof SkiaTextGlowStyles;

interface PerformantTextLabelProps {
  text: string;
  x: number;
  y: number;
  type: SkiaTextGlowType;
  fontSize?: number;
  padding?: number;
  fontPath?: any;
}

// Optimized text label with single blur layer for better performance
const PerformantTextLabelComponent: React.FC<PerformantTextLabelProps> = ({
  text,
  x,
  y,
  type,
  fontSize = 12,
  padding = 4,
  fontPath = require("@/assets/fonts/Geist-VariableFont_wght.ttf"),
}) => {
  const font = useFont(fontPath, fontSize);

  if (!font) {
    return null;
  }

  const style = SkiaTextGlowStyles[type];
  const textBounds = font.measureText(text);
  const width = textBounds.width + padding * 2;
  const height = fontSize + padding * 2;
  const textX = x + padding;
  const textY = y + height / 2 + fontSize / 3;

  return (
    <Group>
      {/* Single blur layer instead of 3 for better performance */}
      <Group
        layer={
          <Paint>
            <Blur blur={8} />
          </Paint>
        }
      >
        <RoundedRect
          x={x - 2}
          y={y - 2}
          width={width + 4}
          height={height + 4}
          r={12}
          color={style.glowColor}
        />
      </Group>

      {/* Main background */}
      <RoundedRect
        x={x}
        y={y}
        width={width}
        height={height}
        r={12}
        color={style.backgroundColor}
        opacity={0.9}
      />

      {/* Text */}
      <Text
        x={textX}
        y={textY}
        text={text}
        font={font}
        color={style.textColor}
      />
    </Group>
  );
};

PerformantTextLabelComponent.displayName = "PerformantTextLabel";

export const PerformantTextLabel = React.memo(PerformantTextLabelComponent);
