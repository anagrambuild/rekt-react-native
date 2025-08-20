import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { useHomeContext } from "@/contexts/HomeContext";

import Slider from "@react-native-community/slider";

import { LinearGradient } from "expo-linear-gradient";
import styled, { useTheme } from "styled-components/native";

// could not get the image to work on dev build
// const sliderHandle = require('../assets/images/app-pngs/slider-handle.png');

export const HorizontalSlider = ({
  loginScreen,
  setLeverage: setLoginLeverageProp,
  leverage: propLeverage,
}: {
  loginScreen?: boolean;
  setLeverage?: (leverage: number) => void;
  leverage?: number;
}) => {
  const {
    selectedToken,
    solTrade,
    setSolTrade,
    ethTrade,
    setEthTrade,
    btcTrade,
    setBtcTrade,
  } = useHomeContext();

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

  const currentTrade = getCurrentTrade();
  const isMaxLeverageOn = currentTrade?.isMaxLeverageOn || false;

  // Map slider value (0-steps) to leverage (1-max)
  const getLeverageFromSlider = (sliderValue: number) =>
    sliderValue === 0 ? 1 : sliderValue;
  const getSliderFromLeverage = (leverage: number) =>
    leverage === 1 ? 0 : leverage;

  const leverage = loginScreen
    ? (propLeverage ?? 1)
    : selectedToken === "sol"
      ? (solTrade?.leverage ?? 1)
      : selectedToken === "eth"
        ? (ethTrade?.leverage ?? 1)
        : (btcTrade?.leverage ?? 1);

  const setLoginLeverage = (sliderValue: number) => {
    const newLeverage = getLeverageFromSlider(sliderValue);
    if (setLoginLeverageProp) {
      setLoginLeverageProp(newLeverage);
    }
  };

  const setLeverage = (sliderValue: number) => {
    const newLeverage = getLeverageFromSlider(sliderValue);
    if (selectedToken === "sol") {
      setSolTrade(
        solTrade
          ? { ...solTrade, leverage: newLeverage }
          : {
              side: "short",
              entryPrice: 0,
              amount: 10,
              leverage: newLeverage,
              status: "draft",
              isMaxLeverageOn: false,
            }
      );
    } else if (selectedToken === "eth") {
      setEthTrade(
        ethTrade
          ? { ...ethTrade, leverage: newLeverage }
          : {
              side: "short",
              entryPrice: 0,
              amount: 10,
              leverage: newLeverage,
              status: "draft",
              isMaxLeverageOn: false,
            }
      );
    } else {
      setBtcTrade(
        btcTrade
          ? { ...btcTrade, leverage: newLeverage }
          : {
              side: "short",
              entryPrice: 0,
              amount: 10,
              leverage: newLeverage,
              status: "draft",
              isMaxLeverageOn: false,
            }
      );
    }
  };

  const [trackWidth, setTrackWidth] = useState(0);
  const max = isMaxLeverageOn ? 200 : 100;
  const theme = useTheme();
  const steps = isMaxLeverageOn ? 20 : 10;
  const min = 0; // slider min is 0, but represents leverage 1
  const thumbWidth = 30; // or your actual thumb size
  const stepSize = (max - 0) / steps;
  // Map leverage to slider value for position
  const sliderValue = getSliderFromLeverage(leverage);
  const n = Math.round((sliderValue - min) / stepSize);
  const safeTrackWidth = trackWidth > 0 ? trackWidth : 1;
  const adjustedWidth =
    (safeTrackWidth - thumbWidth) * (n / steps) + thumbWidth / 2;
  const offset = 12;
  const fillWidth = adjustedWidth + offset;

  useEffect(() => {
    // If leverage is below 1, force to 1
    if (leverage < 1) {
      setLeverage(0);
    }
    if (leverage > 100 && !isMaxLeverageOn) {
      setLeverage(100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leverage, isMaxLeverageOn]);

  // Value reset hack: after layout, set to min, then back to real value
  // this is to get the handle to show in the right place after switching between tokens once leverage is beyond 100
  // this works for ios but jacks up android
  useEffect(() => {
    if (Platform.OS === "ios") {
      if (trackWidth > 0) {
        setLeverage(min);
        setTimeout(() => {
          setLeverage(leverage);
        }, 30);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackWidth]);

  return (
    <OuterContainer key={selectedToken + "-" + isMaxLeverageOn}>
      {/* Track Background */}
      <TrackBackground
        backgroundColor={theme.colors.card}
        onLayout={(e: any) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {/* Gradient Fill to the left of the thumb */}
        <TrackFill
          colors={[
            theme.colors.segmentedControl,
            isMaxLeverageOn ? theme.colors.brandDark : theme.colors.brand,
          ]}
          start={[0, 0.5]}
          end={[1, 0.5]}
          width={fillWidth}
        />
        {/* Tick marks */}
        <TicksRow pointerEvents="none">
          {Array.from({ length: steps + 1 }).map((_, i) => (
            <Tick
              key={i}
              height={
                i === 0 || i === steps || i === Math.floor(steps / 2) ? 20 : 12
              }
              backgroundColor={theme.colors.textPrimary}
            />
          ))}
        </TicksRow>
        {/* Slider */}
        <StyledSlider
          key={selectedToken + "-" + isMaxLeverageOn}
          minimumValue={min}
          maximumValue={max}
          step={10}
          value={sliderValue}
          onValueChange={loginScreen ? setLoginLeverage : setLeverage}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          // thumbImage={sliderHandle}
          thumbTintColor={theme.colors.text}
        />
      </TrackBackground>
    </OuterContainer>
  );
};

const iosTrackOffset = Platform.OS === "ios" ? -2 : -6;

const OuterContainer = styled.View`
  width: 100%;
  align-items: center;
`;

const TrackBackground = styled.View<any>`
  width: 100%;
  height: 32px;
  border-radius: 16px;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background-color: ${(props: any) => props.backgroundColor};
`;

const TrackFill = styled(LinearGradient)<any>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 22px;
  opacity: 0.7;
  z-index: 1;
  width: ${(props: any) => props.width}px;
`;

const TicksRow = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  padding: 0px 16px;
`;

const Tick = styled.View<any>`
  width: 2px;
  border-radius: 1px;
  height: ${(props: any) => props.height}px;
  background-color: ${(props: any) => props.backgroundColor};
`;

const StyledSlider = styled(Slider)`
  width: 100%;
  height: 44px;
  position: absolute;
  top: ${iosTrackOffset}px;
  left: 0;
  z-index: 3;
`;
