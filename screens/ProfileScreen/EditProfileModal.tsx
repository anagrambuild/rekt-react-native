import { Image } from 'react-native';

import { Modal, PressableOpacity } from '@/components';
import {
  PrimaryButton,
  TertiaryButton,
} from '@/components/common/buttons/main-buttons';
import { Card } from '@/components/common/Card';
import { Column, Gap, Row } from '@/components/common/containers';
import {
  BodyM,
  BodyMSecondary,
  BodyS,
  BodySEmphasized,
  Title4,
} from '@/components/common/texts';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { t } from 'i18next';
import styled, { useTheme } from 'styled-components/native';

interface User {
  username: string;
  imgSrc: string | number;
}

export const EditProfileModal = ({
  visible,
  onRequestClose,
  onSave,
  onRemoveImage,
  user,
}: {
  visible: boolean;
  onRequestClose: () => void;
  onSave?: () => void;
  onRemoveImage?: () => void;
  user: User;
}) => {
  const theme = useTheme();

  return (
    <Modal visible={visible} onRequestClose={onRequestClose}>
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
                <Button onPress={onRemoveImage || (() => {})}>
                  <MaterialIcon
                    name='delete-outline'
                    size={16}
                    color={theme.colors.onSecondary}
                  />
                  <BodySEmphasized>{t('Remove')}</BodySEmphasized>
                </Button>
              </Column>
              <Image
                source={
                  typeof user.imgSrc === 'string'
                    ? { uri: user.imgSrc }
                    : user.imgSrc
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
                <BodyM>@</BodyM>
                <BodyM>{user.username}</BodyM>
              </Row>
            </Column>
          </Card>
        </Column>
        <Gap height={8} />
        <PrimaryButton onPress={onSave || (() => {})}>
          {t('Save changes')}
        </PrimaryButton>
        <TertiaryButton onPress={onRequestClose}>{t('Cancel')}</TertiaryButton>
      </Column>
    </Modal>
  );
};

const Button = styled(PressableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background-color: ${(props: any) => props.theme.colors.secondary};
  padding: 6px 12px;
  border-radius: 100px;
`;
