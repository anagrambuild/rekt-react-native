import { DarkTheme, DefaultTheme } from '@react-navigation/native';

import {
  black,
  black2,
  gray100,
  gray500,
  gray600,
  primaryBlue,
  white,
} from './app-colors';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    tint: primaryBlue,
    background: white,
    backgroundSecondary: gray100,
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
    backgroundSecondary: black2,
    textPrimary: white,
    textSecondary: gray500,
  },
};
