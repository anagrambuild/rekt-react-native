import { I18nManager } from 'react-native';

import { darkTheme, lightTheme } from '@/constants/theme';
import { AppProvider } from '@/contexts';
import { useColorScheme } from '@/hooks/useColorScheme';
import { queryClient } from '@/utils';

import {
  DarkTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';

import '../polyfills';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import ToastManager from 'toastify-react-native';

// Configure RTL support for languages like Arabic and Hebrew
I18nManager.allowRTL(true);
I18nManager.swapLeftAndRightInRTL(true);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // const navTheme = colorScheme === 'dark' ? DefaultTheme : DefaultTheme;
  const navTheme = DarkTheme;
  const styledTheme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [fontsLoaded] = useFonts({
    Unbounded: require('../assets/fonts/Unbounded-VariableFont_wght.ttf'),
    Geist: require('../assets/fonts/Geist-VariableFont_wght.ttf'),
    'Geist Mono': require('../assets/fonts/GeistMono-VariableFont_wght.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <NavigationThemeProvider value={navTheme}>
            <StyledThemeProvider theme={styledTheme}>
              <Stack screenOptions={{ headerShown: false }} />
              <ToastManager
                position='top'
                offsetTop={100}
                useModal={true}
                theme='dark'
                backgroundColor={styledTheme.colors.card}
                textColor={styledTheme.colors.textPrimary}
                progressBarColor={styledTheme.colors.profit}
                iconColor={styledTheme.colors.profit}
              />
            </StyledThemeProvider>
          </NavigationThemeProvider>
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
