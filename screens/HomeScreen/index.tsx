import { Alert, View } from "react-native";

import { useHomeContext, useProfileContext } from "@/contexts";
import { useWallet } from "@/contexts/WalletContext";

import { usePreventRemove } from "@react-navigation/native";

import { Column, LogoBanner, Row, Title4 } from "../../components";
import { AnimatedBannerRow } from "./AnimatedBannerRow";
import { LiveTradeView } from "./LiveTradeView";
import { LongButton, ShortButton } from "./long-short-buttons";
import { perpSocials } from "./mockData";
import { PriceChartCard } from "./PriceChartCard";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export const HomeScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    selectedToken,
    solTrade,
    setSolTrade,
    ethTrade,
    setEthTrade,
    btcTrade,
    setBtcTrade,
    openPositions,
    tradingStates,
  } = useHomeContext();
  const { usdcBalance } = useWallet();
  const { setIsOnOffRampModalVisible } = useProfileContext();
  console.log("openPositions", openPositions);
  usePreventRemove(true, () => {});

  // Get current trade and setter for selected token
  const trade =
    selectedToken === "sol"
      ? solTrade
      : selectedToken === "eth"
      ? ethTrade
      : btcTrade;

  const setTrade =
    selectedToken === "sol"
      ? setSolTrade
      : selectedToken === "eth"
      ? setEthTrade
      : setBtcTrade;

  // Set trade side, creating a draft trade if none exists
  const setTradeSide = (side: "LONG" | "SHORT") => {
    if (trade) {
      setTrade({ ...trade, side });
    } else {
      // Create a new draft trade with the selected side
      setTrade({
        side,
        entryPrice: 0,
        amount: 10,
        leverage: 1,
        status: "draft",
        isMaxLeverageOn: false,
      });
    }
  };

  const handleNavigateToTrade = (side: "LONG" | "SHORT") => {
    const balance = usdcBalance ?? 0;
    if (balance === 0) {
      Alert.alert(
        t("Insufficient USDC"),
        t(
          "You don't have enough USDC to place this trade. Do you want to make a deposit?"
        ),
        [
          { text: t("No"), style: "cancel" },
          {
            text: t("Yes"),
            onPress: () => {
              setIsOnOffRampModalVisible(true);
              router.push("/profile");
            },
          },
        ]
      );
      return;
    }
    setTradeSide(side);
    router.push("/trade");
  };

  // Check for active trades - BACKEND-ONLY approach (no mock data)
  const currentPosition = openPositions.find(position => {
    const tokenMap = { sol: "SOL", eth: "ETH", btc: "BTC" };
    return position.market === tokenMap[selectedToken as keyof typeof tokenMap];
  });
  // Only show LiveTradeView when we have real backend position data
  // Show Long/Short buttons (with loading state) until backend data is available
  const isActiveTrade = !!currentPosition;

  // Add comprehensive logging for UI state debugging

  return (
    <View style={{ flex: 1 }}>
      {/* Fixed top section */}
      <View style={{ paddingTop: 50, paddingHorizontal: 12 }}>
        <LogoBanner />
        <AnimatedBannerRow items={perpSocials} />
      </View>

      {/* Dynamic middle section for PriceChartCard */}
      <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}>
        <PriceChartCard showLiquidation={!!isActiveTrade} />
      </View>

      {/* Fixed bottom section - Ride the market */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 20 }}>
        <Column $gap={8}>
          {!isActiveTrade && (
            <Row style={{ paddingStart: 16, paddingTop: 24 }}>
              <Title4>{t("Ride the market")}</Title4>
            </Row>
          )}
          {isActiveTrade ? (
            <LiveTradeView
              trade={
                trade || {
                  side: currentPosition?.direction || "LONG",
                  entryPrice: currentPosition?.entryPrice || 0,
                  //  1 usdc comes back as .01 so we need to multiply by 100
                  amount: currentPosition?.size * 100 || 0,
                  leverage: currentPosition?.leverage || 1,
                  status: "open",
                  pnl: currentPosition?.pnl || 0,
                  timestamp: currentPosition?.openedAt
                    ? new Date(currentPosition.openedAt).getTime()
                    : Date.now(),
                }
              }
            />
          ) : (
            <Row>
              <ShortButton
                onPress={() => handleNavigateToTrade("SHORT")}
                title={t("Short")}
                subtitle={
                  tradingStates[
                    selectedToken.toUpperCase() as keyof typeof tradingStates
                  ]
                    ? t("Processing...")
                    : t("Price will go down")
                }
              />
              <LongButton
                onPress={() => handleNavigateToTrade("LONG")}
                title={t("Long")}
                subtitle={
                  tradingStates[
                    selectedToken.toUpperCase() as keyof typeof tradingStates
                  ]
                    ? t("Processing...")
                    : t("Price will go up")
                }
              />
            </Row>
          )}
        </Column>
      </View>
    </View>
  );
};
