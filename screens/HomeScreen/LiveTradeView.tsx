import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

import rektBomb from "@/assets/images/app-pngs/rekt-bomb.png";
import UsdcIcon from "@/assets/images/app-svgs/usdc.svg";
import {
  BodyMEmphasized,
  BodyMSecondary,
  BodySEmphasized,
  Card,
  Column,
  PressableOpacity,
  Row,
  Title5,
} from "@/components";
import { useHomeContext } from "@/contexts";
import { Trade } from "@/contexts/HomeContext";
import {
  calculatePositionMetricsFromUI,
  pythPriceService,
  SupportedToken,
} from "@/utils";

import { LongArrow, ShortArrow } from "./long-short-buttons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

interface LiveTradeViewProps {
  trade: Trade;
}

export const LiveTradeView = ({ trade }: LiveTradeViewProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    selectedToken,
    setSolTrade,
    setEthTrade,
    setBtcTrade,
    closePosition,
    openPositions,
    isTrading,
  } = useHomeContext();

  // State for real-time price
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Find the actual position for this token (don't require direction match)
  const currentPosition = openPositions.find(
    pos => pos.market === selectedToken.toUpperCase()
  );

  // Subscribe to real-time price updates
  useEffect(() => {
    // Start price streaming if not already active
    if (!pythPriceService.isActive()) {
      pythPriceService.startStreaming().catch(console.error);
    }

    // Subscribe to price updates for the selected token
    const subscriptionId = pythPriceService.subscribe(
      selectedToken as SupportedToken,
      priceData => {
        setCurrentPrice(priceData.price);
      }
    );

    // Get initial price if available
    const latestPrice = pythPriceService.getLatestPrice(
      selectedToken as SupportedToken
    );
    if (latestPrice) {
      setCurrentPrice(latestPrice.price);
    }

    return () => {
      pythPriceService.unsubscribe(subscriptionId);
    };
  }, [selectedToken]);

  // Calculate position metrics using real-time price and position calculation functions
  // Use backend position size if available, otherwise fall back to trade amount
  const positionSize = currentPosition
    ? currentPosition.size * 100
    : trade.amount;

  const positionMetrics =
    currentPrice && trade.entryPrice
      ? calculatePositionMetricsFromUI(
          trade.entryPrice,
          currentPrice,
          positionSize,
          trade.leverage,
          trade.side
        )
      : null;

  // Use calculated metrics or fallback to backend data
  const currentValue =
    positionMetrics?.currentValue ??
    (currentPosition
      ? currentPosition.marginUsed + currentPosition.pnl
      : trade.amount);

  const profitPercent =
    positionMetrics?.pnlPercentage ?? (currentPosition?.pnlPercentage || 0);

  const pnlAmount = positionMetrics?.pnl ?? (currentPosition?.pnl || 0);

  const isProfit = pnlAmount >= 0;

  // Use real position data for liquidation price
  const rektAt = currentPosition?.liquidationPrice;

  const handleClose = async () => {
    // Try to get position ID from local trade first, then backend position
    const positionId = trade.positionId || currentPosition?.id;

    if (positionId) {
      // Close the actual position via backend
      const success = await closePosition(positionId);
      if (success) {
        // Clear local trade state after successful close
        if (selectedToken === "sol") setSolTrade(null);
        else if (selectedToken === "eth") setEthTrade(null);
        else setBtcTrade(null);
      }
    } else {
      // Fallback: just clear local state if no position ID found
      if (selectedToken === "sol") setSolTrade(null);
      else if (selectedToken === "eth") setEthTrade(null);
      else setBtcTrade(null);
    }
  };

  return (
    <Card>
      <Column $gap={4}>
        <Row $padding={12} style={{ paddingTop: 8 }}>
          <Row $gap={12} $width="auto">
            {trade.side === "LONG" ? (
              <LongArrow size={28} />
            ) : (
              <ShortArrow size={28} />
            )}
            <BodyMEmphasized>
              {trade.leverage}x {t(trade.side === "LONG" ? "Long" : "Short")}
            </BodyMEmphasized>
          </Row>
          <SellNowButton onPress={handleClose} disabled={isTrading}>
            {isTrading ? (
              <ActivityIndicator size="small" color={theme.colors.background} />
            ) : (
              <SellNowText>{t("Sell now")}</SellNowText>
            )}
          </SellNowButton>
        </Row>

        <InnerCard>
          <Row $alignItems="flex-end">
            <Column $gap={4} $alignItems="flex-start" $width="auto">
              <Title5>
                $
                {currentValue.toLocaleString("en-US", {
                  minimumFractionDigits: currentValue < 1 ? 4 : 2,
                  maximumFractionDigits: currentValue < 1 ? 4 : 2,
                })}
              </Title5>
              <BodyMSecondary>{t("Current value")}</BodyMSecondary>
            </Column>
            <Column $gap={4} $alignItems="flex-end" $width="auto">
              <ProfitText $isProfit={isProfit} theme={theme}>
                {isProfit ? "+" : ""}
                {profitPercent.toFixed(2)}%
              </ProfitText>
              <BodyMSecondary>{t("Profit")}</BodyMSecondary>
            </Column>
          </Row>
        </InnerCard>

        <InnerCard>
          <Row>
            <Row $gap={8} $alignItems="center" $width="auto">
              <RektIcon source={rektBomb} />
              <BodyMSecondary>{t("Rekt at")}</BodyMSecondary>
            </Row>
            <BodySEmphasized>
              {rektAt
                ? `$${rektAt.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : t("N/A")}
            </BodySEmphasized>
          </Row>
        </InnerCard>
        <InnerCard>
          <Row>
            <Row $gap={8} $alignItems="center" $width="auto">
              <UsdcIcon width={20} height={20} />
              <BodyMSecondary>{t("Amount invested")}</BodyMSecondary>
            </Row>
            <BodySEmphasized>
              $
              {trade.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </BodySEmphasized>
          </Row>
        </InnerCard>
      </Column>
    </Card>
  );
};

interface SellNowButtonProps {
  theme: DefaultTheme;
  disabled?: boolean;
}

const SellNowButton = styled(PressableOpacity)<{ disabled?: boolean }>`
  background-color: ${({ theme, disabled }: SellNowButtonProps) =>
    disabled ? theme.colors.textSecondary : theme.colors.textPrimary};
  border-radius: 100px;
  padding: 6px 12px;
  align-items: center;
  justify-content: center;
  opacity: ${({ disabled }: SellNowButtonProps) => (disabled ? 0.6 : 1)};
`;

const SellNowText = styled(BodySEmphasized)`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.background};
`;

const InnerCard = styled(Card)`
  padding: 16px;
  gap: 16px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

// Fix linter error for ProfitText
interface ProfitTextProps {
  theme: DefaultTheme;
  $isProfit: boolean;
}

const ProfitText = styled(Title5)<ProfitTextProps>`
  color: ${({ theme, $isProfit }: ProfitTextProps) =>
    $isProfit ? theme.colors.profit : theme.colors.loss};
`;

const RektIcon = styled(Image)`
  width: 20px;
  height: 20px;
`;
