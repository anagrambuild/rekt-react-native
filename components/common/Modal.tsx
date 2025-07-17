import { KeyboardAvoidingView, Modal as RNModal, Platform } from 'react-native';

import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
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
  const flingDownGesture = Gesture.Fling()
    .runOnJS(true)
    .direction(Directions.DOWN)
    .onStart(() => onRequestClose());

  return (
    <RNModal
      transparent
      animationType='slide'
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Backdrop onPress={onRequestClose} testID='modal-backdrop' />
        <BottomSheetContainer>
          <GestureDetector gesture={flingDownGesture}>
            <ContentContainer>
              <HandleContainer>
                {Platform.OS === 'ios' && <Handle />}
              </HandleContainer>
              {children}
            </ContentContainer>
          </GestureDetector>
        </BottomSheetContainer>
      </KeyboardAvoidingView>
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

const BottomSheetContainer = styled.View`
  flex: 1;
  justify-content: flex-end;
`;

const ContentContainer = styled.View`
  width: 100%;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.onPrimary};
  border-radius: 16px 16px 0 0;
  padding: 6px 24px 24px 24px;
  z-index: 2;
  border-top-width: 1px;
  border-top-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.border};
  align-self: center;
`;

const HandleContainer = styled.View`
  width: 100%;
  align-self: center;
  justify-content: center;
  height: 24px;
  margin-bottom: 12px;
`;

const Handle = styled.View`
  width: 40px;
  height: 4px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.border};
  align-self: center;
`;
