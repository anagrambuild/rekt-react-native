import { useEffect, useRef } from 'react';
import { Pressable, TextInput } from 'react-native';

import WalletIcon from '@/assets/images/app-svgs/wallet.svg';
import { BodyMEmphasized, BodyS, Row, ScrollRow } from '@/components';
import { Modal } from '@/components/common/Modal';
import { useHomeContext } from '@/contexts/HomeContext';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { PresetButton } from './PresetButton';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components/native';

// TODO - set wallet balance in context
const walletBalance = 1000.24;
// TODO - add amounts for sol eth and btc
export const AmountPopup = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { amount, setAmount } = useHomeContext();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <StyledSheetContainer>
        <Row>
          <Pressable onPress={onClose}>
            <MaterialIcon
              name='keyboard-arrow-left'
              size={32}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </Row>
        <BodyMEmphasized>{t('Enter amount')}</BodyMEmphasized>
        <StyledInput
          ref={inputRef}
          value={amount.toString()}
          onChangeText={setAmount}
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
        <ScrollRow $gap={8}>
          <PresetButton value={10} onPress={() => setAmount(10)} />
          <PresetButton value={50} onPress={() => setAmount(50)} />
          <PresetButton value={100} onPress={() => setAmount(100)} />
          <PresetButton value={200} onPress={() => setAmount(200)} />
          <PresetButton value={500} onPress={() => setAmount(500)} />
          <PresetButton value={1000} onPress={() => setAmount(1000)} />
        </ScrollRow>
      </StyledSheetContainer>
    </Modal>
  );
};

const StyledSheetContainer = styled.View<any>`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${(props: any) => props.theme.colors.backgroundSecondary};
  padding: 12px 0px 0px 0px;
  gap: 16px;
`;

const StyledInput = styled.TextInput`
  color: ${({ theme }: any) => theme.colors.textPrimary};
  font-family: 'Unbounded';
  font-size: 40px;
  font-weight: 500;
`;
