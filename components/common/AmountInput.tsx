import styled, { DefaultTheme } from "styled-components/native";

export const AmountInput = styled.TextInput`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
  font-family: "Unbounded";
  font-size: 40px;
  font-weight: 500;
`;
