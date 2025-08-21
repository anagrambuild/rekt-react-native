import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";

import { PerpSocialChip } from "./PerpSocialChip";
import styled from "styled-components/native";

// Animated banner row for perpSocials
export const AnimatedBannerRow = ({ items }: { items: any[] }) => {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const itemGap = 16;
  const [rowWidth, setRowWidth] = useState(0);

  // Calculate total width of all items (approximate)
  const onLayout = (e: any) => {
    setRowWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (rowWidth === 0) return;
    const animate = () => {
      scrollAnim.setValue(0);
      Animated.timing(scrollAnim, {
        toValue: -rowWidth,
        duration: 6000,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(() => animate());
    };
    animate();
    return () => scrollAnim.stopAnimation();
  }, [rowWidth, scrollAnim]);

  // Duplicate items multiple times to ensure we have enough content
  const allItems = [...items, ...items, ...items, ...items, ...items, ...items];

  return (
    <BannerRowContainer>
      <Animated.View
        style={{
          flexDirection: "row",
          gap: itemGap,
          transform: [{ translateX: scrollAnim }],
        }}
        onLayout={onLayout}
      >
        {allItems.map((perpSocial, i) => (
          <PerpSocialChip
            key={i + "-" + perpSocial.id}
            imgSrc={perpSocial.imgSrc}
            position={perpSocial.position}
            meta={perpSocial.meta}
            earningMultiple={perpSocial.earningMultiple}
          />
        ))}
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
