import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  TextInput,
  TouchableOpacity,
} from "react-native";

import RektLogo from "@/assets/images/rekt-logo.svg";
import { useAppContext, useAuth, useWallet } from "@/contexts";
import { useBiometrics, useImagePicker, useUsernameValidation } from "@/hooks";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { useCreateUserMutation } from "@/utils/queryUtils";
import { supabase } from "@/utils/supabase";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  BodyS,
  Card,
  Column,
  Input,
  PrimaryButton,
  Row,
  Switch,
  Title1,
} from "./common";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme } from "styled-components/native";
import { Toast } from "toastify-react-native";

interface completeProfileFormProps {
  onComplete?: () => void;
}

export const CompleteProfileForm = ({ onComplete }: completeProfileFormProps) => {
  const { t } = useTranslation();
  const { sendOTP, signOut, verifyOTP, signInWithSolana, loading: authLoading, session } = useAuth();
  const { publicKey, connected, generateAuthMessage, signMessage } = useWallet();
  const { takePhoto, pickFromLibrary, isLoading } = useImagePicker();
  const { isSupported, isEnrolled, biometricType, enableBiometrics } =
    useBiometrics();
  const theme = useTheme();
  const { completeProfileForm, setCompleteProfileForm, setUserProfile } = useAppContext();

  // Use the unified username validation hook
  const usernameValidation = useUsernameValidation(completeProfileForm.username);

  // React Query mutation for user creation
  const createUserMutation = useCreateUserMutation({
    onSuccess: user => {
      console.log(" 2705 User created successfully via React Query");
      console.log(" 1f464 User:", user);

      // Show success toast
      Toast.show({
        text1: t("Account Created Successfully"),
        text2: t("Welcome to Rekt!"),
        type: "success",
      });

      // Update app state with the newly created user
      setUserProfile(user);

      // Clear the form after successful creation
      setCompleteProfileForm({
        username: "",
        email: "",
        profileImage: null,
        enableBiometrics: false,
      });

      // Clear any error states
      setEmailError("");
      setOtpError("");
      setOtpSent(false);
      setOtp("");

      onComplete?.();
    },
    onError: error => {
      console.error(" 274c User creation failed:", error);
      Toast.show({
        text1: t("Error"),
        text2:
          error instanceof Error ? error.message : t("Account creation failed"),
        type: "error",
      });
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const handleUsernameChange = (text: string) => {
    setCompleteProfileForm(prev => ({ ...prev, username: text }));
  };

  const emailInputRef = useRef<TextInput>(null);

  const onNext = () => {
    emailInputRef.current?.focus();
  };

  const handleEmailChange = (text: string) => {
    setCompleteProfileForm(prev => ({ ...prev, email: text }));

    // Clear previous error
    if (emailError) setEmailError("");

    // Validate email format if not empty (email is optional)
    if (text.trim() && text.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        setEmailError(t("Please enter a valid email address"));
      }
    }
  };

  const handleOtpChange = (text: string) => {
    setOtp(text);
    if (otpError) setOtpError("");
  };

  const handleImagePicker = () => {
    Alert.alert(t("Upload"), "", [
      {
        text: t("Take photo"),
        onPress: async () => {
          const photo = await takePhoto();
          if (photo) {
            setCompleteProfileForm(prev => ({ ...prev, profileImage: photo.uri }));
          }
        },
      },
      {
        text: t("Choose from library"),
        onPress: async () => {
          const photo = await pickFromLibrary();
          if (photo) {
            setCompleteProfileForm(prev => ({ ...prev, profileImage: photo.uri }));
          }
        },
      },
      { text: t("Cancel"), style: "cancel" },
    ]);
  };

  const validateForm = () => {
    if (!completeProfileForm.username.trim()) {
      return false;
    }
    // Email is now optional unless using OTP flow
    if (otpSent && !completeProfileForm.email.trim()) {
      setEmailError(t("Email is required for OTP verification"));
      return false;
    }
    if (otpSent && !otp.trim()) {
      setOtpError(t("OTP is required"));
      return false;
    }
    if (otpSent && otp.length !== 6) {
      setOtpError(t("OTP must be 6 digits"));
      return false;
    }
    return true;
  };

  const handleBiometricToggle = async () => {
    if (!completeProfileForm.enableBiometrics) {
      // User wants to enable biometrics
      const success = await enableBiometrics();
      if (success) {
        setCompleteProfileForm(prev => ({ ...prev, enableBiometrics: true }));
      }
    } else {
      // User wants to disable biometrics
      setCompleteProfileForm(prev => ({ ...prev, enableBiometrics: false }));
    }
  };

  const handleSendOTP = async () => {
    if (!completeProfileForm.email.trim()) {
      setEmailError(t("Email is required"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(completeProfileForm.email)) {
      setEmailError(t("Please enter a valid email address"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendOTP(completeProfileForm.email);
      if (result.success) {
        setOtpSent(true);
        Toast.show({
          text1: t("Code Sent"),
          text2: t("Check your email for the verification code"),
          type: "success",
        });
      } else {
        throw new Error(result.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send Code error:", error);
      Toast.show({
        text1: t("Error"),
        text2: t("Failed to send OTP. Please try again."),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Check if wallet is connected
    if (!connected || !publicKey) {
      Toast.show({
        text1: t("Wallet Not Connected"),
        text2: t("Please connect your wallet first"),
        type: "error",
      });
      return;
    }

    // Check required validation first
    if (!usernameValidation.validateRequired()) {
      return;
    }

    // Check username validation using the hook
    if (!usernameValidation.isValid) {
      if (usernameValidation.isChecking) {
        Toast.show({
          text1: t("Please wait"),
          text2: t("Checking username availability..."),
          type: "info",
        });
        return;
      }
      if (usernameValidation.hasError) {
        Toast.show({
          text1: t("Invalid Username"),
          text2: usernameValidation.error,
          type: "error",
        });
        return;
      }
      // Generic validation failure
      Toast.show({
        text1: t("Invalid Username"),
        text2: t("Please check your username and try again"),
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {

      if (!session?.access_token) {
        throw new Error("No session found after authentication");
      }

      // Store biometric preference if enabled
      if (completeProfileForm.enableBiometrics) {
        await AsyncStorage.setItem("biometric_enabled", "true");
      } else {
        await AsyncStorage.setItem("biometric_enabled", "false");
      }

      // Create user in database using React Query mutation
      createUserMutation.mutate({
        username: completeProfileForm.username,
        email: completeProfileForm.email,
        walletAddress: publicKey.toBase58(),
        profileImage: completeProfileForm.profileImage || undefined,
      });
    } catch (error) {
      console.error(" 274 Authentication failed:", error);
      Toast.show({
        text1: t("Error"),
        text2:
          error instanceof Error ? error.message : t("Authentication failed"),
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  // Show loading screen when submitting or creating user
  if (isSubmitting || createUserMutation.isPending) {
    return (
      <>
        <LoadingScreen />
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </>
    );
  }

  return (
    <FormContainer>
      <Column
        $gap={16}
        $width="100%"
        $padding={24}
        $justifyContent="space-between"
        style={{ flex: 1, marginTop: 6 }}
      >
        <Column $gap={16}>
          <RektLogo width={100} height={50} />
          <Title1 style={{ textAlign: "center" }}>
            {t("Complete Your Profile")}
          </Title1>

          {/* Profile Image Upload */}
          <TouchableOpacity onPress={handleImagePicker} disabled={isLoading}>
            <AvatarContainer>
              <AvatarImage
                source={
                  completeProfileForm.profileImage
                    ? { uri: completeProfileForm.profileImage }
                    : require("@/assets/images/app-pngs/avatar.png")
                }
              />
              <UploadOverlay>
                <UploadText>{t("Upload Photo")}</UploadText>
              </UploadOverlay>
            </AvatarContainer>
          </TouchableOpacity>

          {/* Username Input */}
          <Column $gap={24}>
            <Row $alignItems="flex-end" $gap={8}>
              <Column style={{ flex: 1 }}>
                <Input
                  label={`${t("Username")} *`}
                  placeholder={t("Enter your username")}
                  value={completeProfileForm.username}
                  onChangeText={handleUsernameChange}
                  returnKeyType="next"
                  onSubmitEditing={onNext}
                />
              </Column>
              {usernameValidation.isChecking && (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={{ marginBottom: 12 }}
                />
              )}
              {usernameValidation.isAvailable === true &&
                !usernameValidation.hasError && (
                  <SuccessIndicator style={{ marginBottom: 12 }}>
                    ✓
                  </SuccessIndicator>
                )}
              {(usernameValidation.isAvailable === false ||
                usernameValidation.hasError) && (
                  <ErrorIndicator style={{ marginBottom: 12 }}>✗</ErrorIndicator>
                )}
            </Row>
            {usernameValidation.hasError ? (
              <ErrorText>{usernameValidation.error}</ErrorText>
            ) : null}

            {/* Email Input */}
            <Input
              label={`${t("Email Address")} (${t("Optional")})`}
              placeholder={t("Enter your email")}
              value={completeProfileForm.email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              ref={emailInputRef}
            />
            {emailError ? <ErrorText>{emailError}</ErrorText> : null}

            {/* OTP Input - only show after OTP is sent */}
            {otpSent && (
              <>
                <Input
                  label={t("Verification Code")}
                  placeholder={t("Enter 6-digit code")}
                  value={otp}
                  onChangeText={handleOtpChange}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                {otpError ? <ErrorText>{otpError}</ErrorText> : null}
              </>
            )}

            {/* Biometric Switch */}
            {isSupported && isEnrolled && (
              <Card $padding={16}>
                <Row $gap={12} $justifyContent="space-between" $width="auto">
                  <Column
                    $gap={4}
                    $flex={1}
                    $width="auto"
                    $alignItems="flex-start"
                  >
                    <BodyS>
                      {t("Enable {{biometricType}}", { biometricType })}
                    </BodyS>
                    <BodyS style={{ opacity: 0.7, fontSize: 12 }}>
                      {t("Use {{biometricType}} to unlock the app", {
                        biometricType,
                      })}
                    </BodyS>
                  </Column>
                  <Switch
                    isOn={completeProfileForm.enableBiometrics}
                    onPress={handleBiometricToggle}
                  />
                </Row>
              </Card>
            )}
          </Column>
        </Column>

        <PrimaryButton
          onPress={async () => {
            try {
              await signOut();
              console.log("✅ User signed out successfully");
            } catch (error) {
              console.error("❌ Error signing out:", error);
            }
          }}
        >
          {t("Sign Out")}
        </PrimaryButton>

        {/* Submit Button */}
        <PrimaryButton
          onPress={otpSent ? handleSubmit : completeProfileForm.email.trim() ? handleSendOTP : handleSubmit}
          disabled={
            isSubmitting ||
            authLoading ||
            createUserMutation.isPending ||
            usernameValidation.isEmpty ||
            !usernameValidation.isValid ||
            (otpSent && !otp.trim())
          }
          style={{ marginTop: 24 }}
        >
          {isSubmitting || createUserMutation.isPending
            ? createUserMutation.isPending
              ? t("Creating Account...")
              : otpSent
                ? t("Verifying...")
                : t("Creating Account...")
            : otpSent
              ? t("Complete Sign Up")
              : completeProfileForm.email.trim()
                ? t("Send Code")
                : t("Create Account")}
        </PrimaryButton>
      </Column>
    </FormContainer>
  );
};

const FormContainer = styled.View`
  width: 100%;
  padding: 12px;
  flex: 1;
  height: 100%;
`;

const imgSize = 100;
const AvatarContainer = styled.View`
  position: relative;
  width: ${imgSize}px;
  height: ${imgSize}px;
  border-radius: ${imgSize / 2}px;
  border-width: 3px;
  border-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.textSecondary};
`;

const AvatarImage = styled(Image)`
  width: 100%;
  height: 100%;
  border-radius: ${imgSize / 2 - 3}px;
`;

const UploadOverlay = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 4px;
  border-bottom-left-radius: ${imgSize / 2 - 3}px;
  border-bottom-right-radius: ${imgSize / 2 - 3}px;
  align-items: center;
`;

const UploadText = styled.Text`
  color: white;
  font-size: 10px;
  font-family: "Geist";
  font-weight: 500;
`;

const ErrorText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.loss};
  font-size: 12px;
  font-family: "Geist";
  margin-left: 4px;
`;

const SuccessIndicator = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.profit};
  font-size: 16px;
  font-weight: bold;
`;

const ErrorIndicator = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.loss};
  font-size: 16px;
  font-weight: bold;
`;
