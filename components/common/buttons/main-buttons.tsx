import { PressableOpacity } from './PressableOpacity';
import styled, { css, DefaultTheme } from 'styled-components/native';

interface ThemedButtonProps {
  theme: DefaultTheme;
}

interface ThemedButtonTextProps {
  theme: DefaultTheme;
}

interface ButtonProps extends React.ComponentProps<typeof PressableOpacity> {
  icon?: React.ReactNode;
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

// PRIMARY BUTTON
const StyledPrimaryButton = styled(PressableOpacity)`
  ${sharedStyles}
  background-color: ${({ theme }: ThemedButtonProps) =>
    theme.colors.textPrimary};
`;

const PrimaryButtonText = styled.Text`
  color: ${({ theme }: ThemedButtonTextProps) => theme.colors.background};
  font-family: 'Geist';
  font-weight: 400;
  ${sharedTextStyles}
`;

export const PrimaryButton = ({ icon, children, ...props }: ButtonProps) => (
  <StyledPrimaryButton {...props}>
    {icon}
    <PrimaryButtonText>{children}</PrimaryButtonText>
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

export const SecondaryButton = ({ icon, children, ...props }: ButtonProps) => (
  <StyledSecondaryButton {...props}>
    {icon}
    <SecondaryButtonText>{children}</SecondaryButtonText>
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
