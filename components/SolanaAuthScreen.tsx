import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform } from "react-native";

import { BodyS, Column, Title1 } from "@/components/common";
import { useAppContext, useAuth, useWallet } from "@/contexts";
import { LoadingScreen } from "@/screens/LoadingScreen";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";
import { Toast } from "toastify-react-native";
interface SolanaAuthScreenProps {
  onAuthSuccess: () => void;
  onSignUpRequired: () => void;
}

export const SolanaAuthScreen = ({
  onAuthSuccess,
  onSignUpRequired,
}: SolanaAuthScreenProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { signInWithSolana, loading: authLoading, session } = useAuth();
  const { isLoggedIn } = useAppContext();
  const { publicKey, getSIWSData, generateAuthMessage, signAuthMessage } =
    useWallet();

  const [authStep, setAuthStep] = useState<
    "verifying" | "completed" | "signup_required" | "signing_message"
  >("verifying");
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitiatedAuthRef = useRef(false);

  const handleSolanaAuth = useCallback(async () => {
    // Prevent multiple simultaneous auth attempts
    if (
      isProcessingRef.current ||
      !isMountedRef.current ||
      hasInitiatedAuthRef.current
    ) {
      return;
    }

    isProcessingRef.current = true;
    hasInitiatedAuthRef.current = true;
    if (!publicKey) {
      Toast.show({
        text1: t("Error"),
        text2: t("Wallet not connected"),
        type: "error",
      });
      isProcessingRef.current = false;
      return;
    }

    try {
      console.log("🚀 Starting Solana authentication flow...");
      console.log("🔍 [DEBUG] Session state:", {
        hasSession: !!session,
        sessionUser: session?.user?.id,
        isLoggedIn,
        authStep,
      });

      // Check if user already has a valid session AND is logged in
      if (session && isLoggedIn) {
        setAuthStep("completed");
        onAuthSuccess();
        return;
      }

      // Get SIWS data from wallet authorization (already signed during connection)
      const siwsData = getSIWSData();
      if (!siwsData) {
        // On iOS, SIWS data doesn't exist yet - we need to trigger message signing
        if (Platform.OS === "ios") {
          // iOS requires separate message signing flow
          await handleiOSMessageSigning();
          return;
        } else {
          // On Android, this shouldn't happen - redirect back to login screen
          console.log(
            "❌ No SIWS data found on Android - redirecting to login"
          );
          router.replace("/");
          return;
        }
      }

      // Use SIWS data for authentication
      console.log("✅ Using existing SIWS data from wallet authorization");

      // Authenticate with backend using existing SIWS data
      await authenticateWithBackend(
        siwsData.signed_message,
        siwsData.signature
      );
    } catch (error) {
      console.error("Solana authentication error:", error);

      Toast.show({
        text1: t("Authentication Failed"),
        text2: error instanceof Error ? error.message : t("Please try again"),
        type: "error",
      });
      setAuthStep("verifying"); // Stay in verifying state for retry
      hasInitiatedAuthRef.current = false; // Reset on error to allow retry
    } finally {
      isProcessingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, getSIWSData]);

  const authenticateWithBackend = useCallback(
    async (message: string, signature: string) => {
      if (!publicKey) return;

      try {
        setAuthStep("verifying");

        console.log("🔐 Calling signInWithSolana with:", {
          publicKey: publicKey.toBase58(),
          messagePreview: message.substring(0, 50) + "...",
          signaturePreview: signature.substring(0, 20) + "...",
        });

        const result = await signInWithSolana(
          publicKey.toBase58(),
          message,
          signature
        );

        console.log("🎯 signInWithSolana result:", {
          success: result.success,
          isNewUser: result.isNewUser,
          hasUser: !!result.user,
          error: result.error,
        });

        if (result.success) {
          if (result.isNewUser) {
            // User needs to sign up
            console.log("👤 New user detected, showing signup form");
            setAuthStep("signup_required");
            onSignUpRequired();
          } else {
            // User exists and is authenticated
            console.log("✅ Existing user authenticated successfully");
            setAuthStep("completed");
            Toast.show({
              text1: t("Welcome Back!"),
              text2: t("Successfully authenticated"),
              type: "success",
            });
            onAuthSuccess();
          }
        } else {
          throw new Error(result.error || "Authentication failed");
        }
      } catch (error) {
        console.error("Backend authentication error:", error);
        Toast.show({
          text1: t("Authentication Failed"),
          text2: error instanceof Error ? error.message : t("Please try again"),
          type: "error",
        });
        setAuthStep("verifying");
        hasInitiatedAuthRef.current = false; // Reset on error to allow retry        isProcessingRef.current = false; // Reset processing flag on error
        hasInitiatedAuthRef.current = false; // Reset on error to allow retry
      }
    },
    [publicKey, signInWithSolana, onSignUpRequired, onAuthSuccess, t]
  );

  const handleiOSMessageSigning = useCallback(async () => {
    setAuthStep("signing_message");

    try {
      // Generate authentication message
      const message = generateAuthMessage();

      // Sign the message with Phantom
      const result = await signAuthMessage(message);

      if (result.success && result.signature) {
        if (result.signature === "PENDING_AUTH_REDIRECT") {
          // Start polling for the signature from auth redirect
          pollForAuthSignature(message);
          return;
        }

        // Now authenticate with the signed message
        await authenticateWithBackend(message, result.signature);
      } else {
        throw new Error(result.error || "Message signing failed");
      }
    } catch (error) {
      console.error("Message signing failed:", error);
      Toast.show({
        text1: t("Message Signing Failed"),
        text2: error instanceof Error ? error.message : t("Please try again"),
        type: "error",
      });
      setAuthStep("verifying");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateAuthMessage, signAuthMessage, authenticateWithBackend]);

  // Poll for signature from auth redirect (iOS only)
  const pollForAuthSignature = useCallback(
    async (message: string) => {
      const maxAttempts = 30; // 30 seconds max
      let attempts = 0;

      const poll = async () => {
        try {
          // Check if component is still mounted and not already processing
          if (!isMountedRef.current) {
            return;
          }

          const storedSignature = await AsyncStorage.getItem("auth_signature");
          if (storedSignature) {
            // Clear the stored signature immediately to prevent duplicate processing
            await AsyncStorage.removeItem("auth_signature");
            // Process the authentication
            await authenticateWithBackend(message, storedSignature);
            return;
          }

          attempts++;
          if (attempts < maxAttempts && isMountedRef.current) {
            pollingTimeoutRef.current = setTimeout(poll, 1000); // Check every second
          } else if (attempts >= maxAttempts) {
            console.error("Authentication timeout waiting for signature");
            if (isMountedRef.current) {
              setAuthStep("verifying");
              Toast.show({
                text1: t("Authentication Timeout"),
                text2: t("Please try again"),
                type: "error",
              });
            }
          }
        } catch (error) {
          console.error("Error polling for signature:", error);
          if (isMountedRef.current) {
            setAuthStep("verifying");
          }
        }
      };

      poll();
    },
    [authenticateWithBackend, t]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isProcessingRef.current = false;
      hasInitiatedAuthRef.current = false;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, []);

  // Single useEffect to trigger auth when component mounts and wallet is ready
  useEffect(() => {
    if (
      publicKey &&
      authStep === "verifying" &&
      !isProcessingRef.current &&
      isMountedRef.current &&
      !hasInitiatedAuthRef.current
    ) {
      console.log("🔄 Triggering authentication flow...");
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleSolanaAuth();
      }, 100);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, authStep]); // Removed handleSolanaAuth from dependencies to prevent multiple calls

  // Remove the embedded SignUpForm - this is now handled by the parent component

  if (
    authLoading ||
    authStep === "verifying" ||
    authStep === "signing_message"
  ) {
    return (
      <Container>
        <LoadingScreen />
        <Column
          $gap={16}
          $alignItems="center"
          style={{ position: "absolute", top: "50%" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Title1 style={{ textAlign: "center" }}>
            {t("Authenticating...")}
          </Title1>
          <BodyS style={{ textAlign: "center", opacity: 0.7 }}>
            {t("Checking your credentials with the server")}
          </BodyS>
        </Column>
      </Container>
    );
  }

  return null;
};

const Container = styled.View`
  flex: 1;
  width: 100%;
  max-width: 100%;
  background-color: ${({ theme }: { theme: any }) => theme.colors.background};
`;
