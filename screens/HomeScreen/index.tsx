import { View } from "react-native";

import { useHomeContext } from "@/contexts";

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
  } = useHomeContext();

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
  const setTradeSide = (side: "long" | "short") => {
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

  // Check for active trades - either from local state or actual open positions
  const currentPosition = openPositions.find(position => {
    const tokenMap = { sol: "SOL-PERP", eth: "ETH-PERP", btc: "BTC-PERP" };
    return position.asset === tokenMap[selectedToken as keyof typeof tokenMap];
  });

  const isActiveTrade = (trade && trade.status === "open") || !!currentPosition;

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
                  side: currentPosition?.direction || "long",
                  entryPrice: currentPosition?.entryPrice || 0,
                  amount: currentPosition?.marginUsed || 0,
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
                onPress={() => {
                  setTradeSide("short");
                  router.push("/trade");
                }}
                title={t("Short")}
                subtitle={t("Price will go down")}
              />
              <LongButton
                onPress={() => {
                  setTradeSide("long");
                  router.push("/trade");
                }}
                title={t("Long")}
                subtitle={t("Price will go up")}
              />
            </Row>
          )}
        </Column>
      </View>
    </View>
  );
};
