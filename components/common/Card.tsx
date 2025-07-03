import styled, { DefaultTheme } from 'styled-components/native';

export const Card = styled.View`
  width: 100%;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
  border-radius: 16px;
  padding: 4px;
`;
