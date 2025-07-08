import { Body1Secondary } from '@/components';

import styled from 'styled-components/native';

export const PresetButton = ({
  value,
  onPress,
}: {
  value: number;
  onPress: () => void;
}) => {
  return (
    <Button onPress={onPress}>
      <Body1Secondary>{value}</Body1Secondary>
    </Button>
  );
};

const Button = styled.Pressable`
  background-color: ${({ theme }: any) => theme.colors.cardEmphasized};
  padding: 12px 24px;
  border-radius: 100px;
`;
