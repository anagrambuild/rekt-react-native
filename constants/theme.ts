import { DarkTheme, DefaultTheme } from '@react-navigation/native';

import { black, gray500, gray600, primaryBlue, white } from './app-colors';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    tint: primaryBlue,
    background: white,
    textPrimary: black,
    textSecondary: gray600,
  },
};

export const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    tint: white,
    background: black,
    textPrimary: white,
    textSecondary: gray500,
  },
};
