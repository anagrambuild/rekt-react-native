import { SafeAreaView } from 'react-native';

// eslint-disable-next-line import/no-named-as-default
import styled, { DefaultTheme } from 'styled-components/native';

// Screen Container
interface StyledSafeAreaViewProps {
  $backgroundColor?: string;
  $alignItems?: string;
  $justifyContent?: string;
  theme: DefaultTheme;
}

const screenPadding = 20;

const StyledSafeAreaView = styled(SafeAreaView)<StyledSafeAreaViewProps>`
  flex: 1;
  width: 100%;
  background-color: ${({ $backgroundColor, theme }: StyledSafeAreaViewProps) =>
    $backgroundColor || theme.colors.background};
  justify-content: ${({ $justifyContent }: StyledSafeAreaViewProps) =>
    $justifyContent || 'center'};
  align-items: ${({ $alignItems }: StyledSafeAreaViewProps) =>
    $alignItems || 'center'};
`;

export const ScreenContainer = ({
  children,
  backgroundColor,
  alignItems,
  justifyContent,
}: {
  children: React.ReactNode;
  backgroundColor?: string;
  alignItems?: string;
  justifyContent?: string;
}) => {
  return (
    <StyledSafeAreaView
      $backgroundColor={backgroundColor}
      $alignItems={alignItems}
      $justifyContent={justifyContent}
    >
      <Column $padding={screenPadding}>{children}</Column>
    </StyledSafeAreaView>
  );
};

// Column
interface ColumnProps {
  $gap?: number;
  $alignItems?: string;
  $padding?: number;
  theme: DefaultTheme;
}

export const Column = styled.View<ColumnProps>`
  flex-direction: column;
  width: 100%;
  gap: ${({ $gap }: ColumnProps) => $gap || 0}px;
  align-items: ${({ $alignItems }: ColumnProps) => $alignItems || 'center'};
  padding: ${({ $padding }: ColumnProps) => $padding || 0}px;
`;

// Row
interface RowProps {
  $gap?: number;
  $justifyContent?: string;
  $padding?: number;
  theme: DefaultTheme;
}

export const Row = styled.View<RowProps>`
  flex-direction: row;
  gap: ${({ $gap }: RowProps) => $gap || 0}px;
  justify-content: ${({ $justifyContent }: RowProps) =>
    $justifyContent || 'center'};
  padding: ${({ $padding }: RowProps) => $padding || 0}px;
`;
