import { Platform, SafeAreaView, ScrollView } from "react-native";

import SolanaIcon from "@/assets/images/app-svgs/sol-selected.svg";
import UsdcIcon from "@/assets/images/app-svgs/usdc.svg";
import {
  Body1,
  BodyM,
  BodySSecondary,
  BodyXSMonoSecondary,
  Card,
  Column,
  PressableOpacity,
  Row,
  Title2,
  Title4,
} from "@/components";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useTranslation } from "react-i18next";
import Svg, { Circle } from "react-native-svg";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

// Mock data for stats
const mockStats = {
  summary: {
    trades: 800,
    volume: 8000,
    winRate: 52.8,
    pnl: 28,
  },
  performance: {
    topWin: 1200,
    topLoss: 600,
    last7Days: 52.8,
    longestWinStreak: 7,
  },
  strategy: {
    topAsset: "SOL",
    avgDuration: "5 mins",
    favLeverage: "50x",
  },
};

interface StatsViewProps {
  onBack: () => void;
}

const screenPadding = 20;
const paddingTop = Platform.OS === "ios" ? 0 : 30;

export const StatsView = ({ onBack }: StatsViewProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Column
        $padding={screenPadding}
        $gap={24}
        style={{ marginTop: paddingTop, flex: 1 }}
      >
        {/* Header */}
        <Row $justifyContent="space-between">
          <Row $width="auto" $justifyContent="flex-start" $gap={12}>
            <PressableOpacity onPress={onBack}>
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={theme.colors.textPrimary}
              />
            </PressableOpacity>
            <Title2>{t("My stats")}</Title2>
          </Row>
          <Row $width="auto" $gap={8}>
            <MaterialIcons
              name="calendar-today"
              size={20}
              color={theme.colors.textSecondary}
            />
            <BodySSecondary>{t("All time")}</BodySSecondary>
          </Row>
        </Row>
        <Row>
          <BodyM
            style={{
              backgroundColor: "#3d3d3d",
              borderRadius: 8,
              padding: 2,
            }}
          >
            {"This screen is under development and this is not real data"}
          </BodyM>
        </Row>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Column $gap={24}>
            {/* Summary Section */}
            <Column $gap={4} $alignItems="flex-start">
              <Title4 style={{ marginBottom: 12 }}>{t("Summary")}</Title4>
              <Row $gap={4} $justifyContent="space-between">
                <Card style={{ flex: 1 }}>
                  <Column $alignItems="flex-start" $padding={16} $gap={8}>
                    <BodyXSMonoSecondary>
                      {t("Trades").toUpperCase()}
                    </BodyXSMonoSecondary>
                    <Body1>{mockStats.summary.trades.toLocaleString()}</Body1>
                  </Column>
                </Card>
                <Card style={{ flex: 1 }}>
                  <Column $alignItems="flex-start" $padding={16} $gap={8}>
                    <BodyXSMonoSecondary>
                      {t("Volume").toUpperCase()}
                    </BodyXSMonoSecondary>
                    <Body1>${mockStats.summary.volume.toLocaleString()}</Body1>
                  </Column>
                </Card>
              </Row>
              <Row $gap={4} $justifyContent="space-between">
                <Card style={{ flex: 1 }}>
                  <Column $alignItems="flex-start" $padding={16} $gap={8}>
                    <BodyXSMonoSecondary>
                      {t("Win rate").toUpperCase()}
                    </BodyXSMonoSecondary>
                    <Row $alignItems="center" $gap={8}>
                      <Body1>{mockStats.summary.winRate}%</Body1>
                      <WinRateCircle $percentage={mockStats.summary.winRate}>
                        <WinRateProgressSvg
                          percentage={mockStats.summary.winRate}
                          theme={theme}
                        />
                      </WinRateCircle>
                    </Row>
                  </Column>
                </Card>
                <Card style={{ flex: 1 }}>
                  <Column $alignItems="flex-start" $padding={16} $gap={8}>
                    <BodyXSMonoSecondary>{t("P&L")}</BodyXSMonoSecondary>
                    <Row $justifyContent="flex-start" $gap={8}>
                      <PnLIndicator $isProfit={true}>
                        <BodySSecondary style={{ color: theme.colors.profit }}>
                          P
                        </BodySSecondary>
                      </PnLIndicator>
                      <Body1 style={{ color: theme.colors.profit }}>
                        {mockStats.summary.pnl}%
                      </Body1>
                    </Row>
                  </Column>
                </Card>
              </Row>
            </Column>

            {/* Performance Section */}
            <Column $gap={4} $alignItems="flex-start">
              <Title4 style={{ marginBottom: 12 }}>{t("Performance")}</Title4>
              <Row $gap={4} $justifyContent="space-between">
                <Card style={{ flex: 1 }}>
                  <Column $alignItems="flex-start" $padding={16} $gap={8}>
                    <BodyXSMonoSecondary>
                      {t("Top win").toUpperCase()}
                    </BodyXSMonoSecondary>
                    <Row $justifyContent="flex-start" $gap={8}>
                      <Body1>
                        ${mockStats.performance.topWin.toLocaleString()}
                      </Body1>
                      <UsdcIcon width={24} height={24} />
                    </Row>
                  </Column>
                </Card>
                <Card style={{ flex: 1 }}>
                  <Column $alignItems="flex-start" $padding={16} $gap={8}>
                    <BodyXSMonoSecondary>
                      {t("Top loss").toUpperCase()}
                    </BodyXSMonoSecondary>
                    <Row $justifyContent="flex-start" $gap={8}>
                      <Body1>
                        ${mockStats.performance.topLoss.toLocaleString()}
                      </Body1>
                      <UsdcIcon width={24} height={24} />
                    </Row>
                  </Column>
                </Card>
              </Row>
              <Card style={{ flex: 1 }}>
                <Column $alignItems="flex-start" $padding={16} $gap={8}>
                  <BodyXSMonoSecondary>
                    {t("Last 7 days").toUpperCase()}
                  </BodyXSMonoSecondary>
                  <Row $alignItems="center" $gap={8}>
                    <Body1>{mockStats.performance.last7Days}%</Body1>
                    <MiniChart>
                      <ChartBar $isPositive={true} />
                      <ChartBar $isPositive={true} />
                      <ChartBar $isPositive={false} />
                      <ChartBar $isPositive={false} />
                    </MiniChart>
                  </Row>
                </Column>
              </Card>
              <Card style={{ flex: 1 }}>
                <Column $alignItems="flex-start" $padding={16} $gap={8}>
                  <BodyXSMonoSecondary>
                    {t("Longest win streak").toUpperCase()}
                  </BodyXSMonoSecondary>
                  <Body1>{mockStats.performance.longestWinStreak}</Body1>
                </Column>
              </Card>
            </Column>

            {/* Strategy Section */}
            <Column $gap={4} $alignItems="flex-start">
              <Title4 style={{ marginBottom: 12 }}>{t("Strategy")}</Title4>
              <Card>
                <Column $alignItems="flex-start" $padding={16} $gap={8}>
                  <BodyXSMonoSecondary>
                    {t("Fav. leverage").toUpperCase()}
                  </BodyXSMonoSecondary>
                  <Body1>{mockStats.strategy.favLeverage}</Body1>
                </Column>
              </Card>
              <Row $gap={4} $justifyContent="space-between">
                <Card style={{ flex: 1 }}>
                  <Column $alignItems="flex-start" $padding={16} $gap={8}>
                    <BodyXSMonoSecondary>
                      {t("Top assets").toUpperCase()}
                    </BodyXSMonoSecondary>
                    <Row $alignItems="center" $gap={6}>
                      <Body1>{mockStats.strategy.topAsset}</Body1>
                      <SolanaIcon />
                    </Row>
                  </Column>
                </Card>
                <Card style={{ flex: 1, height: "100%" }}>
                  <Column $alignItems="flex-start" $padding={16} $gap={8}>
                    <BodyXSMonoSecondary>
                      {t("Avg. duration").toUpperCase()}
                    </BodyXSMonoSecondary>
                    <Body1>{mockStats.strategy.avgDuration}</Body1>
                  </Column>
                </Card>
              </Row>
            </Column>
          </Column>
        </ScrollView>
      </Column>
    </SafeAreaView>
  );
};

// SVG Progress Component
const WinRateProgressSvg = ({
  percentage,
  theme,
}: {
  percentage: number;
  theme: DefaultTheme;
}) => {
  const radius = 14;
  const strokeWidth = 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Svg
      width="32"
      height="32"
      style={{ position: "absolute", top: -2, left: -2 }}
    >
      <Circle
        cx="16"
        cy="16"
        r={radius}
        stroke={theme.colors.profit}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 16 16)"
      />
    </Svg>
  );
};

// Styled Components
const WinRateCircle = styled.View<{ $percentage: number }>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: transparent;
  border-color: ${({
    theme,
    $percentage,
  }: {
    theme: DefaultTheme;
    $percentage: number;
  }) =>
    $percentage > 50 ? theme.colors.borderProfit : theme.colors.borderLoss};
  border-width: 2px;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const PnLIndicator = styled.View<{ $isProfit: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: ${({
    theme,
    $isProfit,
  }: {
    theme: DefaultTheme;
    $isProfit: boolean;
  }) => ($isProfit ? theme.colors.profitBg : theme.colors.lossBg)};
  border-color: ${({
    theme,
    $isProfit,
  }: {
    theme: DefaultTheme;
    $isProfit: boolean;
  }) => ($isProfit ? theme.colors.borderProfit : theme.colors.borderLoss)};
  border-width: 1px;
  align-items: center;
  justify-content: center;
`;

const MiniChart = styled.View`
  flex-direction: row;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
`;

const ChartBar = styled.View<{ $isPositive: boolean }>`
  width: 3px;
  height: ${({ $isPositive }: { $isPositive: boolean }) =>
    $isPositive ? "12px" : "6px"};
  background-color: ${({
    theme,
    $isPositive,
  }: {
    theme: DefaultTheme;
    $isPositive: boolean;
  }) => ($isPositive ? theme.colors.profit : theme.colors.loss)};
  border-radius: 1.5px;
`;
