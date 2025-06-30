import { DarkTheme, DefaultTheme } from '@react-navigation/native';

import { black, gray, tintColorLight, white } from './app-colors';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    tint: tintColorLight,
    background: white,
    textPrimary: black,
    textSecondary: gray,
  },
};

export const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    tint: white,
    background: black,
    textPrimary: white,
  },
};
