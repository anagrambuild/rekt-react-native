import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useHomeContext } from '@/contexts/HomeContext';

import Slider from '@react-native-community/slider';

import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'styled-components/native';

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
    <View style={styles.outerContainer}>
      {/* Track Background */}
      <View
        style={[styles.trackBackground, { backgroundColor: theme.colors.card }]}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {/* Gradient Fill to the left of the thumb */}
        <LinearGradient
          colors={[theme.colors.segmentedControl, theme.colors.brand]}
          start={[0, 0.5]}
          end={[1, 0.5]}
          style={[styles.trackFill, { width: fillWidth }]}
        />
        {/* Tick marks */}
        <View style={styles.ticksRow} pointerEvents='none'>
          {Array.from({ length: steps + 1 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.tick,
                i === 0 || i === steps ? styles.tickLarge : styles.tickSmall,
                { backgroundColor: theme.colors.text },
              ]}
            />
          ))}
        </View>
        {/* Slider */}
        <Slider
          style={styles.slider}
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
      </View>
    </View>
  );
};

const iosTrackOffset = Platform.OS === 'ios' ? 2 : 0;

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  trackBackground: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 22,
    opacity: 0.7,
    zIndex: 1,
  },
  slider: {
    width: '100%',
    height: 44,
    position: 'absolute',
    top: iosTrackOffset,
    left: 0,
    zIndex: 3,
  },
  ticksRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 16,
  },
  tick: {
    width: 2,
    borderRadius: 1,
  },
  tickLarge: {
    height: 24,
  },
  tickSmall: {
    height: 16,
  },
});
