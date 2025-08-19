import { Body1Secondary } from '../texts';
import { PressableOpacity } from './PressableOpacity';
import styled from 'styled-components/native';

export const PresetButton = ({
  value,
  onPress,
}: {
  value: number | string;
  onPress: () => void;
}) => {
  return (
    <Button onPress={onPress}>
      <Body1Secondary>{value}</Body1Secondary>
    </Button>
  );
};

const Button = styled(PressableOpacity)`
  background-color: ${({ theme }: any) => theme.colors.cardEmphasized};
  padding: 12px 24px;
  border-radius: 100px;
`;
