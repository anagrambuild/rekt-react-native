import { SafeAreaView, StyleProp, ViewStyle } from 'react-native';

// eslint-disable-next-line import/no-named-as-default
import styled, { DefaultTheme } from 'styled-components/native';

// Screen Container
interface StyledSafeAreaViewProps {
  theme: DefaultTheme;
}

const screenPadding = 20;

const StyledSafeAreaView = styled(SafeAreaView)<StyledSafeAreaViewProps>`
  flex: 1;
  width: 100%;
  background-color: ${({ theme }: StyledSafeAreaViewProps) =>
    theme.colors.background};
`;

export const ScreenContainer = ({
  children,
  alignItems,
  justifyContent = 'space-between',
}: {
  children: React.ReactNode;
  alignItems?: string;
  justifyContent?: string;
}) => {
  return (
    <StyledSafeAreaView>
      <Column
        $padding={screenPadding}
        $alignItems={alignItems}
        $justifyContent={justifyContent}
        style={{ flex: 1 }}
      >
        {children}
      </Column>
    </StyledSafeAreaView>
  );
};

// Column
interface ColumnProps {
  $gap?: number;
  $alignItems?: string;
  $justifyContent?: string;
  $padding?: number;
  style?: StyleProp<ViewStyle>;
  theme: DefaultTheme;
}

export const Column = styled.View<ColumnProps>`
  flex-direction: column;
  width: 100%;
  gap: ${({ $gap }: ColumnProps) => $gap || 0}px;
  align-items: ${({ $alignItems }: ColumnProps) => $alignItems || 'center'};
  justify-content: ${({ $justifyContent }: ColumnProps) =>
    $justifyContent || 'center'};
  padding: ${({ $padding }: ColumnProps) => $padding || 0}px;
  ${({ style }: ColumnProps) => style}
`;

// Row
interface RowProps {
  $gap?: number;
  $justifyContent?: string;
  $padding?: number;
  style?: StyleProp<ViewStyle>;
  theme: DefaultTheme;
}

export const Row = styled.View<RowProps>`
  flex-direction: row;
  gap: ${({ $gap }: RowProps) => $gap || 0}px;
  justify-content: ${({ $justifyContent }: RowProps) =>
    $justifyContent || 'center'};
  padding: ${({ $padding }: RowProps) => $padding || 0}px;
  ${({ style }: RowProps) => style}
`;
