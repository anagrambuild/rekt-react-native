import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';

// eslint-disable-next-line import/no-named-as-default
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
        style={{ flex: 1, marginTop: paddingTop }}
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
          width: '100%',
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
