import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { Body1Emphasized, Column, Row } from "@/components";

import { Step1 } from "./Step1";
import { Step2 } from "./Step2";
import { Step3 } from "./Step3";
import { Step4 } from "./Step4";
import { Step5 } from "./Step5";
import { useTranslation } from "react-i18next";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import styled, { DefaultTheme } from "styled-components/native";

const stepTexts = [
  "The simplest perps trading experience ever",
  "Earn big winnings with up to 200x leverage",
  "Earn points and compete with your friends on leaderboards",
  "Deposit or withdraw your wins instantly",
  "Earn 5% APY on your balance, streamed every second",
];

const stepComponents = [Step1, Step2, Step3, Step4, Step5];

export const Steps = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoTimerEnabled, setAutoTimerEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation values
  const slideOffset = useSharedValue(0);
  const opacity = useSharedValue(1);
  const textOpacity = useSharedValue(1);

  // Auto-advance timer effect
  useEffect(() => {
    if (autoTimerEnabled) {
      // Add initial delay for first step to account for render delay
      const initialDelay = setTimeout(() => {
        timerRef.current = setInterval(() => {
          setCurrentStep(prevStep => {
            const nextStep = (prevStep + 1) % stepTexts.length;
            // Call goToStep with the current prevStep and nextStep to ensure correct direction
            setTimeout(() => goToStep(prevStep, nextStep), 0);
            return prevStep; // Don't change state here, let goToStep handle it
          });
        }, 5000); // Changed from 3000 to 5000 (5 seconds)

        return () => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        };
      }, 3000); // 3 second initial delay

      return () => {
        clearTimeout(initialDelay);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTimerEnabled]); // Only depend on autoTimerEnabled

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const disableAutoTimer = () => {
    setAutoTimerEnabled(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleManualSwipe = (step: number) => {
    // Disable auto timer on first manual swipe
    if (autoTimerEnabled) {
      disableAutoTimer();
    }
    goToStep(currentStep, step);
  };

  const flingLeftGesture = Gesture.Fling()
    .runOnJS(true)
    .direction(Directions.LEFT)
    .onStart(() => {
      if (currentStep < stepTexts.length - 1) {
        runOnJS(handleManualSwipe)(currentStep + 1);
      }
    });

  const flingRightGesture = Gesture.Fling()
    .runOnJS(true)
    .direction(Directions.RIGHT)
    .onStart(() => {
      if (currentStep > 0) {
        runOnJS(handleManualSwipe)(currentStep - 1);
      }
    });

  const composedGesture = Gesture.Simultaneous(
    flingLeftGesture,
    flingRightGesture
  );

  const CurrentStepComponent = stepComponents[currentStep];

  // Animated styles for the step content
  const stepAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideOffset.value }],
      opacity: opacity.value,
    };
  });

  const goToStep = (fromStep: number, toStep: number) => {
    if (toStep >= 0 && toStep < stepTexts.length && !isAnimating) {
      setIsAnimating(true);

      // Animate current step out - start sliding first, fade out later
      // Forward progression (next step) slides current content left, backward slides current content right
      slideOffset.value = withTiming(
        toStep > fromStep ? -300 : 300, // Current content slides left for next, right for prev
        { duration: 300, easing: Easing.out(Easing.cubic) }
      );

      // Fade out the text at the same time as the step content
      textOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });

      // Delay the fade out so the outgoing component stays visible longer
      setTimeout(() => {
        opacity.value = withTiming(0, {
          duration: 150, // Faster fade out since it's delayed
          easing: Easing.out(Easing.cubic),
        });
      }, 150); // Start fading after 150ms instead of immediately

      // After slide animation completes, change step and animate new one in
      setTimeout(() => {
        setCurrentStep(toStep);
        // New step starts from opposite side - if current slid left, new comes from right
        slideOffset.value = toStep > fromStep ? 300 : -300; // Start from opposite side
        opacity.value = 0;
        textOpacity.value = 0; // Keep text faded out

        // Animate new step in
        slideOffset.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        textOpacity.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });

        setTimeout(() => setIsAnimating(false), 300);
      }, 300);
    }
  };

  return (
    <Column $gap={16} $justifyContent="space-between" style={{ flex: 1 }}>
      <Column $width="100%" $justifyContent="flex-start" $gap={16}>
        {/* Step Text */}
        <Animated.View
          style={{ opacity: textOpacity, width: "75%", alignSelf: "center" }}
        >
          <Body1Emphasized style={{ textAlign: "center" }}>
            {t(stepTexts[currentStep])}
          </Body1Emphasized>
        </Animated.View>

        {/* Step Indicators */}
        <Row $justifyContent="center" $gap={8}>
          {stepTexts.map((_, index) => (
            <StepIndicator key={index} $active={index === currentStep} />
          ))}
        </Row>
      </Column>

      {/* Current Step Component with Animation */}
      <GestureDetector gesture={composedGesture}>
        <View style={{ width: "100%", paddingBottom: 16, overflow: "hidden" }}>
          <Animated.View style={stepAnimatedStyle}>
            <CurrentStepComponent disableAutoTimer={disableAutoTimer} />
          </Animated.View>
        </View>
      </GestureDetector>
    </Column>
  );
};

const StepIndicator = styled.View<{ $active: boolean }>`
  width: ${({ $active }: { $active: boolean }) => ($active ? "24px" : "8px")};
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
