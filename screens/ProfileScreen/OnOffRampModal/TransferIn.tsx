import { useState } from 'react';

import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import WalletSecondaryIcon from '@/assets/images/app-svgs/wallet-secondary.svg';
import {
  BodyMEmphasized,
  BodyMSecondary,
  BodySMonoSecondary,
  BodyXSMonoSecondary,
  Card,
  Column,
  PressableOpacity,
  PrimaryButton,
  Row,
  SecondaryButton,
  TertiaryButton,
} from '@/components';
import { useProfileContext } from '@/contexts/ProfileContext';

import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';

import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

const address = '2iJwJUr8y8hepoFzZUTqhci52S1xnJPuFjAzT1VQBsst';

export const TransferIn = ({
  setView,
}: {
  setView: (view: 'balance' | 'transfer' | 'card') => void;
}) => {
  const { setIsOnOffRampModalVisible } = useProfileContext();
  const theme = useTheme();
  const { t } = useTranslation();

  const [isTransferred, setIsTransferred] = useState(false);

  const handleBack = () =>
    isTransferred ? setIsTransferred(false) : setView('balance');

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(address);
  };

  return (
    <Column $gap={16} $alignItems='center' $padding={8}>
      {/* Header Section */}
      <IconContainer onPress={handleBack}>
        <MaterialIcon
          name='chevron-left'
          size={24}
          color={theme.colors.textSecondary}
        />
      </IconContainer>
      {!isTransferred ? (
        <>
          <UsdcIconContainer>
            <UsdcIcon width={44} height={44} />
            <AbsoluteContainer>
              <FontAwesome5
                name='arrow-circle-down'
                size={20}
                color={theme.colors.textPrimary}
              />
            </AbsoluteContainer>
          </UsdcIconContainer>

          <BodyMEmphasized>
            {t('Send USDC to this address on Solana')}
          </BodyMEmphasized>
          <BodyMSecondary>
            {t('It can take up to a couple minutes to process.')}
          </BodyMSecondary>

          {/* APY Section */}
          <Card $padding={16} style={{ gap: 8 }}>
            <Row $justifyContent='space-between'>
              <Row $gap={8} $width='auto'>
                <WalletSecondaryIcon
                  width={20}
                  height={20}
                  color={theme.colors.textSecondary}
                />
                <BodyXSMonoSecondary>
                  {t('Deposit address').toUpperCase()}
                </BodyXSMonoSecondary>
              </Row>
              <PressableOpacity onPress={copyToClipboard}>
                <Octicons
                  name='copy'
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </PressableOpacity>
            </Row>
            <AddressContainer>
              <BodySMonoSecondary>{address}</BodySMonoSecondary>
            </AddressContainer>
          </Card>

          {/* Deposit Options Section */}
          <Column $gap={8}>
            <PrimaryButton onPress={() => setIsTransferred(true)}>
              {t('I have transferred')}
            </PrimaryButton>
            <SecondaryButton>{t('Close')}</SecondaryButton>
          </Column>
        </>
      ) : (
        <>
          <UsdcIconContainer>
            <UsdcIcon width={44} height={44} />
            <AbsoluteContainer>
              <Feather name='loader' size={16} color={theme.colors.loss} />
            </AbsoluteContainer>
          </UsdcIconContainer>

          <BodyMEmphasized>{t('Thank you for depositing.')}</BodyMEmphasized>
          <BodyMSecondary style={{ textAlign: 'center' }}>
            {t(
              'It can take up to a couple minutes to process. Contact support if you run into any issues.'
            )}
          </BodyMSecondary>
          <SecondaryButton>{t('Contact Support')}</SecondaryButton>
          <TertiaryButton onPress={() => setIsOnOffRampModalVisible(false)}>
            {t('Done')}
          </TertiaryButton>
        </>
      )}
    </Column>
  );
};

const IconContainer = styled(PressableOpacity)`
  padding: 16px 16px 0 0;
  align-items: flex-start;
  width: 100%;
`;

const UsdcIconContainer = styled.View`
  flex-direction: row;
  position: relative;
  align-items: center;
  justify-content: center;
`;

const AbsoluteContainer = styled.View`
  position: absolute;
  right: -6px;
  bottom: -2px;
  align-items: center;
  justify-content: center;
  height: 24px;
  width: 24px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
  border-radius: 12px;
`;

const AddressContainer = styled.View`
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 4px;
  border-radius: 12px;
`;
