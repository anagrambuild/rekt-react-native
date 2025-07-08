import styled, { DefaultTheme } from 'styled-components/native';

const SwitchContainer = styled.Pressable`
  flex-direction: ${({ $isOn }: { $isOn: boolean }) =>
    $isOn ? 'row-reverse' : 'row'};
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 1px 4px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.segmentedControl};
  border-radius: 16px;
`;

const HandleOuter = styled.View`
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: ${({
    $isOn,
    theme,
  }: {
    $isOn: boolean;
    theme: DefaultTheme;
  }) => ($isOn ? theme.colors.brand : theme.colors.activeSegment)};
  border-radius: 12px;
`;

const HandleInner = styled.View`
  width: 10px;
  height: 10px;
  background-color: ${({
    $isOn,
    theme,
  }: {
    $isOn: boolean;
    theme: DefaultTheme;
  }) => ($isOn ? theme.colors.activeSegment : theme.colors.onActiveSegment)};
  border-radius: 5px;
`;

const Filler = styled.View`
  width: 24px;
`;

export const Switch = ({
  onPress,
  isOn = false,
  icon,
}: {
  onPress: () => void;
  isOn: boolean;
  icon?: React.ReactNode;
}) => {
  return (
    <SwitchContainer onPress={onPress} $isOn={isOn}>
      <HandleOuter $isOn={isOn}>
        <HandleInner />
      </HandleOuter>
      {icon ? icon : <Filler />}
    </SwitchContainer>
  );
};
