import { useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';

import WalletIcon from '@/assets/images/app-svgs/wallet.svg';
import {
  BodyMEmphasized,
  BodyS,
  PressableOpacity,
  PrimaryButton,
  Row,
  ScrollRow,
} from '@/components';
import { Modal } from '@/components/common/Modal';
import { useHomeContext } from '@/contexts/HomeContext';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { PresetButton } from './PresetButton';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components/native';

export const AmountModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    selectedToken,
    solTrade,
    setSolTrade,
    ethTrade,
    setEthTrade,
    btcTrade,
    setBtcTrade,
    walletBalance,
  } = useHomeContext();
  const inputRef = useRef<TextInput>(null);

  const trade =
    selectedToken === 'sol'
      ? solTrade
      : selectedToken === 'eth'
      ? ethTrade
      : btcTrade;

  const setTrade =
    selectedToken === 'sol'
      ? setSolTrade
      : selectedToken === 'eth'
      ? setEthTrade
      : setBtcTrade;

  const amount = trade?.amount ?? 10;

  const initialAmount = String(amount);
  const [localAmount, setLocalAmount] = useState(initialAmount);

  useEffect(() => {
    if (visible) {
      setLocalAmount(String(amount)); // Reset localAmount to current amount when modal opens
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [visible, amount]);

  const onSetAmount = () => {
    const parsed = Number(localAmount);
    if (trade) {
      setTrade({ ...trade, amount: isNaN(parsed) ? 0 : parsed });
    }
    onClose();
  };

  const handleAmountChange = (text: string) => {
    // Allow only numbers with up to 2 decimal places
    if (/^\d*\.?\d{0,2}$/.test(text)) {
      setLocalAmount(text);
    }
  };

  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <StyledSheetContainer>
        <Row>
          <PressableOpacity onPress={onClose}>
            <MaterialIcon
              name='keyboard-arrow-left'
              size={32}
              color={theme.colors.textSecondary}
            />
          </PressableOpacity>
        </Row>
        <BodyMEmphasized>{t('Enter amount')}</BodyMEmphasized>
        <StyledInput
          ref={inputRef}
          value={localAmount}
          onChangeText={handleAmountChange}
          keyboardType='numeric'
          selectionColor={theme.colors.loss}
        />
        <Row
          $gap={8}
          $alignItems='center'
          $width='auto'
          $padding={12}
          style={{
            backgroundColor: theme.colors.secondary,
            borderRadius: 100,
          }}
        >
          <WalletIcon width={24} height={24} />
          <BodyS>${walletBalance} USDC</BodyS>
        </Row>
        <ScrollRow $gap={8} keyboardShouldPersistTaps='always'>
          <PresetButton value={10} onPress={() => setLocalAmount('10')} />
          <PresetButton value={50} onPress={() => setLocalAmount('50')} />
          <PresetButton value={100} onPress={() => setLocalAmount('100')} />
          <PresetButton value={200} onPress={() => setLocalAmount('200')} />
          <PresetButton value={500} onPress={() => setLocalAmount('500')} />
          <PresetButton value={1000} onPress={() => setLocalAmount('1000')} />
        </ScrollRow>
        <PrimaryButton onPress={onSetAmount}>{t('Set amount')}</PrimaryButton>
      </StyledSheetContainer>
    </Modal>
  );
};

const StyledSheetContainer = styled.View<any>`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${(props: any) => props.theme.colors.onPrimary};
  padding: 12px 0px 0px 0px;
  gap: 16px;
`;

const StyledInput = styled.TextInput`
  color: ${({ theme }: any) => theme.colors.textPrimary};
  font-family: 'Unbounded';
  font-size: 40px;
  font-weight: 500;
`;
