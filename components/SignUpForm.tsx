import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import RektLogo from '@/assets/images/rekt-logo.svg';
import { useAppContext } from '@/contexts';
import { useSolana } from '@/contexts/SolanaContext';
import { useWallet } from '@/contexts/WalletContext';
import { useBiometrics, useImagePicker } from '@/hooks';
import { LoadingScreen } from '@/screens/LoadingScreen';
import {
  checkUsernameAvailability,
  createUser,
  uploadAvatar,
} from '@/utils/backendApi';
import { createSwigAccountForMobile } from '@/utils/mobileSwigUtils';
import { storeSecureAuth } from '@/utils/secureAuth';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BodyS,
  Card,
  Column,
  Input,
  PrimaryButton,
  Row,
  Switch,
  Title1,
} from './common';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';
import { Toast } from 'toastify-react-native';

interface SignUpFormProps {
  onComplete?: () => void;
}

export const SignUpForm = ({ onComplete }: SignUpFormProps) => {
  const { t } = useTranslation();
  const { connected, publicKey, getDappKeyPair, sharedSecret, session } =
    useWallet();
  const { connection } = useSolana();
  const { takePhoto, pickFromLibrary, isLoading } = useImagePicker();
  const { isSupported, isEnrolled, biometricType, enableBiometrics } =
    useBiometrics();
  const theme = useTheme();
  const { signUpForm, setSignUpForm, setUserProfile } = useAppContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  // Debounced username checking
  const checkUsername = useCallback(
    async (username: string) => {
      if (!username || username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      // Check username format and length first
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameError(
          t('Username can only contain letters, numbers, and underscores')
        );
        setUsernameAvailable(false);
        return;
      }

      if (username.length < 3 || username.length > 20) {
        setUsernameError(t('Username must be between 3-20 characters'));
        setUsernameAvailable(false);
        return;
      }

      setIsCheckingUsername(true);
      try {
        const result = await checkUsernameAvailability(username);
        setUsernameAvailable(result.available);

        if (!result.available) {
          setUsernameError(t('Username is already taken'));
        } else {
          setUsernameError('');
        }
      } catch (error) {
        console.error('Username check failed:', error);
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    },
    [t]
  );

  // Debounce username checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (signUpForm.username) {
        checkUsername(signUpForm.username);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [signUpForm.username, checkUsername]);

  const handleUsernameChange = (text: string) => {
    setSignUpForm((prev) => ({ ...prev, username: text }));
    if (usernameError) setUsernameError('');
    // Reset username validation state when user types
    setUsernameAvailable(null);
  };

  const emailInputRef = useRef<TextInput>(null);

  const onNext = () => {
    emailInputRef.current?.focus();
  };

  const handleEmailChange = (text: string) => {
    setSignUpForm((prev) => ({ ...prev, email: text }));

    // Clear previous error
    if (emailError) setEmailError('');

    // Validate email format if not empty (email is optional)
    if (text.trim() && text.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        setEmailError(t('Please enter a valid email address'));
      }
    }
  };

  const handleImagePicker = () => {
    Alert.alert(t('Upload'), '', [
      {
        text: t('Take photo'),
        onPress: async () => {
          const photo = await takePhoto();
          if (photo) {
            setSignUpForm((prev) => ({ ...prev, profileImage: photo.uri }));
          }
        },
      },
      {
        text: t('Choose from library'),
        onPress: async () => {
          const photo = await pickFromLibrary();
          if (photo) {
            setSignUpForm((prev) => ({ ...prev, profileImage: photo.uri }));
          }
        },
      },
      { text: t('Cancel'), style: 'cancel' },
    ]);
  };

  const validateForm = () => {
    if (!signUpForm.username.trim()) {
      setUsernameError(t('Username is required'));
      return false;
    }
    return true;
  };

  const handleBiometricToggle = async () => {
    if (!signUpForm.enableBiometrics) {
      // User wants to enable biometrics
      const success = await enableBiometrics();
      if (success) {
        setSignUpForm((prev) => ({ ...prev, enableBiometrics: true }));
      }
    } else {
      // User wants to disable biometrics
      setSignUpForm((prev) => ({ ...prev, enableBiometrics: false }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!connected || !publicKey) {
      Toast.show({
        text1: t('Error'),
        text2: t('Wallet not connected'),
        type: 'error',
      });
      return;
    }

    // Check username length and format before API call
    if (signUpForm.username.length < 3 || signUpForm.username.length > 20) {
      Toast.show({
        text1: t('Invalid Username'),
        text2: t('Username must be between 3-20 characters'),
        type: 'error',
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(signUpForm.username)) {
      Toast.show({
        text1: t('Invalid Username'),
        text2: t('Username can only contain letters, numbers, and underscores'),
        type: 'error',
      });
      return;
    }

    // Validate email format if provided (email is optional)
    if (signUpForm.email.trim() && signUpForm.email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signUpForm.email)) {
        Toast.show({
          text1: t('Invalid Email'),
          text2: t('Please enter a valid email address'),
          type: 'error',
        });
        return;
      }
    }

    // Check username availability before proceeding
    try {
      const usernameCheck = await checkUsernameAvailability(
        signUpForm.username
      );
      if (!usernameCheck.available) {
        setUsernameError(t('Username is already taken'));
        return;
      }
    } catch (error) {
      console.error('Username check failed:', error);
      Toast.show({
        text1: t('Error'),
        text2: t('Failed to verify username availability. Please try again.'),
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create Swig account
      const solanaNetwork =
        Constants.expoConfig?.extra?.solanaNetwork || 'solana:devnet';
      const dappKeyPair = getDappKeyPair();

      const swigResult = await createSwigAccountForMobile(
        connection,
        publicKey,
        solanaNetwork,
        sharedSecret || undefined,
        session || undefined,
        dappKeyPair.publicKey
      );

      if (!swigResult.success) {
        console.error('❌ Swig creation failed:', swigResult.error);
        throw new Error(`Swig creation failed: ${swigResult.error}`);
      }

      // Convert swigAddress to string if it's a PublicKey
      const swigAddressString =
        typeof swigResult.swigAddress === 'string'
          ? swigResult.swigAddress
          : swigResult.swigAddress.toBase58();

      // Step 2: Upload avatar if provided
      let avatarUrl: string | undefined;
      if (signUpForm.profileImage) {
        try {
          avatarUrl = await uploadAvatar(
            signUpForm.profileImage,
            `avatar_${Date.now()}.jpg`
          );
        } catch (avatarError) {
          console.warn(
            '⚠️ Avatar upload failed, continuing without avatar:',
            avatarError
          );
          // Continue without avatar rather than failing the entire process
        }
      }

      // Step 2b: Create user in database
      const user = await createUser({
        username: signUpForm.username,
        email: signUpForm.email,
        walletAddress: publicKey.toBase58(),
        swigWalletAddress: swigAddressString,
        profileImage: avatarUrl, // Use uploaded avatar URL instead of local path
      });

      // Step 3: Store authentication data
      await storeSecureAuth(publicKey.toBase58(), swigAddressString, user.id);

      // Step 4: Store biometric preference if enabled
      if (signUpForm.enableBiometrics) {
        await AsyncStorage.setItem('biometric_enabled', 'true');
      } else {
        await AsyncStorage.setItem('biometric_enabled', 'false');
      }

      // Step 5: Update app state with the newly created user
      setUserProfile(user);

      setIsSubmitting(false);
      onComplete?.();
    } catch (error) {
      console.error('❌ Account creation process failed:', error);

      // Log detailed error information for debugging
      if (error instanceof Error) {
        console.error('Error details:');
        console.error('  - Name:', error.name);
        console.error('  - Message:', error.message);
        console.error('  - Stack:', error.stack);
      }

      // Show user-friendly error message
      let errorMessage = t('Failed to create account. Please try again.');

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();

        if (
          errorMsg.includes('insufficient funds') ||
          errorMsg.includes('insufficient balance')
        ) {
          errorMessage = t(
            'Insufficient SOL balance. Please add funds to your wallet.'
          );
        } else if (errorMsg.includes('timeout')) {
          errorMessage = t('Transaction timeout. Please try again.');
        } else if (
          errorMsg.includes('user rejected') ||
          errorMsg.includes('cancelled')
        ) {
          errorMessage = t('Transaction was cancelled.');
        } else if (errorMsg.includes('swig creation failed')) {
          errorMessage = t(
            'Failed to create Swig account. Please check your wallet and try again.'
          );
        } else if (
          errorMsg.includes('network') ||
          errorMsg.includes('connection')
        ) {
          errorMessage = t(
            'Network error. Please check your connection and try again.'
          );
        }
      }

      Toast.show({
        text1: t('Account Creation Failed'),
        text2: errorMessage,
        type: 'error',
      });
    }
  };

  // Show loading screen when submitting (after user returns from Phantom)
  if (isSubmitting) {
    return (
      <>
        <LoadingScreen />
        <ActivityIndicator
          size='large'
          color={theme.colors.primary}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </>
    );
  }

  return (
    <FormContainer>
      <Column
        $gap={16}
        $width='100%'
        $padding={24}
        $justifyContent='space-between'
        style={{ flex: 1, marginTop: 6 }}
      >
        <Column $gap={16}>
          <RektLogo width={100} height={50} />
          <Title1 style={{ textAlign: 'center' }}>
            {t('Complete Your Profile')}
          </Title1>
          {/* Profile Image Upload */}
          <TouchableOpacity onPress={handleImagePicker} disabled={isLoading}>
            <AvatarContainer>
              <AvatarImage
                source={
                  signUpForm.profileImage
                    ? { uri: signUpForm.profileImage }
                    : require('@/assets/images/app-pngs/avatar.png')
                }
              />
              <UploadOverlay>
                <UploadText>{t('Upload Photo')}</UploadText>
              </UploadOverlay>
            </AvatarContainer>
          </TouchableOpacity>

          {/* Username Input */}
          <Column $gap={24}>
            <Row $alignItems='flex-end' $gap={8}>
              <Column style={{ flex: 1 }}>
                <Input
                  label={`${t('Username')} *`}
                  placeholder={t('Enter your username')}
                  value={signUpForm.username}
                  onChangeText={handleUsernameChange}
                  returnKeyType='next'
                  onSubmitEditing={onNext}
                />
              </Column>
              {isCheckingUsername && (
                <ActivityIndicator
                  size='small'
                  color={theme.colors.tint}
                  style={{ marginBottom: 12 }}
                />
              )}
              {!isCheckingUsername && usernameAvailable === true && (
                <SuccessIndicator style={{ marginBottom: 12 }}>
                  ✓
                </SuccessIndicator>
              )}
              {!isCheckingUsername && usernameAvailable === false && (
                <ErrorIndicator style={{ marginBottom: 12 }}>✗</ErrorIndicator>
              )}
            </Row>
            {usernameError ? <ErrorText>{usernameError}</ErrorText> : null}

            {/* Email Input */}
            <Input
              label={t('Email Address')}
              placeholder={t('Enter your email (optional)')}
              value={signUpForm.email}
              onChangeText={handleEmailChange}
              keyboardType='email-address'
              textContentType='emailAddress'
              returnKeyType='done'
              onSubmitEditing={Keyboard.dismiss}
              ref={emailInputRef}
            />
            {emailError ? <ErrorText>{emailError}</ErrorText> : null}

            {/* Biometric Switch */}
            {isSupported && isEnrolled && (
              <Card $padding={16}>
                <Row $gap={12} $justifyContent='space-between' $width='auto'>
                  <Column
                    $gap={4}
                    $flex={1}
                    $width='auto'
                    $alignItems='flex-start'
                  >
                    <BodyS>
                      {t('Enable {{biometricType}}', { biometricType })}
                    </BodyS>
                    <BodyS style={{ opacity: 0.7, fontSize: 12 }}>
                      {t('Use {{biometricType}} to unlock the app', {
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

        {/* Submit Button */}
        <PrimaryButton
          onPress={handleSubmit}
          disabled={!!usernameError || isSubmitting}
          loading={isSubmitting}
        >
          {t('Complete Sign Up')}
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
  font-family: 'Geist';
  font-weight: 500;
`;

const ErrorText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.loss};
  font-size: 12px;
  font-family: 'Geist';
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
