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

interface SignOutModalProps {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  visible,
  onRequestClose,
  onConfirm,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} onRequestClose={onRequestClose}>
      <Column $gap={24} $alignItems="center" style={{ padding: 12 }}>
        {/* Red circular icon with question mark */}
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
          <MaterialIcon name="help" size={32} color={theme.colors.background} />
        </View>

        {/* Title */}
        <Body1 style={{ textAlign: "center" }}>{t("Are you sure?")}</Body1>

        {/* Description */}
        <BodySSecondary style={{ textAlign: "center" }}>
          {t("This will sign you out of your Rekt account.")}
        </BodySSecondary>

        {/* Buttons */}
        <Column $gap={12} style={{ width: "100%" }}>
          {/* Primary Button - Yes, Sign out */}
          <PrimaryButton onPress={onConfirm}>
            {t("Yes, Sign out")}
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
