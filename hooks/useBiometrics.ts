import { useEffect, useState } from "react";
import { Alert } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as LocalAuthentication from "expo-local-authentication";
import { useTranslation } from "react-i18next";

const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export const useBiometrics = () => {
  const { t } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsSupported(compatible);
      setIsEnrolled(enrolled);

      // Determine biometric type for display
      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        setBiometricType("Face ID");
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        )
      ) {
        setBiometricType("Touch ID");
      } else if (
        supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
      ) {
        setBiometricType("Iris");
      } else {
        setBiometricType("Biometrics");
      }
    } catch (error) {
      console.error("Error checking biometric support:", error);
      setIsSupported(false);
      setIsEnrolled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("Authenticate with {{biometricType}}", {
          biometricType,
        }),
        cancelLabel: t("Cancel"),
        fallbackLabel: t("Use Passcode"),
      });

      return result.success;
    } catch (error) {
      console.error("Biometric authentication error:", error);
      Alert.alert(
        t("Authentication Error"),
        t("Unable to authenticate with biometrics. Please try again.")
      );
      return false;
    }
  };

  const enableBiometrics = async (): Promise<boolean> => {
    if (!isSupported || !isEnrolled) {
      Alert.alert(
        t("Biometrics Not Available"),
        t(
          "{{biometricType}} is not set up on this device. Please set it up in Settings first.",
          { biometricType }
        )
      );
      return false;
    }

    const success = await authenticateWithBiometrics();
    if (success) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
      return true;
    }
    return false;
  };

  const disableBiometrics = async () => {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  };

  const isBiometricEnabled = async (): Promise<boolean> => {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === "true";
    } catch (error) {
      console.error("Error checking biometric enabled status:", error);
      return false;
    }
  };

  return {
    isSupported,
    isEnrolled,
    biometricType,
    isLoading,
    authenticateWithBiometrics,
    enableBiometrics,
    disableBiometrics,
    isBiometricEnabled,
  };
};
