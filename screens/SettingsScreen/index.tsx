import {
  Column,
  PressableOpacity,
  Row,
  ScreenContainer,
  Title5,
} from '@/components';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

export const SettingsScreen = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        <Column $padding={8}>
          <Row $justifyContent='flex-start' $gap={12}>
            <PressableOpacity onPress={() => router.back()}>
              <MaterialIcon
                name='keyboard-arrow-left'
                size={24}
                color={theme.colors.textSecondary}
              />
            </PressableOpacity>
            <Title5>{t('Settings')}</Title5>
          </Row>
        </Column>
      </ScreenContainer>
    </>
  );
};
