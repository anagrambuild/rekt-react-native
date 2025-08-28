import { KeyboardAvoidingView, Modal as RNModal, Platform } from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { PressableOpacity } from "./buttons";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

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
  const theme = useTheme();
  const flingDownGesture = Gesture.Fling()
    .runOnJS(true)
    .direction(Directions.DOWN)
    .onStart(() => onRequestClose());

  return (
    <RNModal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ModalContainer>
          <Backdrop onPress={onRequestClose} testID="modal-backdrop" />
          <BottomSheetContainer>
            <GestureDetector gesture={flingDownGesture}>
              <ContentContainer>
                <HandleContainer>
                  {Platform.OS === "ios" ? (
                    <Handle />
                  ) : (
                    <PressableOpacity onPress={onRequestClose}>
                      <MaterialIcons
                        name="close"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                    </PressableOpacity>
                  )}
                </HandleContainer>
                {children}
              </ContentContainer>
            </GestureDetector>
          </BottomSheetContainer>
        </ModalContainer>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const ModalContainer = styled.View`
  flex: 1;
  position: relative;
`;

const Backdrop = styled.Pressable`
  flex: 1;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background + "CC"};
`;

const BottomSheetContainer = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
`;

const ContentContainer = styled.View`
  width: 100%;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.onPrimary};
  border-radius: 16px 16px 0 0;
  padding: 6px 24px 24px 24px;
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
