import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView } from 'react-native';

import grayBlock from '@/assets/images/app-pngs/gray-block.png';
import grayBlockQuestionMark from '@/assets/images/app-pngs/gray-block-question-mark.png';
import greenBlock from '@/assets/images/app-pngs/green-block.png';
import redBlock from '@/assets/images/app-pngs/red-block.png';
import EmptyIcon from '@/assets/images/app-svgs/empty.svg';
import { Column, Row, Title4 } from '@/components';
import { useMiniGameContext } from '@/contexts';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

export const PredictionSection = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState(50);
  const scrollViewRef = useRef<ScrollView>(null);

  const { getCurrentPrediction, isInDecisionMode } = useMiniGameContext();

  const currentPrediction = getCurrentPrediction();
  const inDecisionMode = isInDecisionMode();

  // Countdown timer effect - independent of game context
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 0) {
          return prev - 1;
        } else {
          // After countdown reaches 0, wait 10 seconds then restart at 50
          setTimeout(() => {
            setTimeLeft(50);
          }, 10000);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Create display data combining finished candles and current pending candle
  const previousCandles = useMemo(() => {
    const displayCandles = [];

    // Add some empty slots for visual consistency
    for (let i = 0; i < 4; i++) {
      displayCandles.push({ result: null, amount: null, prediction: null });
    }
    
    // Add recently finished candles (you could store these in context if needed)
    // For now, we'll show some mock finished ones
    displayCandles.push(
      { result: 'green', amount: '$2', prediction: 'green' },
      { result: 'red', amount: '$0', prediction: 'red' },
      { result: 'green', amount: '$1', prediction: 'green' }
    );
    // Always show a pending block - either with current prediction or default $0
    if (currentPrediction) {
      const status = inDecisionMode ? 'decision' : 'pending';
      displayCandles.push({
        result: status,
        amount: `$${currentPrediction.betAmount}`,
        prediction: currentPrediction.prediction, // Add prediction info
      });
    } else {
      // Show default pending block with $0
      displayCandles.push({
        result: 'pending',
        amount: '$0',
        prediction: null, // No prediction yet
      });
    }

    return displayCandles;
  }, [currentPrediction, inDecisionMode]);

  // Auto-scroll to the end when component mounts or data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return () => clearTimeout(timer);
  }, [previousCandles]);

  return (
    <Column $gap={16}>
      <Row $justifyContent='space-between'>
        <Title4>{t('Predict next candle')}</Title4>
        <TimerContainer>
          <AnimatedTimer timeLeft={timeLeft} maxTime={50} />
          <TimerText>{timeLeft}s</TimerText>
        </TimerContainer>
      </Row>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          height: 70,
          borderRadius: 2,
          paddingHorizontal: 16,
        }}
      >
        {previousCandles.map((candle, index) => (
          <BlockCardWrapper
            key={index}
            $result={candle.result}
            style={{
              shadowColor:
                candle.result === 'green'
                  ? theme.colors.profit
                  : candle.result === 'red'
                  ? theme.colors.loss
                  : candle.result === 'pending' || candle.result === 'decision'
                  ? theme.colors.accentPurpleLight
                  : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.38,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {candle.result ? (
              <LinearGradient
                colors={
                  candle.result === 'green'
                    ? [theme.colors.profitBg, theme.colors.background]
                    : candle.result === 'red'
                    ? [theme.colors.lossBg, theme.colors.background]
                    : [theme.colors.accentPurpleDark, theme.colors.background]
                }
                style={{ flex: 1, borderRadius: 8 }}
              >
                <BlockCard $result={candle.result}>
                  {candle.result !== 'pending' &&
                  candle.result !== 'decision' ? (
                    <ResultText $result={candle.result}>
                      {candle.amount}
                    </ResultText>
                  ) : (
                    <PendingText>{`? ${candle.amount || '$0'}`}</PendingText>
                  )}
                  <Image
                    source={
                      candle.result === 'green'
                        ? greenBlock
                        : candle.result === 'red'
                        ? redBlock
                        : (candle.result === 'pending' || candle.result === 'decision') && candle.prediction
                        ? candle.prediction === 'green'
                          ? greenBlock
                          : redBlock
                        : candle.result === 'pending'
                        ? grayBlockQuestionMark
                        : grayBlock
                    }
                    style={{ width: 24, height: 24 }}
                  />
                </BlockCard>
              </LinearGradient>
            ) : (
              <BlockCard
                $result={candle.result}
                style={{ backgroundColor: theme.colors.card }}
              >
                <EmptyIcon width={16} height={16} />
                <Image source={grayBlock} style={{ width: 24, height: 24 }} />
              </BlockCard>
            )}
          </BlockCardWrapper>
        ))}
      </ScrollView>
    </Column>
  );
};

const TimerContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.secondary}33;
`;

const TimerText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textSecondary};
  font-family: 'Geist Mono';
`;

const BlockCardWrapper = styled.View<{
  $result: 'green' | 'red' | 'pending' | 'decision' | null;
}>`
  border-radius: 8px;
  overflow: hidden;
`;

const BlockCard = styled.View<{
  $result: 'green' | 'red' | 'pending' | 'decision' | null;
}>`
  border-radius: 8px;
  border-top-width: ${({
    $result,
  }: {
    $result: 'green' | 'red' | 'pending' | 'decision' | null;
  }) => {
    if ($result === 'green') return '2px';
    if ($result === 'red') return '2px';
    if ($result === 'pending' || $result === 'decision') return '2px';
    return '0px';
  }};
  border-top-color: ${({
    theme,
    $result,
  }: {
    theme: DefaultTheme;
    $result: 'green' | 'red' | 'pending' | 'decision' | null;
  }) => {
    if ($result === 'green') return theme.colors.profit;
    if ($result === 'red') return theme.colors.loss;
    if ($result === 'pending' || $result === 'decision')
      return theme.colors.accentPurple;
    return 'transparent';
  }};
  padding: 16px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const ResultText = styled.Text<{ $result: 'green' | 'red' }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({
    theme,
    $result,
  }: {
    theme: DefaultTheme;
    $result: 'green' | 'red';
  }) => ($result === 'green' ? theme.colors.profit : theme.colors.loss)};
  font-family: 'Geist Mono';
`;

const PendingText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.accentPurpleLight};
  font-family: 'Geist Mono';
`;

// Animated Timer Component
const AnimatedTimer = ({
  timeLeft,
  maxTime,
}: {
  timeLeft: number;
  maxTime: number;
}) => {
  const theme = useTheme();
  const size = 16;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress (0 to 1) - reverse because we want full circle at 0 seconds
  const progress = 1 - timeLeft / maxTime;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={theme.colors.secondary}
        strokeWidth={strokeWidth}
        fill='none'
        opacity={0.3}
      />
      {/* Progress circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={theme.colors.timerPurple}
        strokeWidth={strokeWidth}
        fill='none'
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap='round'
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};
