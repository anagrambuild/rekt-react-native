import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";

import { PerpSocialChip } from "../PerpSocialChip";
import styled from "styled-components/native";

// Animated banner row for perpSocials
export const IosBannerRow = ({ items }: { items: any[] }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemGap = 16;
  const [contentWidth, setContentWidth] = useState(0);

  const handleContentLayout = (e: any) => {
    const width = Math.round(e.nativeEvent.layout.width);
    if (width && Math.abs(width - contentWidth) > 0.5) {
      setContentWidth(width);
    }
  };

  useEffect(() => {
    if (contentWidth <= 0) return;
    translateX.setValue(0);
    const pixelsPerSecond = 60;
    // Add itemGap to account for the spacer between the two sets
    const totalScrollDistance = contentWidth + itemGap;
    const duration = Math.max(
      1000,
      (totalScrollDistance / pixelsPerSecond) * 1000
    );
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -totalScrollDistance,
        duration,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [contentWidth, translateX]);

  return (
    <BannerRowContainer>
      <Animated.View
        pointerEvents="none"
        renderToHardwareTextureAndroid={true}
        shouldRasterizeIOS={true}
        style={{
          flexDirection: "row",
          transform: [{ translateX }],
          backfaceVisibility: "hidden",
        }}
      >
        <View
          style={{ flexDirection: "row", gap: itemGap }}
          onLayout={handleContentLayout}
        >
          {items.map((perpSocial, i) => (
            <PerpSocialChip
              key={i + "-" + perpSocial.id}
              imgSrc={perpSocial.imgSrc}
              position={perpSocial.position}
              meta={perpSocial.meta}
              earningMultiple={perpSocial.earningMultiple}
            />
          ))}
        </View>
        {/* Spacer to maintain gap between sets */}
        <View style={{ width: itemGap }} />
        <View style={{ flexDirection: "row", gap: itemGap }}>
          {items.map((perpSocial, i) => (
            <PerpSocialChip
              key={"dup-" + i + "-" + perpSocial.id}
              imgSrc={perpSocial.imgSrc}
              position={perpSocial.position}
              meta={perpSocial.meta}
              earningMultiple={perpSocial.earningMultiple}
            />
          ))}
        </View>
      </Animated.View>
    </BannerRowContainer>
  );
};

const BannerRowContainer = styled(View)`
  width: 100%;
  overflow: hidden;
  margin: 12px 0;
  justify-content: center;
`;
