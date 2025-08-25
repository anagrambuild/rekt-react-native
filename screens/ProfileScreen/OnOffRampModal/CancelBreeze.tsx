import coinIcon from "@/assets/images/app-pngs/coin.png";
import {
  BodyMEmphasized,
  BodyMSecondary,
  Column,
  Gap,
  PressableOpacity,
  PrimaryButton,
  SecondaryButton,
} from "@/components";
import { useAppContext } from "@/contexts";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";

import { OnOffRampViewType } from ".";

export const CancelBreeze = ({
  setView,
}: {
  setView: (view: OnOffRampViewType) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { setHasBreeze } = useAppContext();

  const handleBack = () => {
    setView("balance");
  };

  const handleConfirmCancel = () => {
    setHasBreeze(false);
    setView("balance");
  };

  const handleCancel = () => {
    setView("balance");
  };

  return (
    <Column $gap={16} $alignItems="center" $padding={4}>
      {/* Header Section */}
      <IconContainer onPress={handleBack}>
        <MaterialIcon
          name="chevron-left"
          size={24}
          color={theme.colors.textSecondary}
        />
      </IconContainer>

      {/* Coin Icon and Title */}
      <Column $width="auto" $gap={4} $alignItems="flex-start">
        <Image source={coinIcon} style={{ width: 64, height: 64 }} />
        <Gap />
        <BodyMEmphasized>{t("Turn off earning power?")}</BodyMEmphasized>
        <BodyMSecondary>
          {t(
            "You'll stop earning yield on your balance. You can always turn this back on later from your settings."
          )}
        </BodyMSecondary>
      </Column>
      <Gap />

      {/* Action Buttons */}
      <Column $gap={8} $width="100%">
        <PrimaryButton onPress={handleCancel}>
          {t("Keep earning")}
        </PrimaryButton>
        <SecondaryButton onPress={handleConfirmCancel}>
          {t("Turn off earning")}
        </SecondaryButton>
      </Column>
    </Column>
  );
};

const IconContainer = styled(PressableOpacity)`
  padding: 0px 16px 0 0;
  align-items: flex-start;
  width: 100%;
`;
