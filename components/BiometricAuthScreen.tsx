import { useEffect, useState } from "react";
import { Alert } from "react-native";

import { useAppContext } from "@/contexts";
import { useBiometrics } from "@/hooks";

import { Column, PrimaryButton, ScreenContainer, Title1 } from "./common";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme } from "styled-components/native";

export const BiometricAuthScreen = () => {
  const { t } = useTranslation();
  const { authenticateWithBiometrics, requiresBiometric } = useAppContext();
  const { biometricType, isSupported, isEnrolled } = useBiometrics();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto-trigger biometric authentication when screen loads
  useEffect(() => {
    if (isSupported && isEnrolled && requiresBiometric && !isAuthenticating) {
      handleBiometricAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, isEnrolled, requiresBiometric]);

  // If requiresBiometric is false, this component shouldn't render
  if (!requiresBiometric) {
    return null;
  }

  const handleBiometricAuth = async () => {
    if (isAuthenticating) return;

    try {
      setIsAuthenticating(true);
      const success = await authenticateWithBiometrics();

      if (!success) {
        Alert.alert(
          t("Authentication Failed"),
          t("Please try again or restart the app to use a different method.")
        );
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      Alert.alert(
        t("Authentication Error"),
        t("Unable to authenticate. Please try again.")
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <ScreenContainer>
      <Column
        $gap={32}
        $alignItems="center"
        $justifyContent="center"
        style={{ flex: 1 }}
      >
        <BiometricIcon>🔒</BiometricIcon>
        <Column $gap={16} $alignItems="center">
          <Title1 style={{ textAlign: "center" }}>
            {t("Authentication Required")}
          </Title1>
          <Description>
            {t("Use {{biometricType}} to access your account", {
              biometricType,
            })}
          </Description>
        </Column>
        <PrimaryButton
          onPress={handleBiometricAuth}
          disabled={isAuthenticating}
        >
          {isAuthenticating
            ? t("Authenticating...")
            : t("Authenticate with {{biometricType}}", { biometricType })}
        </PrimaryButton>
      </Column>
    </ScreenContainer>
  );
};

const BiometricIcon = styled.Text`
  font-size: 64px;
`;

const Description = styled.Text`
  font-size: 16px;
  font-family: "Geist";
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textSecondary};
  text-align: center;
  line-height: 24px;
`;
