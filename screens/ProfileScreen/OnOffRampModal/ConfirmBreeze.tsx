import coinIcon from "@/assets/images/app-pngs/coin.png";
import BreezeLogo from "@/assets/images/app-svgs/breeze-logo.svg";
import {
  BodyMEmphasized,
  BodyMSecondary,
  Card,
  Column,
  Divider,
  Gap,
  PressableOpacity,
  PrimaryButton,
  Row,
  SecondaryButton,
} from "@/components";
import { useAppContext } from "@/contexts";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";

export const ConfirmBreeze = ({
  setView,
}: {
  setView: (
    view:
      | "balance"
      | "transfer"
      | "withdraw"
      | "withdrawal address"
      | "withdrawal success"
  ) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { setHasBreeze } = useAppContext();

  const handleBack = () => {
    setView("balance");
  };

  const handleEnableYields = () => {
    setHasBreeze(true);
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
        <BodyMEmphasized>{t("Earn 5% APY on your balance")}</BodyMEmphasized>
        <BodyMSecondary>
          {t(
            "We partnered with Breeze so your balance can earn up to 5% APY automatically."
          )}
        </BodyMSecondary>
      </Column>
      <Gap />

      {/* Features List */}
      <Column $gap={12} $width="100%">
        <Row $gap={12} $alignItems="center" $justifyContent="flex-start">
          <MaterialIcon
            name="check-circle"
            size={20}
            color={theme.colors.profit}
          />
          <BodyMSecondary>{t("Completely autopilot")}</BodyMSecondary>
        </Row>
        <Divider />
        <Row $gap={12} $alignItems="center" $justifyContent="flex-start">
          <MaterialIcon
            name="check-circle"
            size={20}
            color={theme.colors.profit}
          />
          <BodyMSecondary>
            {t("Real time earnings streamed every second")}
          </BodyMSecondary>
        </Row>
        <Divider />
        <Row $gap={12} $alignItems="center" $justifyContent="flex-start">
          <MaterialIcon
            name="check-circle"
            size={20}
            color={theme.colors.profit}
          />
          <BodyMSecondary>{t("Balance is usable at all times")}</BodyMSecondary>
        </Row>
        <Divider />
        <Row $gap={12} $alignItems="center" $justifyContent="flex-start">
          <MaterialIcon
            name="check-circle"
            size={20}
            color={theme.colors.profit}
          />
          <BodyMSecondary>{t("Disable any time from Settings")}</BodyMSecondary>
        </Row>
      </Column>

      {/* Powered by Breeze Card */}
      <BreezeCard>
        <Row
          $gap={12}
          $alignItems="center"
          $justifyContent="flex-start"
          $width="100%"
        >
          <BreezeLogo />
          <Column $gap={2} $width="auto" $alignItems="flex-start">
            <BodyMSecondary>{t("Powered by Breeze")}</BodyMSecondary>
            <BodyMSecondary style={{ color: theme.colors.textSecondary }}>
              breeze.baby
            </BodyMSecondary>
          </Column>
        </Row>
      </BreezeCard>
      <Column $gap={8} $width="100%">
        <PrimaryButton onPress={handleEnableYields}>
          {t("Enable yields")}
        </PrimaryButton>
        <SecondaryButton>{t("Maybe later")}</SecondaryButton>
      </Column>
    </Column>
  );
};

const IconContainer = styled(PressableOpacity)`
  padding: 0px 16px 0 0;
  align-items: flex-start;
  width: 100%;
`;

const BreezeCard = styled(Card)`
  width: 100%;
  padding: 16px;
  background-color: ${({ theme }: { theme: any }) =>
    theme.colors.backgroundSecondary};
`;
