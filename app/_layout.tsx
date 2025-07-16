import { I18nManager } from 'react-native';

import { darkTheme, lightTheme } from '@/constants/theme';
import { AppProvider, HomeProvider } from '@/contexts';
import { useColorScheme } from '@/hooks/useColorScheme';

import {
  DarkTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';

// Configure RTL support for languages like Arabic and Hebrew
I18nManager.allowRTL(true);
I18nManager.swapLeftAndRightInRTL(true);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <HomeProvider>
          <NavigationThemeProvider value={navTheme}>
            <StyledThemeProvider theme={styledTheme}>
              <Stack screenOptions={{ headerShown: false }} />
            </StyledThemeProvider>
          </NavigationThemeProvider>
        </HomeProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
