import { I18nManager } from 'react-native';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';

import { AppProvider } from '../contexts/AppContext';
import { darkTheme, lightTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack } from 'expo-router';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';

// Configure RTL support for languages like Arabic and Hebrew
I18nManager.allowRTL(true);
I18nManager.swapLeftAndRightInRTL(true);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const styledTheme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <AppProvider>
      <NavigationThemeProvider value={navTheme}>
        <StyledThemeProvider theme={styledTheme}>
          <Stack screenOptions={{ headerShown: false }} />
        </StyledThemeProvider>
      </NavigationThemeProvider>
    </AppProvider>
  );
}
