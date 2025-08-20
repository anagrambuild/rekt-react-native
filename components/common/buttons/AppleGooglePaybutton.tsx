import { ActivityIndicator, Platform } from "react-native";

import applePay from "@/assets/images/app-pngs/apple-pay.png";
import googlePay from "@/assets/images/app-pngs/google-pay.png";

import { BodyMEmphasized } from "../texts";
import { PressableOpacity } from "./PressableOpacity";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme } from "styled-components/native";

const isAndroid = Platform.OS === "android";

interface ThemedButtonProps {
  theme: DefaultTheme;
}

interface ButtonProps extends React.ComponentProps<typeof PressableOpacity> {
  loading?: boolean;
  disabled?: boolean;
}

const sharedStyles = `
  padding: 14px 32px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex-direction: row;
  gap: 8px;
`;

const StyledAppleGooglePayButton = styled(PressableOpacity)<{
  disabled?: boolean;
  loading?: boolean;
}>`
  ${sharedStyles}
  background-color: ${({
    theme,
    disabled,
    loading,
  }: ThemedButtonProps & { disabled?: boolean; loading?: boolean }) =>
    disabled || loading ? theme.colors.disabled : theme.colors.textPrimary};
  opacity: ${({
    disabled = false,
    loading = false,
  }: {
    disabled?: boolean;
    loading?: boolean;
  }) => (disabled || loading ? 0.8 : 1)};
`;

const AppleGooglePayButtonText = styled(BodyMEmphasized)`
  color: ${({ theme }: ThemedButtonProps) => theme.colors.background};
`;

const StyledActivityIndicator = styled(ActivityIndicator)`
  color: ${({ theme }: ThemedButtonProps) => theme.colors.background};
`;

export const AppleGooglePayButton = ({
  loading,
  disabled,
  ...props
}: ButtonProps) => {
  const { t } = useTranslation();
  return (
    <StyledAppleGooglePayButton
      {...props}
      loading={loading}
      disabled={disabled}
    >
      {loading ? (
        <StyledActivityIndicator />
      ) : (
        <>
          <AppleGooglePayButtonText>
            {t("Deposit with")}
          </AppleGooglePayButtonText>
          <Image
            source={isAndroid ? googlePay : applePay}
            style={{ width: 40, height: 16, marginTop: 4 }}
          />
        </>
      )}
    </StyledAppleGooglePayButton>
  );
};
