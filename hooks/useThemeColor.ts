/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useTheme } from "styled-components/native";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ReturnType<typeof useTheme>["colors"]
) {
  const theme = useTheme();
  const colorFromProps = props[theme.dark ? "dark" : "light"];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return theme.colors[colorName];
  }
}
