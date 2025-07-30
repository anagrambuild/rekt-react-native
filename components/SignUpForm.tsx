import { useRef, useState } from 'react';
import { Alert, Keyboard, TextInput, TouchableOpacity } from 'react-native';

import RektLogo from '@/assets/images/rekt-logo.svg';
import { useAppContext } from '@/contexts';
import { useSolana } from '@/contexts/SolanaContext';
import { useWallet } from '@/contexts/WalletContext';
import { useBiometrics, useImagePicker } from '@/hooks';
import { LoadingScreen } from '@/screens/LoadingScreen';
import { createUser } from '@/utils/backendApi';
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
import styled, { DefaultTheme } from 'styled-components/native';

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

  const { signUpForm, setSignUpForm } = useAppContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const handleUsernameChange = (text: string) => {
    setSignUpForm((prev) => ({ ...prev, username: text }));
    if (usernameError) setUsernameError('');
  };

  const emailInputRef = useRef<TextInput>(null);

  const onNext = () => {
    emailInputRef.current?.focus();
  };

  const handleEmailChange = (text: string) => {
    setSignUpForm((prev) => ({ ...prev, email: text }));
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
      Alert.alert(t('Error'), t('Wallet not connected'));
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

      // Step 2: Create user in database
      const user = await createUser({
        username: signUpForm.username,
        email: signUpForm.email,
        walletAddress: publicKey.toBase58(),
        swigWalletAddress: swigAddressString,
        profileImage: signUpForm.profileImage || undefined,
      });

      // Step 3: Store authentication data
      await storeSecureAuth(publicKey.toBase58(), swigAddressString, user.id);

      // Step 4: Store biometric preference if enabled
      if (signUpForm.enableBiometrics) {
        await AsyncStorage.setItem('biometric_enabled', 'true');
      } else {
        await AsyncStorage.setItem('biometric_enabled', 'false');
      }

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

      Alert.alert(t('Account Creation Failed'), errorMessage);
    }
  };

  // Show loading screen when submitting (after user returns from Phantom)
  if (isSubmitting) {
    return <LoadingScreen />;
  }

  return (
    <FormContainer>
      <Column
        $gap={24}
        $width='100%'
        $padding={24}
        $justifyContent='space-between'
        style={{ flex: 1 }}
      >
        <Column $gap={24}>
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
            <Input
              label={`${t('Username')} *`}
              placeholder={t('Enter your username')}
              value={signUpForm.username}
              onChangeText={handleUsernameChange}
              returnKeyType='next'
              onSubmitEditing={onNext}
            />
            {usernameError ? <ErrorText>{usernameError}</ErrorText> : null}

            {/* Email Input */}
            <Input
              label={t('Email Address')}
              placeholder={t('Enter your email (optional)')}
              value={signUpForm.email}
              onChangeText={handleEmailChange}
              returnKeyType='done'
              onSubmitEditing={Keyboard.dismiss}
              ref={emailInputRef}
            />

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
