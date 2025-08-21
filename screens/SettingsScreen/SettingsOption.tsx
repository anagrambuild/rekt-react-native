import React from "react";

import { BodyS, PressableOpacity, Row } from "@/components";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

export interface SettingsOptionProps {
  icon: keyof typeof MaterialIcon.glyphMap;
  label: string;
  onPress: () => void;
  iconColor?: string;
  labelColor?: string;
}

export const SettingsOption: React.FC<SettingsOptionProps> = ({
  icon,
  label,
  onPress,
  iconColor,
  labelColor,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <PressableOpacity onPress={onPress}>
      <Row $justifyContent="space-between">
        <Row $gap={12} $padding={4} $justifyContent="flex-start">
          <MaterialIcon
            name={icon}
            size={24}
            color={iconColor || theme.colors.textSecondary}
          />
          <BodyS style={{ color: labelColor || theme.colors.textPrimary }}>
            {t(label)}
          </BodyS>
        </Row>
        <MaterialIcon
          name="chevron-right"
          size={20}
          color={theme.colors.textSecondary}
        />
      </Row>
    </PressableOpacity>
  );
};
