// eslint-disable-next-line import/no-named-as-default
import styled, { DefaultTheme } from 'styled-components/native';

interface ThemedTextProps {
  theme: DefaultTheme;
}

// Headings
export const Title1 = styled.Text`
  font-size: 28px;
  font-family: 'UberBold';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Title2 = styled.Text`
  font-size: 22px;
  font-family: 'UberBold';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Title3 = styled.Text`
  font-size: 18px;
  font-family: 'UberBold';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Title4 = styled.Text`
  font-size: 16px;
  font-family: 'UberBold';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

// Body
export const Body1 = styled.Text`
  font-size: 16px;
  font-family: 'UberRegular';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Body1Emphasized = styled.Text`
  font-size: 16px;
  font-family: 'UberMedium';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Body1Secondary = styled.Text`
  font-size: 16px;
  font-family: 'UberRegular';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textSecondary};
`;

export const BodyM = styled.Text`
  font-size: 14px;
  font-family: 'UberRegular';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyMEmphasized = styled.Text`
  font-size: 14px;
  font-family: 'UberMedium';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyMSecondary = styled.Text`
  font-size: 14px;
  font-family: 'UberRegular';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textSecondary};
`;

export const BodyS = styled.Text`
  font-size: 12px;
  font-family: 'UberRegular';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodySEmphasized = styled.Text`
  font-size: 12px;
  font-family: 'UberMedium';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodySSecondary = styled.Text`
  font-size: 12px;
  font-family: 'UberRegular';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textSecondary};
`;

export const BodyXS = styled.Text`
  font-size: 10px;
  font-family: 'UberRegular';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyXSEmphasized = styled.Text`
  font-size: 10px;
  font-family: 'UberMedium';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyXSSecondary = styled.Text`
  font-size: 10px;
  font-family: 'UberRegular';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textSecondary};
`;

export const Body2XS = styled.Text`
  font-size: 8px;
  font-family: 'UberRegular';
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;
