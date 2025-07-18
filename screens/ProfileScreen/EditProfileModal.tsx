import { useState } from 'react';
import { Alert, Image, Keyboard } from 'react-native';

import {
  Modal,
  PressableOpacity,
  PrimaryButton,
  SecondaryButton,
} from '@/components';
import { Card } from '@/components/common/Card';
import { Column, Gap, Row } from '@/components/common/containers';
import {
  BodyMSecondary,
  BodyS,
  BodySEmphasized,
  Title4,
} from '@/components/common/texts';
import { useProfileContext } from '@/contexts';
import { useImagePicker } from '@/hooks';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components/native';

export const EditProfileModal = ({
  visible,
  onRequestClose,
  onSave,
}: {
  visible: boolean;
  onRequestClose: () => void;
  onSave?: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { userData, handleImageUpload, handleImageRemoval } =
    useProfileContext();
  const [username, setUsername] = useState(userData.username);
  const { takePhoto, pickFromLibrary, isLoading } = useImagePicker();

  const handleSave = () => {
    onSave?.();
    onRequestClose();
  };

  const handleClose = () => {
    setUsername(userData.username);
    onRequestClose();
  };

  const handleImageUploadModal = () => {
    Alert.alert(t('Upload'), '', [
      {
        text: t('Take photo'),
        onPress: async () => {
          const result = await takePhoto();
          if (result) {
            handleImageUpload(result.uri);
          }
        },
      },
      {
        text: t('Choose from library'),
        onPress: async () => {
          const result = await pickFromLibrary();
          if (result) {
            handleImageUpload(result.uri);
          }
        },
      },
      { text: t('Cancel'), style: 'cancel' },
    ]);
  };

  const hasImage =
    userData.imgSrc && userData.imgSrc !== '' && userData.imgSrc !== null;

  return (
    <Modal visible={visible} onRequestClose={handleClose}>
      <Column $gap={24} $alignItems='flex-start'>
        <Row $gap={12} $justifyContent='flex-start'>
          <MaterialIcon
            name='edit'
            size={18}
            color={theme.colors.textPrimary}
          />
          <Title4>{t('Edit profile')}</Title4>
        </Row>
        <Column $gap={4}>
          <Card $padding={16}>
            <Row $width='auto' $alignItems='flex-start'>
              <Column
                $gap={4}
                $width='auto'
                $alignItems='flex-start'
                $justifyContent='flex-start'
              >
                <BodyS>{t('Profile picture')}</BodyS>
                <BodyMSecondary>{t('Max. size 5MB')}</BodyMSecondary>
                <Gap height={12} />
                {hasImage ? (
                  <Button onPress={handleImageRemoval}>
                    <MaterialIcon
                      name='delete-outline'
                      size={16}
                      color={theme.colors.onSecondary}
                    />
                    <BodySEmphasized>{t('Remove')}</BodySEmphasized>
                  </Button>
                ) : (
                  <Button onPress={handleImageUploadModal} disabled={isLoading}>
                    <MaterialIcon
                      name='upload'
                      size={16}
                      color={theme.colors.onSecondary}
                    />
                    <BodySEmphasized>
                      {isLoading ? '...' : t('Upload')}
                    </BodySEmphasized>
                  </Button>
                )}
              </Column>
              <Image
                source={
                  hasImage
                    ? typeof userData.imgSrc === 'string'
                      ? { uri: userData.imgSrc }
                      : userData.imgSrc
                    : require('@/assets/images/app-pngs/avatar.png')
                }
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                }}
                resizeMode='cover'
              />
            </Row>
          </Card>

          <Card $padding={16}>
            <Column
              $gap={4}
              $width='auto'
              $alignItems='flex-start'
              $justifyContent='flex-start'
            >
              <BodyS>{t('Username')}</BodyS>
              <BodyMSecondary>
                {t('Only letters & numbers allowed')}
              </BodyMSecondary>
              <Row $gap={8} $alignItems='center'>
                <StyledInputContainer>
                  <StyleAt>@</StyleAt>
                  <StyledInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder={t('Enter your username')}
                    returnKeyType='done'
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </StyledInputContainer>
              </Row>
            </Column>
          </Card>
        </Column>
        <Column $gap={8}>
          <PrimaryButton onPress={handleSave}>
            {t('Save changes')}
          </PrimaryButton>
          <SecondaryButton onPress={onRequestClose}>
            {t('Cancel')}
          </SecondaryButton>
        </Column>
      </Column>
    </Modal>
  );
};

const Button = styled(PressableOpacity)<{ disabled?: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background-color: ${(props: any) =>
    props.disabled
      ? props.theme.colors.secondary + '80'
      : props.theme.colors.secondary};
  padding: 6px 12px;
  border-radius: 100px;
  opacity: ${(props: any) => (props.disabled ? 0.6 : 1)};
`;

const StyledInputContainer = styled.View`
  position: relative;
  width: 100%;
`;

const StyledInput = styled.TextInput`
  font-family: 'Geist';
  font-size: 16px;
  font-weight: 400;
  color: ${({ theme }: any) => theme.colors.textPrimary};
  background-color: ${({ theme }: any) => theme.colors.field};
  width: 100%;
  padding: 12px 16px 12px 24px;
  border-radius: 12px;
  height: 48px;
`;

const StyleAt = styled.Text`
  position: absolute;
  left: 0;
  top: 16px;
  color: ${({ theme }: any) => theme.colors.textSecondary};
  z-index: 1;
`;
