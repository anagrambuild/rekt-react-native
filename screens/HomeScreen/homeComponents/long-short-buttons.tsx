import { ImageBackground, StyleSheet, View } from 'react-native';

import tile from '@/assets/images/app-pngs/tile.png';
import WhiteGreenArrow from '@/assets/images/app-svgs/white-green-arrow.svg';
import WhiteRedArrow from '@/assets/images/app-svgs/white-red-arrow.svg';
import { Theme } from '@/types/styled';

import { LinearGradient } from 'expo-linear-gradient';
import styled, { useTheme } from 'styled-components/native';

// TODO - add ScrollView for ScreenContainer

const arrowButtonShared = {
  display: 'flex',
  width: 44,
  height: 44,
  justifyContent: 'center',
  alignItems: 'center',
};

const ShortArrowContainer = styled.View`
  ${arrowButtonShared}
  border-radius: 628.571px;
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

export const ShortArrow = () => {
  const theme = useTheme();

  return (
    <ShortArrowContainer>
      <GradientBackground
        colors={[theme.colors.background, theme.colors.gradientRed]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <InnerShadow style={{ shadowColor: theme.colors.gradientOrange }} />
        <WhiteRedArrow />
      </GradientBackground>
    </ShortArrowContainer>
  );
};

export const LongArrow = () => {
  const theme = useTheme();

  return (
    <ShortArrowContainer>
      <GradientBackground
        colors={[theme.colors.background, theme.colors.gradientGreen]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <InnerShadow style={{ shadowColor: theme.colors.gradientGreenGlow }} />
        <WhiteGreenArrow />
      </GradientBackground>
    </ShortArrowContainer>
  );
};

// Shared styles for the large button
const LargeButtonContainer = styled.Pressable`
  border-width: 1px;
  flex: 1;
  border-radius: 16px;
  overflow: hidden;
  min-height: 160px;
  margin: 8px;
`;

const ContentContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  gap: 20px;
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
}

export const ShortButton = ({ onPress, title, subtitle }: ShortButtonProps) => {
  const theme = useTheme();

  return (
    <LargeButtonContainer
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        {
          borderColor: theme.colors.borderLoss,
          opacity: pressed ? 0.7 : 1,
          shadowColor: theme.colors.gradientRed,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.35,
        },
      ]}
    >
      <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
        {/* Background image as bottom layer */}
        <ImageBackground
          source={tile}
          style={StyleSheet.absoluteFillObject}
          imageStyle={{ opacity: 0.1, borderRadius: 16 }}
          resizeMode='cover'
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
        <ContentContainer style={{ position: 'relative', flex: 1 }}>
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
}

export const LongButton = ({ onPress, title, subtitle }: LongButtonProps) => {
  const theme = useTheme();

  return (
    <LargeButtonContainer
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        {
          borderColor: theme.colors.borderProfit,
          opacity: pressed ? 0.7 : 1,
          shadowColor: theme.colors.gradientGreen,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          borderRadius: 16,
          overflow: 'hidden',
        },
      ]}
    >
      <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
        {/* Background image as bottom layer */}
        <ImageBackground
          source={tile}
          style={StyleSheet.absoluteFillObject}
          imageStyle={{ opacity: 0.1, borderRadius: 16 }}
          resizeMode='cover'
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
        <ContentContainer style={{ position: 'relative', flex: 1 }}>
          <LongArrow />
          <Title>{title}</Title>
          <Subtitle color={theme.colors.profitLight}>{subtitle}</Subtitle>
        </ContentContainer>
      </View>
    </LargeButtonContainer>
  );
};
