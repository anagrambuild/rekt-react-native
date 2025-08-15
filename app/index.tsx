import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';

import RektLogo from '@/assets/images/rekt-logo.svg';
import { midFireUrl } from '@/assets/videos';
import {
  BiometricAuthScreen,
  Column,
  PrimaryButton,
  ScreenContainer,
  SignUpForm,
  WalletConnectionModal,
} from '@/components';
import { useAppContext, useWallet } from '@/contexts';
import { LoadingScreen } from '@/screens';
import { Step1 } from '@/screens/LoginScreen';

import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components/native';

const Index = () => {
  const {
    isLoggedIn,
    setIsLoggedIn,
    showSignUpForm,
    setShowSignUpForm,
    requiresBiometric,
  } = useAppContext();
  const {
    connecting,
    connected,
    showWalletModal,
    setShowWalletModal,
    connect,
  } = useWallet();
  const { t } = useTranslation();
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(0);

  const handleSignUpComplete = () => {
    setIsLoggedIn(true);
    setShowSignUpForm(false);
  };

  // Check if user is already authenticated and redirect to tabs
  useEffect(() => {
    if (isLoggedIn && !requiresBiometric) {
      setForceRefresh((prev) => prev + 1);
      const delay = 50;
      setTimeout(() => {
        router.replace('/(tabs)');
      }, delay);
    }
  }, [isLoggedIn, requiresBiometric]);

  // Initial connection check - give some time for session to load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingConnection(false);
    }, 1000); // Allow time for session check

    return () => clearTimeout(timer);
  }, []);

  // Handle wallet connection success
  useEffect(() => {
    if (connected) {
      // User is connected to wallet, show signup form
      setIsCheckingConnection(true);
      setTimeout(() => {
        setShowSignUpForm(true);
        setIsCheckingConnection(false);
      }, 800); // Brief delay for smooth transition
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, showSignUpForm]);

  const player = useVideoPlayer(midFireUrl, (player) => {
    player.loop = true;
    player.play();
  });

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(300)).current;
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
              toValue: 20, // moves the logo to the top
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

  // Show biometric authentication screen if required
  if (requiresBiometric) {
    return <BiometricAuthScreen key='biometric-auth' />;
  }

  // const connectWallet = () => {
  //   if (Platform.OS === 'ios') {
  //     setShowWalletModal(true);
  //   } else {
  //     connect();
  //   }
  // };

  const connectWallet = () => router.push('/(tabs)');

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
            nativeControls={false}
          />
          <SignUpForm onComplete={handleSignUpComplete} />
        </Column>
      </ScreenContainer>
    );
  }

  // Check if user is already authenticated and should be redirected
  if (isLoggedIn && !requiresBiometric) {
    return <LoadingScreen />; // Show loading while redirecting
  }

  return (
    <ScreenContainer
      key={`index-${forceRefresh}`}
      alignItems='stretch'
      justifyContent='flex-start'
      noPadding
      contentContainerStyle={{ flex: 1, position: 'relative' }}
    >
      <Column $height='100%' $justifyContent='space-between'>
        <Column $width='100%' $padding={12} $justifyContent='flex-start'>
          <Animated.View
            style={{
              alignItems: 'center',
              transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
            }}
          >
            <RektLogo width={100} height={100} />
          </Animated.View>
        </Column>

        <AnimatedButtonsContainer style={{ opacity: welcomeOpacity }}>
          <Step1 />
          <PrimaryButton onPress={connectWallet} disabled={connecting}>
            {connecting ? t('Connecting...') : t('Connect Wallet')}
          </PrimaryButton>
        </AnimatedButtonsContainer>
        <VideoView
          player={player}
          style={{ width: '100%', height: '50%' }}
          pointerEvents='none'
          nativeControls={false}
        />
      </Column>
      {showWalletModal && (
        <WalletConnectionModal
          visible={showWalletModal}
          onRequestClose={() => setShowWalletModal(false)}
        />
      )}
    </ScreenContainer>
  );
};

export default Index;

const AnimatedButtonsContainer = styled(Animated.View)`
  padding: 8px;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 32px;
  z-index: 10;
  width: 100%;
  align-items: center;
  gap: 12px;
`;
