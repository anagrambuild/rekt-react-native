import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  TextInput,
  TouchableOpacity,
} from "react-native";

import RektLogo from "@/assets/images/rekt-logo.svg";
import { useAppContext, useAuth, useWallet } from "@/contexts";
import { useBiometrics, useImagePicker } from "@/hooks";
import { LoadingScreen } from "@/screens/LoadingScreen";
import {
  useCreateUserMutation,
  useUsernameAvailabilityQuery,
} from "@/utils/queryUtils";
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

interface SignUpFormProps {
  onComplete?: () => void;
}

export const SignUpForm = ({ onComplete }: SignUpFormProps) => {
  const { t } = useTranslation();
  const { sendOTP, verifyOTP, signOut, loading: authLoading } = useAuth();
  const { publicKey, connected } = useWallet();
  const { takePhoto, pickFromLibrary, isLoading } = useImagePicker();
  const { isSupported, isEnrolled, biometricType, enableBiometrics } =
    useBiometrics();
  const theme = useTheme();
  const { signUpForm, setSignUpForm, setUserProfile } = useAppContext();

  const [debouncedUsername, setDebouncedUsername] = useState("");

  // React Query for username availability
  const usernameAvailabilityQuery = useUsernameAvailabilityQuery(
    debouncedUsername,
    {
      enabled:
        debouncedUsername.length >= 3 &&
        /^[a-zA-Z0-9_]+$/.test(debouncedUsername),
    }
  );

  // React Query mutation for user creation
  const createUserMutation = useCreateUserMutation({
    onSuccess: user => {
      console.log("✅ User created successfully via React Query");
      console.log("👤 User:", user);

      // Show success toast
      Toast.show({
        text1: t("Account Created Successfully"),
        text2: t("Welcome to Rekt!"),
        type: "success",
      });

      // Update app state with the newly created user
      setUserProfile(user);

      // Clear the form after successful creation
      setSignUpForm({
        username: "",
        email: "",
        profileImage: null,
        enableBiometrics: false,
      });

      // Clear any error states
      setUsernameError("");
      setEmailError("");
      setOtpError("");
      setOtpSent(false);
      setOtp("");
      setDebouncedUsername("");

      onComplete?.();
    },
    onError: error => {
      console.error("❌ User creation failed:", error);
      Toast.show({
        text1: t("Error"),
        text2:
          error instanceof Error ? error.message : t("Account creation failed"),
        type: "error",
      });
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // Debounce username for API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const username = signUpForm.username;

      // Clear previous errors when user starts typing
      if (usernameError) setUsernameError("");

      // Only set debounced username if it meets basic criteria
      if (username && username.length >= 3 && username.length <= 20) {
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setUsernameError(
            t("Username can only contain letters, numbers, and underscores")
          );
          setDebouncedUsername(""); // Don't check invalid format
          return;
        }
        setDebouncedUsername(username);
      } else {
        setDebouncedUsername(""); // Don't check if too short/long
        if (username && username.length > 0 && username.length < 3) {
          setUsernameError(t("Username must be at least 3 characters"));
        } else if (username && username.length > 20) {
          setUsernameError(t("Username must be 20 characters or less"));
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [signUpForm.username, usernameError, t]);

  // Handle username availability query results
  useEffect(() => {
    if (usernameAvailabilityQuery.data) {
      if (!usernameAvailabilityQuery.data.available) {
        setUsernameError(t("Username is already taken"));
      } else {
        setUsernameError("");
      }
    }
    if (usernameAvailabilityQuery.error) {
      console.error("Username check failed:", usernameAvailabilityQuery.error);
      // Don't show error to user for network issues, just silently fail
    }
  }, [usernameAvailabilityQuery.data, usernameAvailabilityQuery.error, t]);

  const handleUsernameChange = (text: string) => {
    setSignUpForm(prev => ({ ...prev, username: text }));
    // Error clearing is handled in the debounce effect
  };

  const emailInputRef = useRef<TextInput>(null);

  const onNext = () => {
    emailInputRef.current?.focus();
  };

  const handleEmailChange = (text: string) => {
    setSignUpForm(prev => ({ ...prev, email: text }));

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
            setSignUpForm(prev => ({ ...prev, profileImage: photo.uri }));
          }
        },
      },
      {
        text: t("Choose from library"),
        onPress: async () => {
          const photo = await pickFromLibrary();
          if (photo) {
            setSignUpForm(prev => ({ ...prev, profileImage: photo.uri }));
          }
        },
      },
      { text: t("Cancel"), style: "cancel" },
    ]);
  };

  const validateForm = () => {
    if (!signUpForm.username.trim()) {
      setUsernameError(t("Username is required"));
      return false;
    }
    if (!signUpForm.email.trim()) {
      setEmailError(t("Email is required"));
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
    if (!signUpForm.enableBiometrics) {
      // User wants to enable biometrics
      const success = await enableBiometrics();
      if (success) {
        setSignUpForm(prev => ({ ...prev, enableBiometrics: true }));
      }
    } else {
      // User wants to disable biometrics
      setSignUpForm(prev => ({ ...prev, enableBiometrics: false }));
    }
  };

  const handleSendOTP = async () => {
    if (!signUpForm.email.trim()) {
      setEmailError(t("Email is required"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpForm.email)) {
      setEmailError(t("Please enter a valid email address"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendOTP(signUpForm.email);
      if (result.success) {
        setOtpSent(true);
        Toast.show({
          text1: t("OTP Sent"),
          text2: t("Check your email for the verification code"),
          type: "success",
        });
      } else {
        throw new Error(result.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
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

    // Validate username length and format before proceeding
    if (signUpForm.username.length < 3 || signUpForm.username.length > 20) {
      Toast.show({
        text1: t("Invalid Username"),
        text2: t("Username must be between 3-20 characters"),
        type: "error",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(signUpForm.username)) {
      Toast.show({
        text1: t("Invalid Username"),
        text2: t("Username can only contain letters, numbers, and underscores"),
        type: "error",
      });
      return;
    }

    // Check username availability from React Query cache/state
    if (!usernameAvailabilityQuery.data?.available) {
      if (usernameAvailabilityQuery.isLoading) {
        Toast.show({
          text1: t("Please wait"),
          text2: t("Checking username availability..."),
          type: "info",
        });
        return;
      }
      if (usernameAvailabilityQuery.error) {
        Toast.show({
          text1: t("Error"),
          text2: t("Failed to verify username availability. Please try again."),
          type: "error",
        });
        return;
      }
      if (usernameAvailabilityQuery.data?.available === false) {
        setUsernameError(t("Username is already taken"));
        return;
      }
      // If no data yet, don't proceed
      Toast.show({
        text1: t("Please wait"),
        text2: t("Checking username availability..."),
        type: "info",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Verify OTP and authenticate with Supabase
      const otpResult = await verifyOTP(signUpForm.email, otp);
      if (!otpResult.success) {
        throw new Error(otpResult.error || "OTP verification failed");
      }

      console.log("✅ OTP verification successful");

      // DEBUG: Check session after OTP verification
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("🔑 Session after OTP:", {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id,
        tokenPreview: session?.access_token?.substring(0, 50) + "...",
      });

      // LOG FULL TOKEN
      console.log("🎫 FULL JWT TOKEN:", session?.access_token);

      if (!session?.access_token) {
        throw new Error("No session found after OTP verification");
      }

      // Step 2: Store biometric preference if enabled
      if (signUpForm.enableBiometrics) {
        await AsyncStorage.setItem("biometric_enabled", "true");
      } else {
        await AsyncStorage.setItem("biometric_enabled", "false");
      }

      // Step 3: Create user in database using React Query mutation
      createUserMutation.mutate({
        username: signUpForm.username,
        email: signUpForm.email,
        walletAddress: publicKey.toBase58(),
        profileImage: signUpForm.profileImage || undefined,
      });
    } catch (error) {
      console.error("❌ OTP verification failed:", error);
      Toast.show({
        text1: t("Error"),
        text2:
          error instanceof Error ? error.message : t("OTP verification failed"),
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
                  signUpForm.profileImage
                    ? { uri: signUpForm.profileImage }
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
                  value={signUpForm.username}
                  onChangeText={handleUsernameChange}
                  returnKeyType="next"
                  onSubmitEditing={onNext}
                />
              </Column>
              {usernameAvailabilityQuery.isLoading && debouncedUsername && (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={{ marginBottom: 12 }}
                />
              )}
              {usernameAvailabilityQuery.data?.available === true &&
                !usernameError && (
                  <SuccessIndicator style={{ marginBottom: 12 }}>
                    ✓
                  </SuccessIndicator>
                )}
              {(usernameAvailabilityQuery.data?.available === false ||
                usernameError) && (
                <ErrorIndicator style={{ marginBottom: 12 }}>✗</ErrorIndicator>
              )}
            </Row>
            {usernameError ? <ErrorText>{usernameError}</ErrorText> : null}

            {/* Email Input */}
            <Input
              label={t("Email Address")}
              placeholder={t("Enter your email")}
              value={signUpForm.email}
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
                    isOn={signUpForm.enableBiometrics}
                    onPress={handleBiometricToggle}
                  />
                </Row>
              </Card>
            )}
          </Column>
        </Column>

        {/* <PrimaryButton
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
        </PrimaryButton> */}

        {/* Submit Button */}
        <PrimaryButton
          onPress={otpSent ? handleSubmit : handleSendOTP}
          disabled={
            isSubmitting ||
            authLoading ||
            createUserMutation.isPending ||
            (!otpSent && !signUpForm.email.trim()) ||
            (otpSent && !otp.trim())
          }
          style={{ marginTop: 24 }}
        >
          {isSubmitting || createUserMutation.isPending
            ? createUserMutation.isPending
              ? t("Creating Account...")
              : t("Sending OTP...")
            : otpSent
            ? t("Complete Sign Up")
            : t("Send OTP")}
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
