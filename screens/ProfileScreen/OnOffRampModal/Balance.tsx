import coinIcon from '@/assets/images/app-pngs/coin.png';
import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import WalletSecondaryIcon from '@/assets/images/app-svgs/wallet-secondary.svg';
import {
  BodyMEmphasized,
  BodyMSecondary,
  BodySSecondary,
  BodyXSMonoSecondary,
  Card,
  Column,
  Divider,
  IconButton,
  ModalIconButton,
  Row,
  Title2,
} from '@/components';
import { useProfileContext } from '@/contexts';

import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

export const Balance = ({
  setView,
}: {
  setView: (
    view: 'transfer' | 'withdraw' | 'withdrawal address' | 'withdrawal success'
  ) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { userData, handleHistory } = useProfileContext();

  const goToTransfer = () => {
    setView('transfer');
  };
  const goToWithdraw = () => {
    setView('withdraw');
  };
  const goToCard = () => {
    // setView('card');
    console.log('go to card');
  };

  return (
    <Column $gap={24} $alignItems='flex-start' $padding={8}>
      {/* Header Section */}
      <Column $justifyContent='space-between' $alignItems='flex-start' $gap={8}>
        <IconContainer>
          <WalletSecondaryIcon
            width={20}
            height={20}
            color={theme.colors.textSecondary}
          />
        </IconContainer>
        <Row $justifyContent='space-between'>
          <Column $alignItems='flex-start' $width='auto'>
            <BodyMSecondary>{t('Your balance')}</BodyMSecondary>
            <Row $width='auto' $gap={4} $justifyContent='flex-start'>
              <Title2>
                {userData.balance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Title2>
              <UsdcIcon width={20} height={20} />
            </Row>
          </Column>

          {userData.balance > 0 && (
            <Row $width='auto' $gap={8}>
              <ModalIconButton
                onPress={goToWithdraw}
                icon={
                  <AntDesign
                    name='minuscircle'
                    size={12}
                    color={theme.colors.textPrimary}
                  />
                }
              >
                {t('Withdraw')}
              </ModalIconButton>
              <IconButton
                name='history'
                size={12}
                color={theme.colors.textPrimary}
                onPress={handleHistory}
              />
            </Row>
          )}
        </Row>
      </Column>

      {/* APY Section */}
      <Card $padding={16}>
        <Column $width='auto' $gap={4} $alignItems='flex-start'>
          <Image source={coinIcon} style={{ width: 64, height: 64 }} />
          <BodyMEmphasized>{t('Earn 5% APY on your balance')}</BodyMEmphasized>
          <BodyMSecondary>{t('Put your idle dollars to work')}</BodyMSecondary>
        </Column>
      </Card>

      {/* Deposit Options Section */}
      <Column $gap={4} $width='100%' $alignItems='flex-start'>
        <BodyXSMonoSecondary>
          {t('Deposit funds').toUpperCase()}
        </BodyXSMonoSecondary>

        <DepositOption onPress={goToTransfer}>
          <Row $width='auto' $gap={12} $alignItems='center'>
            <FontAwesome5
              name='arrow-circle-down'
              size={24}
              color={theme.colors.textSecondary}
            />
            <Column $width='auto' $alignItems='flex-start'>
              <BodyMEmphasized>{t('Transfer-in')}</BodyMEmphasized>
              <BodySSecondary>{t('From Solana wallet')}</BodySSecondary>
            </Column>
          </Row>
          <MaterialIcons
            name='chevron-right'
            size={20}
            color={theme.colors.textSecondary}
          />
        </DepositOption>
        <Divider />
        <DepositOption onPress={goToCard}>
          <Row $width='auto' $gap={12} $alignItems='center'>
            <FontAwesome5
              name='cc-apple-pay'
              size={24}
              color={theme.colors.textSecondary}
            />
            <Column $width='auto' $alignItems='flex-start'>
              <BodyMEmphasized>{t('Card or Apple pay')}</BodyMEmphasized>
              <BodySSecondary>{t('Instant and secure payment')}</BodySSecondary>
            </Column>
          </Row>
          <MaterialIcons
            name='chevron-right'
            size={20}
            color={theme.colors.textSecondary}
          />
        </DepositOption>
      </Column>
    </Column>
  );
};

const IconContainer = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
  align-items: center;
  justify-content: center;
`;

const DepositOption = styled.Pressable`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 4px;
  border-radius: 12px;
`;
