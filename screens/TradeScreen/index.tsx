import { Pressable } from 'react-native';

import { Row, ScreenContainer, Title1 } from '@/components';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { router, Stack } from 'expo-router';
import { useTheme } from 'styled-components/native';

export const TradeScreen = () => {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        <Row>
          <Pressable onPress={() => router.back()}>
            <MaterialIcon
              name='keyboard-arrow-left'
              size={32}
              color={theme.colors.textSecondary}
            />
          </Pressable>
          <Title1>Trade</Title1>
        </Row>
      </ScreenContainer>
    </>
  );
};
