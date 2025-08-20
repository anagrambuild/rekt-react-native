import { useEffect, useRef } from "react";
import { Animated } from "react-native";

interface PulsatingContainerProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  style?: any;
}

export const PulsatingContainer = ({
  children,
  scale = 0.2,
  duration = 500,
  style = {},
  ...props
}: PulsatingContainerProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const createPulseAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1 + scale,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulseAnimation = createPulseAnimation();
    pulseAnimation.start();

    // Cleanup animation on unmount
    return () => {
      pulseAnimation.stop();
    };
  }, [scale, duration, scaleAnim]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};
