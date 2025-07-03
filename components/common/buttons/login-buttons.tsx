import { Pressable } from 'react-native';

import styled, { css, DefaultTheme } from 'styled-components/native';

interface ThemedButtonProps {
  theme: DefaultTheme;
}

interface ThemedButtonTextProps {
  theme: DefaultTheme;
}

const sharedStyles = css`
  padding: 14px 32px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const sharedTextStyles = css`
  font-size: 18px;
`;

// SIGNUP BUTTON
const StyledSignupButton = styled.Pressable`
  ${sharedStyles}
  background-color: ${({ theme }: ThemedButtonProps) =>
    theme.colors.textPrimary};
`;

const SigninButtonText = styled.Text`
  color: ${({ theme }: ThemedButtonTextProps) => theme.colors.background};
  font-family: 'Geist';
  font-weight: 400;
  ${sharedTextStyles}
`;

export const SignupButton = (props: React.ComponentProps<typeof Pressable>) => (
  <StyledSignupButton {...props}>
    <SigninButtonText>{props.children}</SigninButtonText>
  </StyledSignupButton>
);

// LOGIN BUTTON
const StyledLoginButton = styled.Pressable`
  ${sharedStyles}/* background-color: ${({ theme }: ThemedButtonProps) =>
    theme.colors.background}; */
`;

const LoginButtonText = styled.Text`
  color: ${({ theme }: ThemedButtonTextProps) => theme.colors.textPrimary};
  font-family: 'Geist';
  font-weight: 400;
  ${sharedTextStyles}
`;

export const LoginButton = (props: React.ComponentProps<typeof Pressable>) => (
  <StyledLoginButton {...props}>
    <LoginButtonText>{props.children}</LoginButtonText>
  </StyledLoginButton>
);
