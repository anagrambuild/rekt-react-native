import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import iphoneFrame from "@/assets/images/app-pngs/iphone-frame.png";
import topNav from "@/assets/images/app-pngs/top-nav.png";
import { Column } from "@/components";

import { AmountCard } from "../TradeScreen/AmountCard";
import { Step2SliderCard } from "./Step2SliderCard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

export const Step2 = ({
  disableAutoTimer,
}: {
  disableAutoTimer: () => void;
}) => {
  const [leverage, setLeverage] = useState(100);
  const [amount, setAmount] = useState(10);
  const isInitialRender = useRef(true);
  const isUserInteraction = useRef(false);

  // Haptic feedback on leverage increase
  const prevLeverageRef = useRef(leverage);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      prevLeverageRef.current = leverage;
      return;
    }

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

  // Mark that user has interacted after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      isUserInteraction.current = true;
    }, 100); // Small delay to ensure initial render is complete

    return () => clearTimeout(timer);
  }, []);

  return (
    <Column
      $padding={0}
      $alignItems="center"
      style={{
        justifyContent: "flex-start",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* iPhone Frame as background wrapper */}
      <Image
        source={iphoneFrame}
        contentFit="contain"
        style={{
          width: "100%",
          height: 640,
          alignSelf: "stretch",
        }}
      />

      {/* Content positioned inside the frame */}
      <View
        style={{
          marginTop: -620,
          left: 0,
          right: 0,
          zIndex: 1000,
          alignItems: "center",
          width: "100%",
        }}
      >
        <Image
          source={topNav}
          contentFit="contain"
          style={{
            width: "95%",
            height: 60,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            paddingStart: 32,
            paddingEnd: 32,
            overflow: "hidden",
            width: "100%",
            marginTop: 64,
            gap: 16,
          }}
        >
          <AmountCard
            amount={amount}
            setAmount={amount => {
              setAmount(amount);
              if (isUserInteraction.current) {
                disableAutoTimer();
              }
            }}
          />
          <Step2SliderCard
            leverage={leverage}
            amount={amount}
            setLeverage={leverage => {
              setLeverage(leverage);
              if (isUserInteraction.current) {
                disableAutoTimer();
              }
            }}
            disableAutoTimer={disableAutoTimer}
          />
        </View>
      </View>
    </Column>
  );
};
