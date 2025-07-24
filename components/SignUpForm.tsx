import { useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';

import {
  BodyS,
  Card,
  Column,
  Input,
  PrimaryButton,
  Row,
  Switch,
} from '@/components';
import { useAppContext } from '@/contexts';
import { useBiometrics, useImagePicker } from '@/hooks';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components/native';

interface SignUpFormProps {
  onComplete?: () => void;
}

export const SignUpForm = ({ onComplete }: SignUpFormProps) => {
  const { t } = useTranslation();
  const { signUpForm, setSignUpForm } = useAppContext();
  const { takePhoto, pickFromLibrary, isLoading } = useImagePicker();
  const { isSupported, isEnrolled, biometricType, enableBiometrics } =
    useBiometrics();
  const [usernameError, setUsernameError] = useState('');

  const handleUsernameChange = (text: string) => {
    setSignUpForm((prev) => ({ ...prev, username: text }));
    if (usernameError) setUsernameError('');
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
    if (validateForm()) {
      // Store biometric preference if enabled
      if (signUpForm.enableBiometrics) {
        await AsyncStorage.setItem('biometric_enabled', 'true');
      } else {
        await AsyncStorage.setItem('biometric_enabled', 'false');
      }

      console.log('Sign up form data:', signUpForm);
      onComplete?.();
    }
  };

  return (
    <FormContainer>
      <Column
        $gap={24}
        $width='100%'
        $justifyContent='space-between'
        style={{ flex: 1 }}
      >
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
            onSubmitEditing={() => {}}
          />
          {usernameError ? <ErrorText>{usernameError}</ErrorText> : null}

          {/* Email Input */}
          <Input
            label={t('Email Address')}
            placeholder={t('Enter your email (optional)')}
            value={signUpForm.email}
            onChangeText={handleEmailChange}
            returnKeyType='done'
            onSubmitEditing={handleSubmit}
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

        {/* Submit Button */}
        <PrimaryButton onPress={handleSubmit}>
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
