import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Linking, Platform } from "react-native";

import RektLogo from "@/assets/images/rekt-logo.svg";
import { midFireUrl } from "@/assets/videos";
import {
  BiometricAuthScreen,
  Column,
  CompleteProfileForm,
  PrimaryButton,
  ScreenContainer,
  WalletConnectionModal,
} from "@/components";
import { SolanaAuthScreen } from "@/components/SolanaAuthScreen";
import { useAppContext, useAuth, useWallet } from "@/contexts";
import { LoadingScreen } from "@/screens";
import { Steps } from "@/screens/LoginScreen/Steps";

import AsyncStorage from "@react-native-async-storage/async-storage";

import bs58 from "bs58";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import nacl from "tweetnacl";

const Index = () => {
  const {
    isLoggedIn,
    setIsLoggedIn,
    showCompleteProfileForm,
    setShowCompleteProfileForm,
    requiresBiometric,
  } = useAppContext();
  const { session, signInWithSolana } = useAuth();
  const {
    connecting,
    connected,
    showWalletModal,
    setShowWalletModal,
    connect,
    sharedSecret,
    publicKey,
    getSIWSData,
  } = useWallet();
  const { t } = useTranslation();
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [showSolanaAuth, setShowSolanaAuth] = useState(false);

  const [forceRefresh, setForceRefresh] = useState(0);

  const handleSignUpComplete = () => {
    setIsLoggedIn(true);
    setShowCompleteProfileForm(false);
    setShowSolanaAuth(false);
  };

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    setShowSolanaAuth(false);
  };

  const handleSignUpRequired = () => {
    setShowSolanaAuth(false);
    setShowCompleteProfileForm(true);
  };

  // Check if user is authenticated and has completed profile before redirecting
  useEffect(() => {
    if (isLoggedIn && !requiresBiometric && !showCompleteProfileForm) {
      setForceRefresh(prev => prev + 1);
      const delay = 50;
      setTimeout(() => {
        router.replace("/(tabs)");
      }, delay);
    }
    if (!session?.user?.id) {
      setShowCompleteProfileForm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, requiresBiometric, showCompleteProfileForm, session]);

  // Initial connection check - give some time for session to load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingConnection(false);
    }, 1000); // Allow time for session check

    return () => clearTimeout(timer);
  }, []);

  // Handle wallet connection success
  useEffect(() => {
    if (connected && !isLoggedIn) {
      // User is connected to wallet but not logged in, show Solana authentication
      console.log("🔗 Wallet connected, starting authentication flow...");
      setIsCheckingConnection(true);
      setTimeout(() => {
        // On Android, wait for SIWS data. On iOS, proceed without SIWS data.
        if (getSIWSData() || Platform.OS === "ios") {
          console.log("🔗 Showing SolanaAuthScreen...");
          setShowSolanaAuth(true);
          setIsCheckingConnection(false);
        } else {
          console.log("⚠️ No SIWS data found and not iOS - staying in loading");
        }
      }, 800); // Brief delay for smooth transition
    } else if (connected && isLoggedIn) {
      // User is already logged in, don't show auth screen
      setIsCheckingConnection(false);
    } else if (!connected) {
      // User not connected, reset states
      setShowSolanaAuth(false);
      setIsCheckingConnection(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, isLoggedIn]);

  // Handle auth redirects from Phantom
  useEffect(() => {
    const handleAuthRedirect = async (url: string) => {
      if (url.includes("auth=true") && url.includes("data")) {
        try {
          // Parse the URL to get the encrypted data
          const urlObj = new URL(url);
          const data = urlObj.searchParams.get("data");
          const nonce = urlObj.searchParams.get("nonce");

          if (data && nonce && sharedSecret && publicKey) {
            // Decrypt the response using existing shared secret
            const decryptedData = nacl.box.open.after(
              bs58.decode(data),
              bs58.decode(nonce),
              sharedSecret
            );

            if (decryptedData) {
              const responseData = JSON.parse(
                global.Buffer.from(decryptedData).toString("utf8")
              );

              if (responseData.signature) {
                // Convert signature from base58 to base64 (to match Android format)
                const signatureBytes = bs58.decode(responseData.signature);
                const base64Signature =
                  Buffer.from(signatureBytes).toString("base64");

                // Store the signature for SolanaAuthScreen to handle authentication
                // This follows the same pattern as Android where SolanaAuthScreen handles the auth flow
                await AsyncStorage.setItem("auth_signature", base64Signature);
              }
            }
          }
        } catch (error) {
          console.error("Error processing auth redirect:", error);
        }
      }
    };
    // Handle initial URL if app was opened via auth redirect
    Linking.getInitialURL().then(url => {
      if (url) {
        handleAuthRedirect(url);
      }
    });

    // Listen for URL changes while app is running
    const subscription = Linking.addEventListener("url", event => {
      handleAuthRedirect(event.url);
    });

    return () => subscription?.remove();
  }, [
    sharedSecret,
    publicKey,
    signInWithSolana,
    setShowCompleteProfileForm,
    setIsLoggedIn,
  ]);

  const player = useVideoPlayer(midFireUrl, player => {
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
    return <BiometricAuthScreen key="biometric-auth" />;
  }

  const connectWallet = () => {
    if (Platform.OS === "ios") {
      setShowWalletModal(true);
    } else {
      connect(() => setShowSolanaAuth(true));
    }
  };

  // const connectWallet = () => router.push("/(tabs)");

  // Show Solana authentication screen after wallet connection
  if (showSolanaAuth) {
    return (
      <ScreenContainer
        alignItems="stretch"
        justifyContent="flex-start"
        noPadding
        contentContainerStyle={{ flex: 1, position: "relative" }}
      >
        <Column $width="100%" $height="100%" $justifyContent="flex-start">
          <VideoView
            player={player}
            style={{
              width: "100%",
              height: "50%",
              position: "absolute",
              bottom: 0,
            }}
            pointerEvents="none"
            nativeControls={false}
          />
          <SolanaAuthScreen
            onAuthSuccess={handleAuthSuccess}
            onSignUpRequired={handleSignUpRequired}
          />
        </Column>
      </ScreenContainer>
    );
  }

  if (showCompleteProfileForm) {
    return (
      <ScreenContainer
        alignItems="stretch"
        justifyContent="flex-start"
        noPadding
        contentContainerStyle={{ flex: 1, position: "relative" }}
      >
        <Column $width="100%" $height="100%" $justifyContent="flex-start">
          <VideoView
            player={player}
            style={{
              width: "100%",
              height: "50%",
              position: "absolute",
              bottom: 0,
            }}
            pointerEvents="none"
            nativeControls={false}
          />
          <CompleteProfileForm onComplete={handleSignUpComplete} />
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
      alignItems="stretch"
      justifyContent="flex-start"
      noPadding
      contentContainerStyle={{ flex: 1, position: "relative" }}
    >
      <Column $height="100%" $justifyContent="flex-start">
        <Column $width="100%" $padding={12} $justifyContent="flex-start">
          <Animated.View
            style={{
              alignItems: "center",
              transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
            }}
          >
            <RektLogo width={100} height={100} />
          </Animated.View>
        </Column>

        <AnimatedStepsContainer style={{ opacity: welcomeOpacity }}>
          <Steps />
        </AnimatedStepsContainer>

        <VideoView
          player={player}
          style={{
            width: "100%",
            height: "50%",
            position: "absolute",
            bottom: 0,
          }}
          pointerEvents="none"
          nativeControls={false}
        />
      </Column>
      <AnimatedButtonsContainer style={{ opacity: welcomeOpacity }}>
        <PrimaryButton
          onPress={() => {
            if (__DEV__ && process.env.EXPO_PUBLIC_SKIP_AUTH === "true") {
              router.push("/(tabs)");
            } else {
              connectWallet();
            }
          }}
          disabled={connecting}
        >
          {connecting ? t("Connecting...") : t("Connect Wallet")}
        </PrimaryButton>
      </AnimatedButtonsContainer>
      {showWalletModal && (
        <WalletConnectionModal
          visible={showWalletModal}
          onRequestClose={() => setShowWalletModal(false)}
          onConnectionSuccess={() => setShowSolanaAuth(true)}
        />
      )}
    </ScreenContainer>
  );
};

export default Index;

const AnimatedStepsContainer = styled(Animated.View)`
  height: 100%;
  z-index: 10;
  width: 100%;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: flex-start;
  margin-bottom: 84px;
`;

const AnimatedButtonsContainer = styled(Animated.View)`
  position: absolute;
  width: 100%;
  bottom: 32px;
  z-index: 100;
  padding: 0 12px;
`;
