import React from "react";
import { ScrollView, TouchableOpacity } from "react-native";

import { BodyXS } from "@/components/common";
import { Theme } from "@/types/styled";

import styled from "styled-components/native";

interface TimeframeSelectorProps {
  timeframes: { label: string; value: string }[];
  selectedTimeframe: string;
  onTimeframeChange: (value: string) => void;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframes,
  selectedTimeframe,
  onTimeframeChange,
}) => {

  return (
    <Container>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: 4,
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        {timeframes.map((timeframe) => (
          <TimeframeButton
            key={timeframe.value}
            selected={selectedTimeframe === timeframe.value}
            onPress={() => onTimeframeChange(timeframe.value)}
            activeOpacity={0.7}
          >
            <TimeframeText selected={selectedTimeframe === timeframe.value}>
              {timeframe.label}
            </TimeframeText>
          </TimeframeButton>
        ))}
      </ScrollView>
    </Container>
  );
};

const Container = styled.View`
  height: 32px;
  margin-top: 4px;
`;

const TimeframeButton = styled(TouchableOpacity)<{ selected: boolean }>`
  height: 28px;
  padding: 0 12px;
  border-radius: 14px;
  background-color: ${({
    theme,
    selected,
  }: {
    theme: Theme;
    selected: boolean;
  }) => (selected ? "#FFFFFF" : theme.colors.card)};
  border: 1px solid
    ${({ theme, selected }: { theme: Theme; selected: boolean }) =>
      selected ? "#FFFFFF" : theme.colors.border};
  justify-content: center;
  align-items: center;
`;

const TimeframeText = styled(BodyXS)<{ selected: boolean }>`
  color: ${({ theme, selected }: { theme: Theme; selected: boolean }) =>
    selected ? "#000000" : theme.colors.text};
  font-weight: ${({ selected }: { selected: boolean }) =>
    selected ? "600" : "400"};
`;
