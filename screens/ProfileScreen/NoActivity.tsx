import TradeIcon from "@/assets/images/app-svgs/trade.svg";
import {
  BodyMSecondary,
  BodySEmphasized,
  Card,
  Column,
  PressableOpacity,
  Title5,
} from "@/components";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

const tradeIconSize = 24;

export const NoActivity = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleTrade = () => {
    router.replace("/");
  };
  return (
    <Card $padding={24} style={{ flex: 1 }}>
      <Column $gap={24}>
        <Column $gap={8} $width="80%">
          <TradeIcon width={tradeIconSize} height={tradeIconSize} />
          <Title5>{t("No trades yet")}</Title5>
          <BodyMSecondary style={{ textAlign: "center" }}>
            {t(
              "Once you start trading, you will be able to see your activity here"
            )}
          </BodyMSecondary>
        </Column>
        <TradeButton onPress={handleTrade}>
          <BodySEmphasized style={{ color: theme.colors.card }}>
            {t("Start trading")}
          </BodySEmphasized>
          <FontAwesome5
            name="arrow-circle-right"
            size={16}
            color={theme.colors.card}
          />
        </TradeButton>
      </Column>
    </Card>
  );
};

const TradeButton = styled(PressableOpacity)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 100px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.textPrimary};
`;
