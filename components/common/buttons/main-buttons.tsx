import { PressableOpacity } from './PressableOpacity';
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

// PRIMARY BUTTON
const StyledPrimaryButton = styled(PressableOpacity)`
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

export const PrimaryButton = (
  props: React.ComponentProps<typeof PressableOpacity>
) => (
  <StyledPrimaryButton {...props}>
    <SigninButtonText>{props.children}</SigninButtonText>
  </StyledPrimaryButton>
);

// SECONDARY BUTTON
const StyledSecondaryButton = styled(PressableOpacity)`
  ${sharedStyles}
  background-color: ${({ theme }: ThemedButtonProps) => theme.colors.secondary};
`;

const SecondaryButtonText = styled.Text`
  color: ${({ theme }: ThemedButtonTextProps) => theme.colors.textPrimary};
  font-family: 'Geist';
  font-weight: 400;
  ${sharedTextStyles}
`;

export const SecondaryButton = (
  props: React.ComponentProps<typeof PressableOpacity>
) => (
  <StyledSecondaryButton {...props}>
    <SecondaryButtonText>{props.children}</SecondaryButtonText>
  </StyledSecondaryButton>
);

// LOGIN BUTTON
const StyledTertiaryButton = styled(PressableOpacity)`
  ${sharedStyles}
`;

export const TertiaryButton = (
  props: React.ComponentProps<typeof PressableOpacity>
) => (
  <StyledTertiaryButton {...props}>
    <SecondaryButtonText>{props.children}</SecondaryButtonText>
  </StyledTertiaryButton>
);
