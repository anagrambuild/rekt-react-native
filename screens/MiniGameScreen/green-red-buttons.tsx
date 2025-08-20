import { ImageBackground, StyleSheet, View } from "react-native";

import tile from "@/assets/images/app-pngs/tile.png";
import GreenCandle from "@/assets/images/app-svgs/green-candle.svg";
import RedCandle from "@/assets/images/app-svgs/red-candle.svg";
import { PressableOpacity } from "@/components";
import { Theme } from "@/types/styled";

import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import styled, { useTheme } from "styled-components/native";

const arrowButtonShared = {
  display: "flex",
  width: ({ $size }: { $size?: number }) => `${$size || 44}px`,
  height: ({ $size }: { $size?: number }) => `${$size || 44}px`,
  justifyContent: "center",
  alignItems: "center",
};

const ShortArrowContainer = styled.View`
  ${arrowButtonShared}
  border-radius: 22px;
  overflow: hidden;
`;

const GradientBackground = styled(LinearGradient)`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const InnerShadow = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export const ShortArrow = ({ size }: { size?: number }) => {
  const theme = useTheme();

  return (
    <ShortArrowContainer
      $size={size}
      style={{
        shadowColor: theme.colors.gradientRed,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1.0,
        shadowRadius: 20,
        elevation: 15,
      }}
    >
      <GradientBackground
        colors={[theme.colors.background, theme.colors.gradientRed]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <InnerShadow style={{ shadowColor: theme.colors.gradientOrange }} />
        <RedCandle />
      </GradientBackground>
    </ShortArrowContainer>
  );
};

export const LongArrow = ({ size }: { size?: number }) => {
  const theme = useTheme();

  return (
    <ShortArrowContainer
      $size={size}
      style={{
        shadowColor: theme.colors.gradientGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1.0,
        shadowRadius: 20,
        elevation: 15,
      }}
    >
      <GradientBackground
        colors={[theme.colors.background, theme.colors.gradientGreen]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <InnerShadow style={{ shadowColor: theme.colors.gradientGreenGlow }} />
        <GreenCandle />
      </GradientBackground>
    </ShortArrowContainer>
  );
};

// Shared styles for the large button
const LargeButtonContainer = styled(PressableOpacity)`
  border-width: 1px;
  flex: 1;
  border-radius: 16px;
  min-height: 160px;
  margin: 8px;
`;

const ContentContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  gap: 20px;
  opacity: ${({ $disabled }: { $disabled?: boolean }) => ($disabled ? 0.2 : 1)};
`;

const Title = styled.Text`
  color: ${({ theme }: { theme: Theme }) => theme.colors.highEmText};
  font-size: 18px;
  font-weight: bold;
`;

const Subtitle = styled.Text`
  color: ${({ color }: { color: string }) => color};
  font-size: 12px;
`;

interface ShortButtonProps {
  onPress?: () => void;
  title: string;
  subtitle: string;
  disabled?: boolean;
}

export const ShortButton = ({
  onPress,
  title,
  subtitle,
  disabled = false,
}: ShortButtonProps) => {
  const theme = useTheme();

  const handlePress = () => {
    if (!disabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onPress();
    }
  };

  return (
    <LargeButtonContainer
      onPress={handlePress}
      disabled={disabled}
      style={{ borderColor: theme.colors.borderLoss }}
    >
      <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
        {/* Background image as bottom layer */}
        <ImageBackground
          source={tile}
          style={StyleSheet.absoluteFillObject}
          imageStyle={{ opacity: 0.1, borderRadius: 16 }}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <LinearGradient
          colors={[theme.colors.background, theme.colors.gradientRed]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 16, opacity: 0.4 },
          ]}
        />
        {/* Content above all backgrounds */}
        <ContentContainer
          $disabled={disabled}
          style={{ position: "relative", flex: 1 }}
        >
          <ShortArrow />
          <Title>{title}</Title>
          <Subtitle color={theme.colors.lossLight}>{subtitle}</Subtitle>
        </ContentContainer>
      </View>
    </LargeButtonContainer>
  );
};

interface LongButtonProps {
  onPress?: () => void;
  title: string;
  subtitle: string;
  disabled?: boolean;
}

export const LongButton = ({
  onPress,
  title,
  subtitle,
  disabled = false,
}: LongButtonProps) => {
  const theme = useTheme();

  const handlePress = () => {
    if (!disabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  return (
    <LargeButtonContainer
      onPress={handlePress}
      disabled={disabled}
      style={{ borderColor: theme.colors.borderProfit }}
    >
      <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
        {/* Background image as bottom layer */}
        <ImageBackground
          source={tile}
          style={StyleSheet.absoluteFillObject}
          imageStyle={{ opacity: 0.1, borderRadius: 16 }}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <LinearGradient
          colors={[theme.colors.background, theme.colors.gradientGreen]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 16, opacity: 0.4 },
          ]}
        />
        {/* Content above all backgrounds */}
        <ContentContainer
          $disabled={disabled}
          style={{ position: "relative", flex: 1 }}
        >
          <LongArrow />
          <Title>{title}</Title>
          <Subtitle color={theme.colors.profitLight}>{subtitle}</Subtitle>
        </ContentContainer>
      </View>
    </LargeButtonContainer>
  );
};
