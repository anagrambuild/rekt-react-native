import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export const FloatingEmoji = ({
  emoji,
  chartHeight,
  onDone,
}: {
  emoji: string;
  chartHeight: number;
  onDone: () => void;
}) => {
  // Randomize left position, font size, and initial opacity
  const left = Math.random() * 260 + 30; // px from left
  const fontSize = Math.random() * 16 + 24; // 24-40px
  const initialOpacity = Math.random() * 0.3 + 0.7; // 0.7-1

  // Use useRef for Animated.Value
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(initialOpacity)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -chartHeight + 40,
        duration: 1400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1400,
        useNativeDriver: true,
      }),
    ]).start(onDone);
  }, [chartHeight, onDone, opacity, translateY]);

  return (
    <Animated.Text
      style={{
        position: "absolute",
        left,
        bottom: 10,
        fontSize,
        opacity,
        transform: [{ translateY }],
        zIndex: 100,
        textShadowColor: "#000",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }}
    >
      {emoji}
    </Animated.Text>
  );
};
