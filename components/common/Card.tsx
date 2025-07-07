import styled, { DefaultTheme } from 'styled-components/native';

interface CardProps {
  $padding?: number;
}

export const Card = styled.View<CardProps>`
  width: 100%;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
  border-radius: 16px;
  padding: ${({ $padding }: { $padding?: number }) =>
    $padding ? `${$padding}px` : '4px'};
`;
