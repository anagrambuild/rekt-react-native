import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { PressableOpacity } from "./buttons";
import { Row } from "./containers";
import { BodyMEmphasized } from "./texts";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

interface WebViewScreenProps {
  url: string;
  title?: string;
  onBack: () => void;
}

export const WebViewScreen: React.FC<WebViewScreenProps> = ({
  url,
  title,
  onBack,
}) => {
  const theme = useTheme();

  return (
    <Container>
      {/* Header */}
      <HeaderContainer>
        <Row $justifyContent="space-between" $alignItems="center">
          <PressableOpacity onPress={onBack}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.textPrimary}
            />
          </PressableOpacity>
          <BodyMEmphasized>{title}</BodyMEmphasized>
          <PressableOpacity onPress={onBack}>
            <MaterialIcons
              name="close"
              size={24}
              color={theme.colors.textSecondary}
            />
          </PressableOpacity>
        </Row>
      </HeaderContainer>

      {/* WebView */}
      <WebViewContainer>
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
          startInLoadingState={true}
          scalesPageToFit={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          renderLoading={() => (
            <LoadingContainer>
              <BodyMEmphasized>Loading...</BodyMEmphasized>
            </LoadingContainer>
          )}
        />
      </WebViewContainer>
    </Container>
  );
};

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

const HeaderContainer = styled.View`
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.border};
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
`;

const WebViewContainer = styled.View`
  flex: 1;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;
