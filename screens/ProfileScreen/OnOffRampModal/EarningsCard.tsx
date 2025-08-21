import { useEffect, useState } from "react";
import { View } from "react-native";

import coinDarkIcon from "@/assets/images/app-pngs/coin-dark.png";
import {
  BodyMEmphasized,
  BodyMSecondary,
  Card,
  Column,
  PressableOpacity,
  Row,
} from "@/components";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { FloatingUsdcIcon } from "./FloatingUsdcIcon";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";

interface EarningsCardProps {
  targetPosition: { x: number; y: number };
  handleEarningAmountLayout: () => void;
  earningAmountRef: React.RefObject<View | null>;
  earningAmountTextRef: React.RefObject<View | null>;
  setView?: (
    view:
      | "balance"
      | "transfer"
      | "withdraw"
      | "withdrawal address"
      | "withdrawal success"
      | "confirm breeze"
      | "cancel breeze"
  ) => void;
}

export const EarningsCard = ({
  targetPosition,
  handleEarningAmountLayout,
  earningAmountRef,
  earningAmountTextRef,
  setView,
}: EarningsCardProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [earnings, setEarnings] = useState(0.0000002);

  const handlePress = () => {
    if (setView) {
      setView("cancel breeze");
    }
  };

  // Increment earnings every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setEarnings(prev => {
        const newValue = prev + 0.0000001;
        return parseFloat(newValue.toFixed(7));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <EarningsCardContainer
      ref={earningAmountRef}
      onLayout={handleEarningAmountLayout}
    >
      <PressableOpacity onPress={handlePress}>
        <Row $gap={16} $alignItems="center" $width="auto">
          <Row $gap={12} $alignItems="center" $width="auto" style={{ flex: 1 }}>
            <CoinContainer>
              <Image
                source={coinDarkIcon}
                style={{
                  width: 32,
                  height: 32,
                }}
              />
            </CoinContainer>

            {/* Text content */}
            <Column $gap={4} $alignItems="flex-start">
              <BodyMEmphasized>{t("Earnings so far")}</BodyMEmphasized>
              <Row $alignItems="center" $justifyContent="flex-start">
                <BodyMSecondary>${earnings.toFixed(7)}</BodyMSecondary>
                <View
                  ref={earningAmountTextRef}
                  onLayout={handleEarningAmountLayout}
                  style={{ width: 8, height: 1 }}
                />
                {/* Floating USDC Icon Animation - starts near the $ amount text */}
                <FloatingUsdcIcon size={16} targetPosition={targetPosition} />
              </Row>
            </Column>
          </Row>

          {/* Right arrow */}
          <MaterialIcon
            name="chevron-right"
            size={24}
            color={theme.colors.textPrimary}
          />
        </Row>
      </PressableOpacity>
    </EarningsCardContainer>
  );
};

const EarningsCardContainer = styled(Card)`
  width: 100%;
  padding: 16px;
  background-color: transparent;
  border-radius: 12px;
  position: relative;
  overflow: visible;
`;

const CoinContainer = styled.View`
  width: 40px;
  height: 40px;
  position: relative;
`;
