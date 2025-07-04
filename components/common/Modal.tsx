import React from 'react';
import { Modal as RNModal } from 'react-native';

import styled, { DefaultTheme } from 'styled-components/native';

interface ModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onRequestClose,
  children,
}) => {
  return (
    <RNModal
      transparent
      animationType='fade'
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <Backdrop onPress={onRequestClose} testID='modal-backdrop' />
      <ContentContainer>{children}</ContentContainer>
    </RNModal>
  );
};

const Backdrop = styled.Pressable`
  flex: 1;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background + 'CC'};
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
`;

const ContentContainer = styled.View`
  position: absolute;
  top: 30%;
  left: 20px;
  right: 20px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.backgroundSecondary};
  border-radius: 16px;
  padding: 16px;
  z-index: 2;
`;
