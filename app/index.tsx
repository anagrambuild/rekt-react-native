import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

import RektLogo from '@/assets/images/rekt-logo.svg';
import { midFireUrl } from '@/assets/videos';
import {
  Column,
  PrimaryButton,
  ScreenContainer,
  SignUpForm,
  WalletConnectionModal,
} from '@/components';
import { useAppContext, useWallet } from '@/contexts';
import { LoadingScreen } from '@/screens';

import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components/native';

const Index = () => {
  const { isLoggedIn, setIsLoggedIn, showSignUpForm, setShowSignUpForm } =
    useAppContext();
  const {
    connect,
    connecting,
    connected,
    showWalletModal,
    setShowWalletModal,
  } = useWallet();
  const { t } = useTranslation();
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  const handleSignUpComplete = () => {
    setIsLoggedIn(true);
    setShowSignUpForm(false);
  };
  // Initial connection check - give some time for persistent state to load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingConnection(false);
    }, 500); // Short delay to allow persistent state to be checked

    return () => clearTimeout(timer);
  }, []);

  // Function to check if user is logged in and redirect
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn]);

  // Handle wallet connection success
  useEffect(() => {
    if (connected) {
      // Show loading for a brief moment to smooth the transition
      setIsCheckingConnection(true);
      setTimeout(() => {
        setShowSignUpForm(true);
        setIsCheckingConnection(false);
      }, 800); // Brief delay for smooth transition
    }
  }, [connected, setShowSignUpForm]);

  const player = useVideoPlayer(midFireUrl, (player) => {
    player.loop = true;
    player.play();
  });

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(60)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timeout1: ReturnType<typeof setTimeout>;
    let timeout2: ReturnType<typeof setTimeout>;
    // Start scale animation after 2s
    timeout1 = setTimeout(() => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }).start(() => {
        // After scale animation, wait 1s, then move up
        timeout2 = setTimeout(() => {
          Animated.parallel([
            Animated.timing(translateYAnim, {
              toValue: -140, // moves the logo up
              duration: 800,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.exp),
            }),
            Animated.timing(welcomeOpacity, {
              toValue: 1,
              duration: 1000,
              delay: 600,
              useNativeDriver: true,
              easing: Easing.out(Easing.exp),
            }),
          ]).start();
        }, 1000);
      });
    }, 2000);
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [scaleAnim, translateYAnim, welcomeOpacity]);

  // Show loading screen while checking connection or connecting
  if (isCheckingConnection || connecting) {
    return <LoadingScreen />;
  }

  // Show sign-up form after wallet connection
  if (showSignUpForm) {
    return (
      <ScreenContainer
        alignItems='stretch'
        justifyContent='flex-start'
        noPadding
        contentContainerStyle={{ flex: 1, position: 'relative' }}
      >
        <Column $width='100%' $height='100%' $justifyContent='flex-start'>
          <VideoView
            player={player}
            style={{
              width: '100%',
              height: '50%',
              position: 'absolute',
              bottom: 0,
            }}
            pointerEvents='none'
          />
          <SignUpForm onComplete={handleSignUpComplete} />
        </Column>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      alignItems='stretch'
      justifyContent='flex-start'
      noPadding
      contentContainerStyle={{ flex: 1, position: 'relative' }}
    >
      <Column $width='100%' $height='100%' $justifyContent='flex-end'>
        <Column
          $width='100%'
          $padding={24}
          $justifyContent='flex-end'
          style={{ height: '50%' }}
        >
          <Animated.View
            style={{
              alignItems: 'center',
              transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
            }}
          >
            <RektLogo width={100} height={100} />
          </Animated.View>
          <AnimatedTitle1 style={{ opacity: welcomeOpacity }}>
            {t('Welcome')}
          </AnimatedTitle1>
        </Column>
        <AnimatedButtonsContainer style={{ opacity: welcomeOpacity }}>
          <PrimaryButton onPress={connect} disabled={connecting}>
            {connecting ? t('Connecting...') : t('Connect wallet')}
          </PrimaryButton>
        </AnimatedButtonsContainer>
        <VideoView
          player={player}
          style={{ width: '100%', height: '50%' }}
          pointerEvents='none'
        />
      </Column>
      <WalletConnectionModal
        visible={showWalletModal}
        onRequestClose={() => setShowWalletModal(false)}
      />
    </ScreenContainer>
  );
};

export default Index;

const AnimatedTitle1 = styled(Animated.Text)`
  font-size: 32px;
  font-family: 'Unbounded';
  font-weight: 400;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
`;

const AnimatedButtonsContainer = styled(Animated.View)`
  padding: 16px;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 32px;
  z-index: 10;
  width: 100%;
  align-items: center;
  gap: 12px;
`;
