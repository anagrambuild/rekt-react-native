import { PressableProps } from 'react-native';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { PressableOpacity } from './PressableOpacity';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

const Container = styled.View`
  background: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.segmentedControl};
  padding: 2px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
`;

const StyledPressable = styled(PressableOpacity)`
  background: ${({ theme }: { theme: DefaultTheme }) => theme.colors.secondary};
  border-radius: 100px;
  padding: 12px;
  align-items: center;
  justify-content: center;
`;

interface IconButtonProps extends PressableProps {
  name: keyof typeof MaterialIcon.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
}

export const IconButton = ({
  name,
  onPress,
  size = 16,
  color,
  ...props
}: IconButtonProps) => {
  const theme = useTheme();
  return (
    <Container>
      <StyledPressable onPress={onPress} {...props}>
        <MaterialIcon
          name={name}
          size={size}
          color={color || theme.colors.onSecondary || 'white'}
        />
      </StyledPressable>
    </Container>
  );
};
