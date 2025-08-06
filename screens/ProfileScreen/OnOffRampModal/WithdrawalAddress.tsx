import { useState } from 'react';
import { Alert, Keyboard } from 'react-native';

import WalletSecondaryIcon from '@/assets/images/app-svgs/wallet-secondary.svg';
import {
  BodyMEmphasized,
  BodyMSecondary,
  BodySEmphasized,
  BodySSecondary,
  Column,
  Divider,
  Gap,
  PressableOpacity,
  PrimaryButton,
  Row,
  Title5,
} from '@/components';
import { useProfileContext } from '@/contexts/ProfileContext';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';

import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

export const WithdrawalAddress = ({
  setView,
}: {
  setView: (
    view:
      | 'balance'
      | 'transfer'
      | 'withdraw'
      | 'withdrawal address'
      | 'withdrawal success'
  ) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { withdrawalAddress, setWithdrawalAddress } = useProfileContext();

  const [address, setAddress] = useState(withdrawalAddress);
  const [acknowledgeValidAddress, setAcknowledgeValidAddress] = useState(false);
  const [acknowledgeNoReversal, setAcknowledgeNoReversal] = useState(false);

  const handleBack = () => setView('withdraw');

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        setAddress(clipboardContent);
      }
    } catch (error) {
      console.error('Error pasting from clipboard:', error);
    }
  };

  const handleConfirm = () => {
    if (!address.trim()) {
      Alert.alert(t('Error'), t('Please enter a wallet address'));
      return;
    }
    if (!acknowledgeValidAddress || !acknowledgeNoReversal) {
      Alert.alert(t('Error'), t('Please acknowledge all statements'));
      return;
    }

    setWithdrawalAddress(address.trim());
    setView('withdraw');
  };

  const isConfirmDisabled =
    !address.trim() || !acknowledgeValidAddress || !acknowledgeNoReversal;

  return (
    <Column $gap={16} $alignItems='center' $padding={4}>
      {/* Header Section */}
      <Row $justifyContent='flex-start' $gap={8}>
        <IconContainer onPress={handleBack}>
          <MaterialIcon
            name='chevron-left'
            size={24}
            color={theme.colors.textSecondary}
          />
        </IconContainer>
        <Title5>{t('Withdrawal address')}</Title5>
      </Row>
      <Gap />

      {/* Wallet Address Input Section */}
      <Column $gap={12} $alignItems='flex-start'>
        <BodyMEmphasized>{t('Wallet address')}</BodyMEmphasized>
        <AddressInputContainer>
          <WalletSecondaryIcon
            width={20}
            height={20}
            color={theme.colors.textSecondary}
          />
          <AddressInput
            value={address}
            onChangeText={setAddress}
            placeholder={t('Enter Solana wallet address')}
            placeholderTextColor={theme.colors.textSecondary}
            numberOfLines={3}
            textAlignVertical='top'
            returnKeyType='done'
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </AddressInputContainer>
        <PasteButton onPress={handlePaste}>
          <Octicons name='paste' size={16} color={theme.colors.textSecondary} />
          <BodySSecondary>{t('Paste')}</BodySSecondary>
        </PasteButton>
      </Column>

      <Divider />

      {/* Acknowledgment Section */}
      <Column $gap={16} $alignItems='flex-start'>
        <BodySEmphasized>{t('I acknowledge that')}:</BodySEmphasized>

        <AcknowledgmentRow
          onPress={() => setAcknowledgeValidAddress(!acknowledgeValidAddress)}
        >
          <Checkbox checked={acknowledgeValidAddress}>
            {acknowledgeValidAddress && (
              <MaterialIcon
                name='check'
                size={16}
                color={theme.colors.textPrimary}
              />
            )}
          </Checkbox>
          <BodyMSecondary style={{ flex: 1 }}>
            {t('This is a valid Solana wallet address')}
          </BodyMSecondary>
        </AcknowledgmentRow>

        <AcknowledgmentRow
          onPress={() => setAcknowledgeNoReversal(!acknowledgeNoReversal)}
        >
          <Checkbox checked={acknowledgeNoReversal}>
            {acknowledgeNoReversal && (
              <MaterialIcon
                name='check'
                size={16}
                color={theme.colors.textPrimary}
              />
            )}
          </Checkbox>
          <BodyMSecondary style={{ flex: 1 }}>
            {t(
              "I've double-checked the wallet address and understand that Rekt cannot reverse withdrawals"
            )}
          </BodyMSecondary>
        </AcknowledgmentRow>
      </Column>

      {/* Confirm Button */}
      <PrimaryButton
        onPress={handleConfirm}
        disabled={isConfirmDisabled}
        style={{
          opacity: isConfirmDisabled ? 0.5 : 1,
          width: '100%',
        }}
      >
        {t('Confirm')}
      </PrimaryButton>
    </Column>
  );
};

const IconContainer = styled(PressableOpacity)`
  align-items: center;
  justify-content: center;
`;

const AddressInputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
  border-radius: 12px;
  padding: 16px;
  gap: 12px;
`;

const AddressInput = styled.TextInput`
  flex: 1;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
  font-family: 'GeistMono';
  font-size: 14px;
`;

const PasteButton = styled(PressableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.secondary};
  border-radius: 100px;
  align-self: flex-start;
`;

const AcknowledgmentRow = styled(PressableOpacity)`
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 0;
`;

const Checkbox = styled.View<{ checked: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border: 2px solid
    ${({ theme, checked }: { theme: DefaultTheme; checked: boolean }) =>
      checked ? theme.colors.loss : theme.colors.textSecondary};
  background-color: ${({
    theme,
    checked,
  }: {
    theme: DefaultTheme;
    checked: boolean;
  }) => (checked ? theme.colors.loss : 'transparent')};
  align-items: center;
  justify-content: center;
  margin-top: 2px;
`;
