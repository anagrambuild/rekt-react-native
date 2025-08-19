import {
  Column,
  PressableOpacity,
  Row,
  ScreenContainer,
  TertiaryButton,
  Title5,
} from '@/components';
import { useAppContext, useWallet } from '@/contexts';
import { supabase } from '@/utils/supabase';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

export const SettingsScreen = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setIsLoggedIn, setUserProfile, setShowSignUpForm } = useAppContext();
  const { disconnect } = useWallet();

  const handleLogout = async () => {
    try {
      // Clear secure storage
      await supabase.auth.signOut();

      // Disconnect wallet
      disconnect();

      // Clear user profile and sign up form state
      setUserProfile(null);
      setShowSignUpForm(false);

      // Set logged in state to false
      setIsLoggedIn(false);

      // Explicitly navigate to app/index
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still try to log out even if there's an error
      setIsLoggedIn(false);
      router.replace('/');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        <Column
          $padding={8}
          $gap={24}
          $justifyContent='space-between'
          style={{ flex: 1 }}
        >
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

          {/* Logout Button */}
          <Column $padding={16}>
            <TertiaryButton onPress={handleLogout}>
              {t('Logout')}
            </TertiaryButton>
          </Column>
        </Column>
      </ScreenContainer>
    </>
  );
};
