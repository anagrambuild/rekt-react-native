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
  checkUsernameAvailabilityPublic,
  createUser,
  uploadAvatar,
} from "@/utils/backendApi";
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
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme } from "styled-components/native";
import { Toast } from "toastify-react-native";

interface SignUpFormProps {
  onComplete?: () => void;
}

export const SignUpForm = ({ onComplete }: SignUpFormProps) => {
  const { t } = useTranslation();
  const {
    signUp,
    //  signOut,
    loading: authLoading,
  } = useAuth();
  const { publicKey, connected } = useWallet();
  const { takePhoto, pickFromLibrary, isLoading } = useImagePicker();
  const { isSupported, isEnrolled, biometricType, enableBiometrics } =
    useBiometrics();
  const theme = useTheme();
  const { signUpForm, setSignUpForm, setUserProfile } = useAppContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  // Debounce username checking
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const username = signUpForm.username;

      if (!username || username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      // Check username format and length first
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameError(
          t("Username can only contain letters, numbers, and underscores")
        );
        setUsernameAvailable(false);
        return;
      }

      if (username.length < 3 || username.length > 20) {
        setUsernameError(t("Username must be between 3-20 characters"));
        setUsernameAvailable(false);
        return;
      }

      try {
        const result = await checkUsernameAvailabilityPublic(username);
        setUsernameAvailable(result.available);

        if (!result.available) {
          setUsernameError(t("Username is already taken"));
        } else {
          setUsernameError("");
        }
      } catch (error) {
        console.error("Username check failed:", error);
        setUsernameAvailable(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signUpForm.username]);

  const handleUsernameChange = (text: string) => {
    setSignUpForm(prev => ({ ...prev, username: text }));
    if (usernameError) setUsernameError("");
    // Reset username validation state when user types
    setUsernameAvailable(null);
  };

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const onNext = () => {
    emailInputRef.current?.focus();
  };

  const onEmailNext = () => {
    passwordInputRef.current?.focus();
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

  const handlePasswordChange = (text: string) => {
    setSignUpForm(prev => ({ ...prev, password: text }));

    // Clear previous error
    if (passwordError) setPasswordError("");

    // Validate password if not empty
    if (text.trim() && text.length > 0) {
      if (text.length < 5) {
        setPasswordError(t("Password must be at least 5 characters"));
      }
    }
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
    if (!signUpForm.password.trim()) {
      setPasswordError(t("Password is required"));
      return false;
    }
    if (signUpForm.password.length < 5) {
      setPasswordError(t("Password must be at least 5 characters"));
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

  // TODO: Add this back when backend is ready
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Check username length and format before API call
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

    // Validate email format if provided (email is optional)
    if (signUpForm.email.trim() && signUpForm.email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signUpForm.email)) {
        Toast.show({
          text1: t("Invalid Email"),
          text2: t("Please enter a valid email address"),
          type: "error",
        });
        return;
      }
    }

    // Check username availability before proceeding
    try {
      const usernameCheck = await checkUsernameAvailabilityPublic(
        signUpForm.username
      );
      if (!usernameCheck.available) {
        setUsernameError(t("Username is already taken"));
        return;
      }
    } catch (error) {
      console.error("Username check failed:", error);
      Toast.show({
        text1: t("Error"),
        text2: t("Failed to verify username availability. Please try again."),
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create Supabase user account
      const supabaseResult = await signUp(
        signUpForm.email,
        signUpForm.password
      );
      console.log("supabaseResult", supabaseResult);

      // Log the auth token details
      if (supabaseResult.success) {
        console.log("✅ Supabase auth successful");
        console.log("User ID:", supabaseResult.user?.id);
        console.log("User email:", supabaseResult.user?.email);

        // Get the current session to access tokens
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          console.log("Access token:", session.access_token);
          console.log("Refresh token:", session.refresh_token);
          console.log("Session user ID:", session.user.id);
        } else {
          console.log("No session available yet");
        }
      } else {
        console.log("❌ Supabase auth failed:", supabaseResult.error);
      }
      if (!supabaseResult.success) {
        throw new Error(supabaseResult.error || "Supabase signup failed");
      }

      // Step 2: Swig account creation is now handled by the backend automatically

      // Step 3: Upload avatar if provided
      let avatarUrl: string | undefined;
      if (signUpForm.profileImage) {
        try {
          avatarUrl = await uploadAvatar(
            signUpForm.profileImage,
            `avatar_${Date.now()}.jpg`
          );
        } catch (avatarError) {
          console.warn(
            "⚠️ Avatar upload failed, continuing without avatar:",
            avatarError
          );
          // Continue without avatar rather than failing the entire process
        }
      }

      // Step 4: Create user in database
      // The new backend will create the Swig account automatically
      if (!publicKey) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first."
        );
      }

      // Step 5: Store biometric preference if enabled
      if (signUpForm.enableBiometrics) {
        await AsyncStorage.setItem("biometric_enabled", "true");
      } else {
        await AsyncStorage.setItem("biometric_enabled", "false");
      }

      // Step 6: Create user in database
      const user = await createUser({
        username: signUpForm.username,
        email: signUpForm.email,
        walletAddress: publicKey.toBase58(), // Pass the connected wallet address
        profileImage: avatarUrl, // Use uploaded avatar URL instead of local path
      });

      // Log the successful user creation response
      console.log("✅ User created successfully via backend API");
      console.log("👤 User ID:", user.id);
      console.log("👤 Username:", user.username);
      console.log("👤 Email:", user.email);
      console.log("👤 Swig Wallet Address:", user.swigWalletAddress);
      console.log("👤 Profile Image:", user.profileImage);
      console.log("👤 Created At:", user.createdAt);
      console.log("👤 Updated At:", user.updatedAt);

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
        password: "",
        profileImage: null,
        enableBiometrics: false,
      });

      // Clear any error states
      setUsernameError("");
      setEmailError("");
      setPasswordError("");
      setUsernameAvailable(null);

      setIsSubmitting(false);
      onComplete?.();
    } catch (error) {
      console.error("❌ Account creation process failed:", error);
      setIsSubmitting(false);
    }
  };

  const goToApp = () => router.push("/(tabs)");

  // Show loading screen when submitting (after user returns from Phantom)
  if (isSubmitting) {
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
              {usernameAvailable === true && (
                <SuccessIndicator style={{ marginBottom: 12 }}>
                  ✓
                </SuccessIndicator>
              )}
              {usernameAvailable === false && (
                <ErrorIndicator style={{ marginBottom: 12 }}>✗</ErrorIndicator>
              )}
            </Row>
            {usernameError ? <ErrorText>{usernameError}</ErrorText> : null}

            {/* Email Input */}
            <Input
              label={t("Email Address")}
              placeholder={t("Enter your email (optional)")}
              value={signUpForm.email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={onEmailNext}
              ref={emailInputRef}
            />
            {emailError ? <ErrorText>{emailError}</ErrorText> : null}

            {/* Password Input */}
            <Input
              label={t("Password")}
              placeholder={t("Enter your password")}
              value={signUpForm.password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              ref={passwordInputRef}
            />
            {passwordError ? <ErrorText>{passwordError}</ErrorText> : null}

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
              console.log('✅ User signed out successfully');
            } catch (error) {
              console.error('❌ Error signing out:', error);
            }
          }}
        >
          {t('Sign Out')}
        </PrimaryButton> */}

        {/* Submit Button */}
        <PrimaryButton
          onPress={goToApp}
          disabled={isSubmitting || authLoading}
          style={{ marginTop: 24 }}
        >
          {isSubmitting ? t("Creating Account...") : t("Complete Sign Up")}
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
