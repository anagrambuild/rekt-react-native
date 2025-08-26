import { ActivityIndicator } from "react-native";

import { PressableOpacity } from "./PressableOpacity";
import styled, { css, DefaultTheme } from "styled-components/native";

interface ThemedButtonProps {
  theme: DefaultTheme;
}

interface ThemedButtonTextProps {
  theme: DefaultTheme;
}

interface ButtonProps extends React.ComponentProps<typeof PressableOpacity> {
  icon?: React.ReactNode;
  loading?: boolean;
}

const sharedStyles = css`
  padding: 14px 32px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex-direction: row;
  gap: 8px;
`;

const sharedTextStyles = css`
  font-size: 18px;
`;

// Styled ActivityIndicator components
const PrimaryActivityIndicator = styled(ActivityIndicator)`
  color: ${({ theme }: ThemedButtonProps) => theme.colors.background};
`;

const SecondaryActivityIndicator = styled(ActivityIndicator)`
  color: ${({ theme }: ThemedButtonProps) => theme.colors.textPrimary};
`;

// PRIMARY BUTTON
const StyledPrimaryButton = styled(PressableOpacity)<{
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

const PrimaryButtonText = styled.Text`
  color: ${({ theme }: ThemedButtonTextProps) => theme.colors.background};
  font-family: "Geist";
  font-weight: 400;
  ${sharedTextStyles}
`;

export const PrimaryButton = ({
  icon,
  children,
  loading,
  ...props
}: ButtonProps) => (
  <StyledPrimaryButton {...props} loading={loading}>
    {loading ? (
      <PrimaryActivityIndicator />
    ) : (
      <>
        {icon}
        <PrimaryButtonText>{children}</PrimaryButtonText>
      </>
    )}
  </StyledPrimaryButton>
);

// SECONDARY BUTTON
const StyledSecondaryButton = styled(PressableOpacity)<{
  disabled?: boolean;
  loading?: boolean;
}>`
  ${sharedStyles}
  background-color: ${({
    theme,
    disabled,
    loading,
  }: ThemedButtonProps & { disabled?: boolean; loading?: boolean }) =>
    disabled || loading ? theme.colors.disabled : theme.colors.secondary};
  opacity: ${({
    disabled = false,
    loading = false,
  }: {
    disabled?: boolean;
    loading?: boolean;
  }) => (disabled || loading ? 0.8 : 1)};
`;

const SecondaryButtonText = styled.Text`
  color: ${({ theme }: ThemedButtonTextProps) => theme.colors.textPrimary};
  font-family: "Geist";
  font-weight: 400;
  ${sharedTextStyles}
`;

export const SecondaryButton = ({
  icon,
  children,
  loading,
  ...props
}: ButtonProps) => (
  <StyledSecondaryButton {...props} loading={loading}>
    {loading ? (
      <SecondaryActivityIndicator />
    ) : (
      <>
        {icon}
        <SecondaryButtonText>{children}</SecondaryButtonText>
      </>
    )}
  </StyledSecondaryButton>
);

// LOGIN BUTTON
const StyledTertiaryButton = styled(PressableOpacity)<{
  disabled?: boolean;
  loading?: boolean;
}>`
  ${sharedStyles}
  opacity: ${({
    disabled = false,
    loading = false,
  }: {
    disabled?: boolean;
    loading?: boolean;
  }) => (disabled || loading ? 0.8 : 1)};
`;

export const TertiaryButton = ({
  icon,
  children,
  loading,
  ...props
}: ButtonProps) => (
  <StyledTertiaryButton {...props} loading={loading}>
    {loading ? (
      <SecondaryActivityIndicator />
    ) : (
      <>
        {icon}
        <SecondaryButtonText>{children}</SecondaryButtonText>
      </>
    )}
  </StyledTertiaryButton>
);

// DANGER BUTTON
const StyledDangerButton = styled(PressableOpacity)<{
  disabled?: boolean;
  loading?: boolean;
}>`
  ${sharedStyles}
  background-color: ${({
    theme,
    disabled,
    loading,
  }: ThemedButtonProps & { disabled?: boolean; loading?: boolean }) =>
    disabled || loading ? theme.colors.disabled : theme.colors.loss};
  opacity: ${({
    disabled = false,
    loading = false,
  }: {
    disabled?: boolean;
    loading?: boolean;
  }) => (disabled || loading ? 0.8 : 1)};
`;

const DangerButtonText = styled.Text`
  color: ${({ theme }: ThemedButtonTextProps) => theme.colors.textPrimary};
  font-family: "Geist";
  font-weight: 400;
  ${sharedTextStyles}
`;

export const DangerButton = ({
  icon,
  children,
  loading,
  ...props
}: ButtonProps) => (
  <StyledDangerButton {...props} loading={loading}>
    {loading ? (
      <SecondaryActivityIndicator />
    ) : (
      <>
        {icon}
        <DangerButtonText>{children}</DangerButtonText>
      </>
    )}
  </StyledDangerButton>
);
