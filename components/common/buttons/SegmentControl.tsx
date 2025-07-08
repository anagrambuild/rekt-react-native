import { BodyMSecondary } from '../texts';
import { PressableOpacity } from './PressableOpacity';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

interface SegmentControlProps {
  Svg: React.ComponentType<any>;
  svgProps?: Record<string, any>;
  label: string;
  selected: boolean;
  onPress?: () => void;
}

export const SegmentContainer = styled.View<{ theme: DefaultTheme }>`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.segmentedControl};
  border-radius: 100px;
  padding: 4px;
`;

const SegmentButton = styled(PressableOpacity)<{
  selected: boolean;
  theme: DefaultTheme;
}>`
  flex-direction: row;
  align-items: center;
  border-radius: 100px;
  padding: 6px 16px;
  gap: 8px;
  background-color: ${({
    selected,
    theme,
  }: {
    selected: boolean;
    theme: DefaultTheme;
  }) => (selected ? theme.colors.activeSegment : 'transparent')};
`;

const SegmentLabel = styled(BodyMSecondary)<{
  $selected: boolean;
  theme: DefaultTheme;
}>`
  color: ${({
    $selected,
    theme,
  }: {
    $selected: boolean;
    theme: DefaultTheme;
  }) =>
    $selected ? theme.colors.onActiveSegment : theme.colors.textSecondary};
`;

export const SegmentControl: React.FC<SegmentControlProps> = ({
  Svg,
  svgProps = {},
  label,
  selected,
  onPress,
}) => {
  const theme = useTheme();
  const svgColor = selected
    ? theme.colors.onActiveSegment
    : theme.colors.textSecondary;

  // Use theme colors for boxShadow
  const boxShadow = selected
    ? [
        {
          offsetX: 0,
          offsetY: 0,
          blurRadius: 0,
          spreadDistance: 1,
          color: theme.colors.border,
          inset: false,
        },
        {
          offsetX: 0,
          offsetY: 1,
          blurRadius: 0,
          color: theme.colors.borderLight,
          inset: true,
        },
      ]
    : undefined;

  return (
    <SegmentButton
      selected={selected}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        { opacity: pressed ? 0.7 : 1 },
        selected && boxShadow ? { boxShadow } : null,
      ]}
    >
      <Svg color={svgColor} size={20} {...svgProps} />
      <SegmentLabel $selected={selected}>{label}</SegmentLabel>
    </SegmentButton>
  );
};
