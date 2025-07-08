import { useState } from 'react';
import { Platform } from 'react-native';

import { useHomeContext } from '@/contexts/HomeContext';

import Slider from '@react-native-community/slider';

import { LinearGradient } from 'expo-linear-gradient';
import styled, { useTheme } from 'styled-components/native';

// could not get the image to work on dev build
// const sliderHandle = require('../assets/images/app-pngs/slider-handle.png');

export const HorizontalSlider = () => {
  const { leverage, setLeverage } = useHomeContext();
  const [trackWidth, setTrackWidth] = useState(0);
  const theme = useTheme();
  const steps = 10;
  const min = 0;
  const max = 100;
  const thumbWidth = 30; // or your actual thumb size
  const stepSize = (max - min) / steps;
  const n = Math.round((leverage - min) / stepSize);
  const adjustedWidth =
    (trackWidth - thumbWidth) * (n / steps) + thumbWidth / 2;
  const offset = 20;
  const fillWidth = adjustedWidth + offset;

  return (
    <OuterContainer>
      {/* Track Background */}
      <TrackBackground
        backgroundColor={theme.colors.card}
        onLayout={(e: any) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {/* Gradient Fill to the left of the thumb */}
        <TrackFill
          colors={[theme.colors.segmentedControl, theme.colors.brand]}
          start={[0, 0.5]}
          end={[1, 0.5]}
          width={fillWidth}
        />
        {/* Tick marks */}
        <TicksRow pointerEvents='none'>
          {Array.from({ length: steps + 1 }).map((_, i) => (
            <Tick
              key={i}
              height={i === 0 || i === steps ? 24 : 16}
              backgroundColor={theme.colors.text}
            />
          ))}
        </TicksRow>
        {/* Slider */}
        <StyledSlider
          minimumValue={min}
          maximumValue={max}
          step={10}
          value={leverage}
          onValueChange={setLeverage}
          minimumTrackTintColor='transparent'
          maximumTrackTintColor='transparent'
          // thumbImage={sliderHandle}
          thumbTintColor={theme.colors.text}
        />
      </TrackBackground>
    </OuterContainer>
  );
};

const iosTrackOffset = Platform.OS === 'ios' ? 2 : 0;

const OuterContainer = styled.View`
  width: 100%;
  align-items: center;
`;

const TrackBackground = styled.View<any>`
  width: 100%;
  height: 44px;
  border-radius: 22px;
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
