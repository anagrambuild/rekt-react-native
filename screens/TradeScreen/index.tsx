import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { highFireUrl, lowFireUrl, midFireUrl } from "@/assets/videos";
import {
  Column,
  PressableOpacity,
  PrimaryButton,
  Row,
  SegmentContainer,
  SegmentControl,
} from "@/components";
import { Trade, useHomeContext } from "@/contexts/HomeContext";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { AnimatedBannerRow } from "../HomeScreen/AnimatedBannerRow";
import { perpSocials } from "../HomeScreen/mockData";
import { PriceChartCard } from "../HomeScreen/PriceChartCard";
import { AmountCard } from "./AmountCard";
import { AmountModal } from "./AmountModal";
import { SliderCard } from "./SliderCard";
import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

export const TradeScreen = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    selectedToken,
    openPosition,
    isTrading,
    solTrade,
    setSolTrade,
    ethTrade,
    setEthTrade,
    btcTrade,
    setBtcTrade,
  } = useHomeContext();

  const [amountPopupVisible, setAmountModalVisible] = useState(false);

  // Get current trade state based on selected token
  const getCurrentTrade = () => {
    switch (selectedToken) {
      case "sol":
        return solTrade;
      case "eth":
        return ethTrade;
      case "btc":
        return btcTrade;
      default:
        return solTrade;
    }
  };

  const setCurrentTrade = (trade: Trade | null) => {
    switch (selectedToken) {
      case "sol":
        setSolTrade(trade);
        break;
      case "eth":
        setEthTrade(trade);
        break;
      case "btc":
        setBtcTrade(trade);
        break;
      default:
        setSolTrade(trade);
        break;
    }
  };

  const currentTrade = getCurrentTrade();

  // Use trade state or defaults
  const tradeSide = currentTrade?.side || "SHORT";
  const amount = currentTrade?.amount || 10;
  const leverage = currentTrade?.leverage || 1;

  // Update trade state functions
  const setTradeSide = (side: "LONG" | "SHORT") => {
    setCurrentTrade({
      ...currentTrade,
      side,
      amount: currentTrade?.amount || 10,
      leverage: currentTrade?.leverage || 1,
      status: "draft",
      entryPrice: 0,
      isMaxLeverageOn: currentTrade?.isMaxLeverageOn || false,
    });
  };

  const setAmount = (newAmount: number) => {
    setCurrentTrade({
      ...currentTrade,
      side: currentTrade?.side || "SHORT",
      amount: Math.max(10, newAmount),
      leverage: currentTrade?.leverage || 1,
      status: "draft",
      entryPrice: 0,
      isMaxLeverageOn: currentTrade?.isMaxLeverageOn || false,
    });
  };
  // Convert token symbol to backend format
  const getMarketSymbol = (): "SOL" | "BTC" | "ETH" => {
    switch (selectedToken) {
      case "sol":
        return "SOL";
      case "eth":
        return "ETH";
      case "btc":
        return "BTC";
      default:
        return "SOL";
    }
  };

  const handleTrade = async () => {
    const success = await openPosition(
      getMarketSymbol(),
      tradeSide,
      amount,
      leverage
    );

    if (success) {
      // Navigate back to home screen after successful trade
      router.replace("/");
    }
  };

  // Select video based on leverage
  let videoLevel: "low" | "mid" | "high" = "low";
  if (leverage > 100) {
    videoLevel = "high";
  } else if (leverage > 50) {
    videoLevel = "mid";
  }

  // Haptic feedback on leverage increase
  const prevLeverageRef = useRef(leverage);
  useEffect(() => {
    if (leverage > prevLeverageRef.current) {
      if (leverage > 100) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (leverage > 50) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    prevLeverageRef.current = leverage;
  }, [leverage]);

  // Always call all three hooks
  const lowPlayer = useVideoPlayer(lowFireUrl, player => {
    player.loop = true;
    player.play();
  });
  const midPlayer = useVideoPlayer(midFireUrl, player => {
    player.loop = true;
    player.play();
  });
  const highPlayer = useVideoPlayer(highFireUrl, player => {
    player.loop = true;
    player.play();
  });

  let player;
  if (videoLevel === "low") {
    player = lowPlayer;
  } else if (videoLevel === "mid") {
    player = midPlayer;
  } else {
    player = highPlayer;
  }

  return (
    <>
      {/* Render the background video absolutely at the bottom half of the screen */}
      <VideoView
        player={player}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "50%",
        }}
        pointerEvents="none"
        nativeControls={false}
      />
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Fixed top section */}
        <View
          style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 4 }}
        >
          <Row style={{ marginBottom: 4 }}>
            <PressableOpacity onPress={() => router.back()}>
              <MaterialIcon
                name="keyboard-arrow-left"
                size={32}
                color={theme.colors.textSecondary}
              />
            </PressableOpacity>
            <SegmentContainer>
              <SegmentControl
                Svg={MaterialCommunityIcons}
                svgProps={{
                  name: "arrow-bottom-right-thin-circle-outline",
                }}
                label={t("Short")}
                selected={tradeSide === "SHORT"}
                onPress={() => setTradeSide("SHORT")}
              />
              <SegmentControl
                Svg={MaterialCommunityIcons}
                svgProps={{ name: "arrow-top-right-thin-circle-outline" }}
                label={t("Long")}
                selected={tradeSide === "LONG"}
                onPress={() => setTradeSide("LONG")}
              />
            </SegmentContainer>
            <View style={{ width: 32 }} />
          </Row>

          <AnimatedBannerRow items={perpSocials} />
        </View>

        {/* Dynamic middle section for PriceChartCard */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <PriceChartCard showLiquidation={true} />
        </View>

        {/* Fixed bottom controls - NOT absolute positioned */}
        <View style={{ backgroundColor: "transparent" }}>
          <Column $padding={16} $gap={4} style={{ paddingTop: 8 }}>
            <AmountCard
              setAmountModalVisible={setAmountModalVisible}
              amount={amount}
              setAmount={setAmount}
            />
            <SliderCard leverage={leverage} amount={amount} />
            <PrimaryButton
              onPress={handleTrade}
              loading={isTrading}
              style={{ marginTop: 8 }}
            >
              {t("{{side}} {{token}}", {
                side: tradeSide === "LONG" ? "Long" : "Short",
                token: selectedToken.toUpperCase(),
              })}
            </PrimaryButton>
          </Column>
        </View>

        {amountPopupVisible && (
          <AmountModal
            visible={amountPopupVisible}
            onClose={() => setAmountModalVisible(false)}
          />
        )}
      </View>
    </>
  );
};
