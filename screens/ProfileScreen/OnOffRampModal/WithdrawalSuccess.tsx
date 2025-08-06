import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import {
  Body1Secondary,
  BodyMEmphasized,
  BodyMSecondary,
  BodyS,
  BodySSecondary,
  Card,
  Column,
  Gap,
  PressableOpacity,
  Row,
  SecondaryButton,
  Title3,
} from '@/components';
import { useProfileContext } from '@/contexts/ProfileContext';
import { truncateAddress } from '@/utils/addressUtils';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';

import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';
import { Toast } from 'toastify-react-native';

export const WithdrawalSuccess = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { withdrawalAddress, withdrawalAmount, setIsOnOffRampModalVisible } =
    useProfileContext();
  const [networkFee] = useState(0.2);
  const [netAmount] = useState(199.8);
  const [transactionTime] = useState(
    new Date().toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  );

  const copyToClipboard = async () => {
    if (!withdrawalAddress) return;

    await Clipboard.setStringAsync(withdrawalAddress);

    if (Platform.OS === 'android') {
      Toast.show({
        text1: t('Address copied to clipboard'),
        type: 'success',
        backgroundColor: theme.colors.card,
        textColor: theme.colors.textPrimary,
        progressBarColor: theme.colors.profit,
        iconColor: theme.colors.profit,
      });
    } else {
      Alert.alert(t('Address copied to clipboard'));
    }
  };

  const handleDone = () => {
    setIsOnOffRampModalVisible(false);
  };

  return (
    <Column $gap={24} $alignItems='center' $padding={4}>
      <Gap />
      {/* Success Icon */}
      <SuccessIconContainer>
        <MaterialIcon name='check' size={48} color={theme.colors.background} />
      </SuccessIconContainer>

      {/* Success Message */}
      <Column $gap={8} $alignItems='center'>
        <Title3>{t('Withdrawal submitted')}</Title3>
        <BodyMSecondary style={{ textAlign: 'center' }}>
          $
          {t('{{amount}} has been withdrawn from your balance', {
            amount: withdrawalAmount,
          })}
        </BodyMSecondary>
      </Column>

      <Column $gap={4}>
        {/* Transaction Details Card */}
        <Card $padding={16}>
          <Column $gap={16}>
            {/* Net Amount */}
            <Row $justifyContent='space-between' $alignItems='flex-start'>
              <Column $gap={4} $width='auto' $alignItems='flex-start'>
                <BodyMSecondary>{t('Net amount')}</BodyMSecondary>
                <BodySSecondary style={{ color: theme.colors.textSecondary }}>
                  {t('After fee')}: ${networkFee.toFixed(2)}
                </BodySSecondary>
              </Column>
              <Row $gap={4} $width='auto'>
                <BodyMEmphasized>{netAmount.toFixed(2)}</BodyMEmphasized>
                <UsdcIcon width={20} height={20} />
              </Row>
            </Row>
          </Column>
        </Card>

        {/* To Address */}
        <Card $padding={16}>
          <Row $gap={8} $width='auto'>
            <BodyMSecondary>{t('To')}</BodyMSecondary>
            <Row $gap={8} $alignItems='center' $width='auto'>
              <Body1Secondary>
                {withdrawalAddress ? truncateAddress(withdrawalAddress) : ''}
              </Body1Secondary>
              <PressableOpacity onPress={copyToClipboard}>
                <Octicons
                  name='copy'
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </PressableOpacity>
            </Row>
          </Row>
        </Card>

        {/* Time */}
        <Card $padding={16}>
          <Row $justifyContent='space-between' $alignItems='center'>
            <BodyMSecondary>{t('Time')}</BodyMSecondary>
            <Body1Secondary>{transactionTime}</Body1Secondary>
          </Row>
        </Card>

        {/* Transaction */}
        <Card $padding={16}>
          <Row $justifyContent='space-between' $alignItems='center'>
            <BodyMSecondary>{t('Transaction')}</BodyMSecondary>
            <PressableOpacity>
              <MaterialIcon
                name='open-in-new'
                size={20}
                color={theme.colors.textSecondary}
              />
            </PressableOpacity>
          </Row>
        </Card>
      </Column>

      {/* Info Box */}
      <InfoBox>
        <MaterialIcon name='info' size={20} color={theme.colors.textPrimary} />
        <BodyS>
          {t(
            'Transactions can take up to a couple minutes to process, depending on network activity.'
          )}
        </BodyS>
      </InfoBox>

      {/* Done Button */}
      <SecondaryButton onPress={handleDone} style={{ width: '100%' }}>
        {t('Done')}
      </SecondaryButton>
    </Column>
  );
};

const SuccessIconContainer = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.profit};
  align-items: center;
  justify-content: center;
`;

const InfoBox = styled.View`
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.card};
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  border-width: 2px;
  gap: 8px;
`;
