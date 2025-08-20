import React from "react";
import { View } from "react-native";

import {
  Body1,
  BodySSecondary,
  Column,
  Modal,
  PrimaryButton,
  SecondaryButton,
} from "@/components";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

interface DeleteAccountModalProps {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onRequestClose,
  onConfirm,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} onRequestClose={onRequestClose}>
      <Column $gap={24} $alignItems="center" style={{ padding: 12 }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.colors.loss,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialIcon
            name="warning"
            size={32}
            color={theme.colors.background}
          />
        </View>

        <Body1 style={{ textAlign: "center" }}>{t("Are you sure?")}</Body1>

        {/* Description */}
        <BodySSecondary style={{ textAlign: "center" }}>
          {t(
            "This action cannot be undone. All your data will be permanently deleted."
          )}
        </BodySSecondary>

        {/* Buttons */}
        <Column $gap={12} style={{ width: "100%" }}>
          {/* Primary Button - Yes, Delete account */}
          <PrimaryButton onPress={onConfirm}>
            {t("Yes, Delete account")}
          </PrimaryButton>

          {/* Secondary Button - Close */}
          <SecondaryButton onPress={onRequestClose}>
            {t("Close")}
          </SecondaryButton>
        </Column>
      </Column>
    </Modal>
  );
};
