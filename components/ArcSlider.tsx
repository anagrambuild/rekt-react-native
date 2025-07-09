import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

import Svg, { Circle, Path } from 'react-native-svg';

const ARC_RADIUS = 120;
const STROKE_WIDTH = 18;
const VALUE_MIN = 1;
const VALUE_MAX = 100;
const VALUE_STEP = 10;
const ARC_CENTER = ARC_RADIUS + STROKE_WIDTH;
const ARC_FLATTEN = 0.5;

type ArcSliderProps = {
  value?: number;
  onValueChange?: (value: number) => void;
};

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians) * ARC_FLATTEN,
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';
  const d = [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    arcSweep,
    0,
    end.x,
    end.y,
  ].join(' ');
  return d;
}

export const ArcSlider = ({
  value: propValue = 1,
  onValueChange,
}: ArcSliderProps) => {
  const [value, setValue] = useState<number>(propValue);

  // Map value to angle (start at 180deg, end at 0deg for a horizontal arc)
  const startAngle = -90;
  const endAngle = 90;
  const angleForValue = (val: number) => {
    const percent = (val - VALUE_MIN) / (VALUE_MAX - VALUE_MIN);
    return startAngle + (endAngle - startAngle) * percent;
  };

  // Map angle to value
  const valueForAngle = (angle: number) => {
    const percent = (angle - startAngle) / (endAngle - startAngle);
    let val = VALUE_MIN + percent * (VALUE_MAX - VALUE_MIN);
    // Snap to nearest step
    val = Math.round(val / VALUE_STEP) * VALUE_STEP;
    return Math.max(VALUE_MIN, Math.min(VALUE_MAX, val));
  };

  // PanResponder for dragging thumb
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        const dx = locationX - ARC_CENTER;
        const dy = locationY - ARC_CENTER;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        angle = angle < 0 ? 360 + angle : angle;
        // Clamp angle to arc
        let clamped = Math.max(endAngle, Math.min(startAngle, angle));
        // Invert if needed
        if (clamped < endAngle) clamped = endAngle;
        if (clamped > startAngle) clamped = startAngle;
        const newValue = valueForAngle(clamped);
        setValue(newValue);
        if (onValueChange) onValueChange(newValue);
      },
    })
  ).current;

  // Thumb position
  const thumbAngle = angleForValue(value);
  const thumbPos = polarToCartesian(
    ARC_CENTER,
    ARC_CENTER,
    ARC_RADIUS,
    thumbAngle
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Svg width={ARC_CENTER * 2} height={ARC_CENTER * 2}>
        {/* Arc background */}
        <Path
          d={describeArc(
            ARC_CENTER,
            ARC_CENTER,
            ARC_RADIUS,
            startAngle,
            endAngle
          )}
          stroke='#222'
          strokeWidth={STROKE_WIDTH}
          fill='none'
        />
        {/* Arc fill */}
        <Path
          d={describeArc(
            ARC_CENTER,
            ARC_CENTER,
            ARC_RADIUS,
            startAngle,
            thumbAngle
          )}
          stroke='#FF6A3D'
          strokeWidth={STROKE_WIDTH}
          fill='none'
        />
        {/* Thumb */}
        <Circle
          cx={thumbPos.x}
          cy={thumbPos.y}
          r={22}
          fill='#fff'
          stroke='#FF6A3D'
          strokeWidth={4}
        />
      </Svg>
      <View style={styles.valueContainer} pointerEvents='none'>
        <Text style={styles.valueText}>{value}x</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: ARC_CENTER * 2,
    height: ARC_CENTER * 2,
    position: 'relative',
  },
  valueContainer: {
    position: 'absolute',
    top: ARC_CENTER - 40,
    left: ARC_CENTER - 30,
    width: 60,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
});
