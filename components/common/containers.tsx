import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';

import styled, { DefaultTheme } from 'styled-components/native';

// Screen Container
interface StyledSafeAreaViewProps {
  theme: DefaultTheme;
}

const screenPadding = 20;
const paddingTop = Platform.OS === 'ios' ? 0 : 30;

const StyledSafeAreaView = styled(SafeAreaView)<StyledSafeAreaViewProps>`
  flex: 1;
  width: 100%;
  background-color: ${({ theme }: StyledSafeAreaViewProps) =>
    theme.colors.background};
`;

const StyledScrollView = styled(ScrollView)<{
  $padding?: number;
  $alignItems?: string;
  $justifyContent?: string;
  $marginTop?: number;
}>`
  width: 100%;
  flex: 1;
  padding: ${({ $padding = 0 }: { $padding?: number }) => $padding}px;
  margin-top: ${({ $marginTop = 0 }: { $marginTop?: number }) => $marginTop}px;
`;

export const ScreenContainer = ({
  children,
  alignItems = 'center',
  justifyContent = 'space-between',
  contentContainerStyle,
}: {
  children: React.ReactNode;
  alignItems?: string;
  justifyContent?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) => {
  return (
    <StyledSafeAreaView>
      <StyledScrollView
        bounces={false} // Disables bouncing on iOS
        alwaysBounceVertical={false} // Prevents vertical bouncing
        alwaysBounceHorizontal={false} // Prevents horizontal bouncing (if needed)
        showsVerticalScrollIndicator={false}
        $padding={screenPadding}
        $marginTop={paddingTop}
        contentContainerStyle={{
          justifyContent: justifyContent,
          alignItems: alignItems,
          minHeight: '90%',
          ...(contentContainerStyle as any),
        }}
      >
        {children}
      </StyledScrollView>
    </StyledSafeAreaView>
  );
};

// Gap
interface GapProps {
  height?: number;
}

export const Gap = styled.View<GapProps>`
  height: ${({ height }: GapProps) => height || 8}px;
`;

// Column
interface ColumnProps {
  $gap?: number;
  $alignItems?: string;
  $justifyContent?: string;
  $padding?: number;
  $width?: number | string;
  style?: StyleProp<ViewStyle>;
  theme: DefaultTheme;
}

export const Column = styled.View<ColumnProps>`
  flex-direction: column;
  width: ${({ $width }: ColumnProps) => $width || '100%'};
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
  $alignItems?: string;
  $justifyContent?: string;
  $padding?: number;
  style?: StyleProp<ViewStyle>;
  $width?: number | string;
  theme: DefaultTheme;
}

export const Row = styled.View<RowProps>`
  flex-direction: row;
  width: ${({ $width }: RowProps) => $width || '100%'};
  gap: ${({ $gap }: RowProps) => $gap || 0}px;
  align-items: ${({ $alignItems }: RowProps) => $alignItems || 'center'};
  justify-content: ${({ $justifyContent }: RowProps) =>
    $justifyContent || 'space-between'};
  padding: ${({ $padding }: RowProps) => $padding || 0}px;
  ${({ style }: RowProps) => style}
`;

// ScrollRow
export const ScrollRow = ({
  children,
  $gap = 0,
  $alignItems = 'center' as const,
  $padding = 0,
  style,
  $width = '100%',
  $contentContainerStyle,
  ...props
}: {
  children: React.ReactNode;
  $gap?: number;
  $alignItems?: 'flex-start' | 'flex-end' | 'center';
  $padding?: number;
  style?: StyleProp<ViewStyle>;
  $width?: number | string;
  $contentContainerStyle?: StyleProp<ViewStyle>;
  [key: string]: any;
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ width: $width as any, padding: $padding }, style]}
      contentContainerStyle={[
        {
          flexDirection: 'row',
          gap: $gap,
          alignItems: $alignItems,
          padding: $padding,
        },
        $contentContainerStyle,
      ]}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

// Tab Icon With Indicator
const TabIconContainer = styled.View`
  align-items: center;
  justify-content: flex-end;
  height: 36px;
`;

const TabIconIndicator = styled.View`
  position: absolute;
  top: 0;
  width: ${({ $width }: { $width: number }) => $width}px;
  height: 3px;
  border-radius: 2px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.tint};
`;

export const TabIconWithIndicator = ({
  children,
  focused,
  $width = 72,
}: {
  children: React.ReactNode;
  focused: boolean;
  $width?: number | string;
}) => {
  return (
    <TabIconContainer>
      {focused && <TabIconIndicator $width={$width} />}
      {children}
    </TabIconContainer>
  );
};

// Divider
export const Divider = styled.View`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.borderLight};
`;
