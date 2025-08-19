import { useState } from 'react';
import { View } from 'react-native';

import { Body1Emphasized, Column, PressableOpacity, Row } from '@/components';

import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';
import { Step5 } from './Step5';
import { useTranslation } from 'react-i18next';
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import styled, { DefaultTheme } from 'styled-components/native';

const stepTexts = [
  'The simplest perps trading experience ever',
  'Earn big winnings with up to 200x leverage',
  'Earn points and compete with your friends on leaderboards',
  'Deposit or withdraw your wins instantly',
  'Earn 5% APY on your balance, streamed every second',
];

const stepComponents = [Step1, Step2, Step3, Step4, Step5];

export const Steps = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const goToStep = (step: number) => {
    if (step >= 0 && step < stepTexts.length) {
      setCurrentStep(step);
    }
  };

  const flingLeftGesture = Gesture.Fling()
    .runOnJS(true)
    .direction(Directions.LEFT)
    .onStart(() => {
      if (currentStep < stepTexts.length - 1) {
        runOnJS(goToStep)(currentStep + 1);
      }
    });

  const flingRightGesture = Gesture.Fling()
    .runOnJS(true)
    .direction(Directions.RIGHT)
    .onStart(() => {
      if (currentStep > 0) {
        runOnJS(goToStep)(currentStep - 1);
      }
    });

  const composedGesture = Gesture.Simultaneous(
    flingLeftGesture,
    flingRightGesture
  );

  const CurrentStepComponent = stepComponents[currentStep];

  return (
    <Column $gap={16} $justifyContent='space-between' style={{ flex: 1 }}>
      <Column $width='100%' $justifyContent='flex-start' $gap={16}>
        {/* Step Text */}
        <Body1Emphasized style={{ width: '70%', textAlign: 'center' }}>
          {t(stepTexts[currentStep])}
        </Body1Emphasized>

        {/* Step Indicators */}

        <Row $justifyContent='center' $gap={8}>
          {stepTexts.map((_, index) => (
            <StepIndicator key={index} $active={index === currentStep} />
          ))}
        </Row>
      </Column>

      {/* Current Step Component */}
      <GestureDetector gesture={composedGesture}>
        <View style={{ width: '100%', paddingBottom: 16 }}>
          <CurrentStepComponent />
        </View>
      </GestureDetector>
    </Column>
  );
};

const StepIndicator = styled.View<{ $active: boolean }>`
  width: ${({ $active }: { $active: boolean }) => ($active ? '24px' : '8px')};
  height: 8px;
  border-radius: 4px;
  background-color: ${({
    theme,
    $active,
  }: {
    theme: DefaultTheme;
    $active: boolean;
  }) => ($active ? theme.colors.highEmText : theme.colors.lowEmText)};
`;
