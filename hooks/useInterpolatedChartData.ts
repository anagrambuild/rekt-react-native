import { useEffect, useRef, useState } from "react";

import { ChartDataPoint } from "@/utils";

interface InterpolationState {
  startValue: number;
  targetValue: number;
  startTime: number;
}

// TODO: This can be improved but works. Graph looks continuous and resets when needed.
export const useInterpolatedChartData = (
  sourceData: ChartDataPoint[],
  enabled: boolean = true,
  token?: string
) => {
  const [interpolatedData, setInterpolatedData] = useState<ChartDataPoint[]>(() =>
    enabled ? [] : sourceData
  );
  const [targetBounds, setTargetBounds] = useState<{ min: number; max: number } | null>(null);
  const animationFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const interpolationStateRef = useRef<InterpolationState | null>(null);
  const lastProcessedTimestampRef = useRef<number | undefined>(undefined);
  const currentValueRef = useRef<number | null>(null);
  const sourceDataRef = useRef<ChartDataPoint[]>([]);
  const skipAnimationRef = useRef<boolean>(false);
  const lastTokenRef = useRef<string | undefined>(token);
  const lastEnabledRef = useRef<boolean>(enabled);

  // Continuous animation loop that runs independently
  useEffect(() => {
    if (!enabled) {
      // Clean up when disabled
      interpolationStateRef.current = null;
      return;
    }

    let isRunning = true;

    const animate = () => {
      if (!isRunning || !enabled) return;

      const now = Date.now();

      // Skip animation if we're in a token switch
      if (skipAnimationRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Always update if we have an interpolation state
      if (interpolationStateRef.current && sourceDataRef.current.length > 0) {
        const state = interpolationStateRef.current;
        const elapsed = now - state.startTime;
        const duration = 1000; // 1 second to reach target
        const progress = elapsed / duration;

        // Use clamped progress for value interpolation (stop at target value)
        const clampedProgress = Math.min(progress, 1);

        // Simple easing function for smooth movement
        const easedProgress = clampedProgress < 0.5
          ? 2 * clampedProgress * clampedProgress
          : 1 - Math.pow(-2 * clampedProgress + 2, 2) / 2;

        // Calculate current interpolated value
        const currentValue = state.startValue + (state.targetValue - state.startValue) * easedProgress;
        currentValueRef.current = currentValue;

        const shiftedData = sourceDataRef.current.map((point, index) => {
          const isLastPoint = index === sourceDataRef.current.length - 1;

          if (isLastPoint) {
            return {
              value: currentValue,
              timestamp: now,
            };
          }

          return point;
        });

        setInterpolatedData(shiftedData);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled]);

  // Handle new data updates
  useEffect(() => {
    // Check if enabled state changed (switching between 1s and other timeframes)
    if (enabled !== lastEnabledRef.current) {
      lastEnabledRef.current = enabled;
      skipAnimationRef.current = true;
      interpolationStateRef.current = null;
      currentValueRef.current = null;
      lastProcessedTimestampRef.current = undefined;
      sourceDataRef.current = sourceData;
      setInterpolatedData(sourceData);

      if (!enabled) {
        setTargetBounds(null);
      } else if (sourceData.length > 0) {
        const minValue = Math.min(...sourceData.map(p => p.value));
        const maxValue = Math.max(...sourceData.map(p => p.value));
        const buffer = (maxValue - minValue) * 0.02;
        setTargetBounds({ min: minValue - buffer, max: maxValue + buffer });
      }

      setTimeout(() => {
        skipAnimationRef.current = false;
      }, 100);
      return;
    }

    // Check if token changed
    if (token !== lastTokenRef.current) {
      lastTokenRef.current = token;
      skipAnimationRef.current = true;
      interpolationStateRef.current = null;
      currentValueRef.current = null;
      lastProcessedTimestampRef.current = undefined;
      sourceDataRef.current = sourceData;
      setInterpolatedData(sourceData);

      if (sourceData.length > 0) {
        // Calculate bounds for the new data
        const minValue = Math.min(...sourceData.map(p => p.value));
        const maxValue = Math.max(...sourceData.map(p => p.value));
        const buffer = (maxValue - minValue) * 0.02;
        setTargetBounds({ min: minValue - buffer, max: maxValue + buffer });
      }

      setTimeout(() => {
        skipAnimationRef.current = false;
      }, 200);
      return;
    }

    // Early detection of token switch based on dramatic price change
    if (sourceData.length > 0 && sourceDataRef.current.length > 0) {
      const oldLastValue = sourceDataRef.current[sourceDataRef.current.length - 1]?.value;
      const newLastValue = sourceData[sourceData.length - 1]?.value;

      if (oldLastValue && newLastValue) {
        const priceRatio = Math.max(oldLastValue, newLastValue) / Math.min(oldLastValue, newLastValue);
        // If price changes by more than 5x, it's likely a token switch
        if (priceRatio > 5) {
          skipAnimationRef.current = true;
          interpolationStateRef.current = null;
          currentValueRef.current = null;
          lastProcessedTimestampRef.current = undefined;
          sourceDataRef.current = sourceData;
          setInterpolatedData(sourceData);

          // Calculate bounds for the new data
          const minValue = Math.min(...sourceData.map(p => p.value));
          const maxValue = Math.max(...sourceData.map(p => p.value));
          const buffer = (maxValue - minValue) * 0.02;
          setTargetBounds({ min: minValue - buffer, max: maxValue + buffer });

          setTimeout(() => {
            skipAnimationRef.current = false;
          }, 150);
          return;
        }
      }
    }

    // Update source data ref
    sourceDataRef.current = sourceData;

    if (!enabled || sourceData.length === 0) {
      setInterpolatedData(sourceData);
      setTargetBounds(null);
      interpolationStateRef.current = null;
      lastProcessedTimestampRef.current = undefined;
      currentValueRef.current = null;
      return;
    }

    const lastSourcePoint = sourceData[sourceData.length - 1];

    // Check if we have new data to interpolate
    if (lastProcessedTimestampRef.current !== lastSourcePoint.timestamp) {
      lastProcessedTimestampRef.current = lastSourcePoint.timestamp;

      // Detect if we're switching to completely different data (e.g., token change)
      // If the current value is way off from the new data range, reset
      const dataMin = Math.min(...sourceData.map(p => p.value));
      const dataMax = Math.max(...sourceData.map(p => p.value));
      const dataRange = dataMax - dataMin;
      const isTokenSwitch = currentValueRef.current !== null &&
        (currentValueRef.current < dataMin - dataRange * 2 ||
         currentValueRef.current > dataMax + dataRange * 2);

      // If it's a token switch, just update the data without interpolation
      if (isTokenSwitch) {
        skipAnimationRef.current = true;
        sourceDataRef.current = sourceData; // Update source data ref immediately
        setInterpolatedData(sourceData);
        currentValueRef.current = lastSourcePoint.value;
        interpolationStateRef.current = null;
        // Calculate bounds for the new data
        const minValue = Math.min(...sourceData.map(p => p.value));
        const maxValue = Math.max(...sourceData.map(p => p.value));
        const buffer = (maxValue - minValue) * 0.02;
        setTargetBounds({ min: minValue - buffer, max: maxValue + buffer });

        // Re-enable animation after a short delay
        setTimeout(() => {
          skipAnimationRef.current = false;
        }, 100);
        return;
      }

      // For normal updates (not token switch), set up interpolation
      const startValue = currentValueRef.current ?? lastSourcePoint.value;

      // Update interpolation state with new target
      interpolationStateRef.current = {
        startValue,
        targetValue: lastSourcePoint.value,
        startTime: Date.now(),
      };

      // Calculate target bounds for stable y-domain with a small buffer
      const allValues = sourceData.map(p => p.value);
      allValues.push(startValue, lastSourcePoint.value);
      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      // Add a 2% buffer to prevent edge clipping during animation
      const buffer = (maxValue - minValue) * 0.02;
      setTargetBounds({ min: minValue - buffer, max: maxValue + buffer });

      // Set current value ref
      currentValueRef.current = startValue;
    }
  }, [sourceData, enabled, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Return the appropriate data based on enabled state
  return {
    data: enabled ? interpolatedData : sourceData,
    targetBounds: enabled ? targetBounds : null
  };
};