import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';

interface FloatingUsdcIconProps {
  size?: number;
  targetPosition: { x: number; y: number };
}

export const FloatingUsdcIcon = ({
  size = 16,
  targetPosition,
}: FloatingUsdcIconProps) => {
  // Use useRef for Animated.Value
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Only start animation if we have valid target coordinates
    if (targetPosition.x === 0 && targetPosition.y === 0) {
      return; // Wait for valid coordinates
    }
    const startAnimation = () => {
      // Reset to starting position
      translateY.setValue(0);
      translateX.setValue(0);
      opacity.setValue(1);

      // Calculate the required translation to reach the target position
      // The icon starts near the $ amount text and should end at the UsdcIcon
      // Since this component is positioned relative to the earnings amount text,
      // we need to calculate the translation to reach the target USDC icon position
      const xOffset = targetPosition.x * 0.2;
      const deltaX = targetPosition.x + xOffset;
      const deltaY = -targetPosition.y;

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: deltaY,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: deltaX,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Loop the animation
        startAnimation();
      });
    };

    startAnimation();
  }, [opacity, translateY, translateX, targetPosition]);

  return (
    <View style={{ width: size, height: size, overflow: 'visible' }}>
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          opacity,
          transform: [{ translateY }, { translateX }],
          zIndex: 1000,
        }}
      >
        <UsdcIcon width={size} height={16} />
      </Animated.View>
    </View>
  );
};
