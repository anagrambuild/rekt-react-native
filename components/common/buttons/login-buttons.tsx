import { Pressable } from 'react-native';

// eslint-disable-next-line import/no-named-as-default
import styled, { css, DefaultTheme } from 'styled-components/native';

interface ThemedButtonProps {
  theme: DefaultTheme;
}

interface ThemedButtonTextProps {
  theme: DefaultTheme;
}

const sharedStyles = css`
  padding: 14px 32px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const sharedTextStyles = css`
  font-size: 18px;
  font-weight: 500;
`;

// SIGNUP BUTTON
const StyledSignupButton = styled.Pressable`
  ${sharedStyles}
  background-color: ${({ theme }: ThemedButtonProps) =>
    theme.colors.textPrimary};
`;

const SigninButtonText = styled.Text`
  color: ${({ theme }: ThemedButtonTextProps) => theme.colors.background};
  ${sharedTextStyles}
`;

export const SignupButton = (props: React.ComponentProps<typeof Pressable>) => (
  <StyledSignupButton {...props}>
    <SigninButtonText>Sign up</SigninButtonText>
  </StyledSignupButton>
);

// LOGIN BUTTON
const StyledLoginButton = styled.Pressable`
  ${sharedStyles}/* background-color: ${({ theme }: ThemedButtonProps) =>
    theme.colors.background}; */
`;

const LoginButtonText = styled.Text`
  color: ${({ theme }: ThemedButtonTextProps) => theme.colors.textPrimary};
  ${sharedTextStyles}
`;

export const LoginButton = (props: React.ComponentProps<typeof Pressable>) => (
  <StyledLoginButton {...props}>
    <LoginButtonText>Login</LoginButtonText>
  </StyledLoginButton>
);
