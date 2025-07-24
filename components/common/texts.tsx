import styled, { DefaultTheme } from 'styled-components/native';

interface ThemedTextProps {
  theme: DefaultTheme;
}

// Headings
export const Title1 = styled.Text`
  font-size: 32px;
  font-family: 'Unbounded';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Title2 = styled.Text`
  font-size: 22px;
  font-family: 'Unbounded';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Title3 = styled.Text`
  font-size: 20px;
  font-family: 'Unbounded';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Title4 = styled.Text`
  font-size: 18px;
  font-family: 'Unbounded';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Title5 = styled.Text`
  font-size: 16px;
  font-family: 'Unbounded';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

// Body
export const Body1 = styled.Text`
  font-size: 18px;
  font-family: 'Geist';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Body1Emphasized = styled.Text`
  font-size: 18px;
  font-family: 'Geist';
  font-weight: 500;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Body1Secondary = styled.Text`
  font-size: 16px;
  font-family: 'Geist';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textSecondary};
`;

export const BodyM = styled.Text`
  font-size: 16px;
  font-family: 'Geist';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyMEmphasized = styled.Text`
  font-size: 16px;
  font-family: 'Geist';
  font-weight: 500;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyMSecondary = styled.Text`
  font-size: 14px;
  font-family: 'Geist';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textSecondary};
`;

export const BodyS = styled.Text`
  font-size: 14px;
  font-family: 'Geist';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodySEmphasized = styled.Text`
  font-size: 14px;
  font-family: 'Geist';
  font-weight: 500;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodySSecondary = styled.Text`
  font-size: 12px;
  font-family: 'Geist';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textSecondary};
`;

export const BodyXS = styled.Text`
  font-size: 12px;
  font-family: 'Geist';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyXSEmphasized = styled.Text`
  font-size: 12px;
  font-family: 'Geist';
  font-weight: 500;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyXSSecondary = styled.Text`
  font-size: 10px;
  font-family: 'Geist';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textSecondary};
`;

export const Body2XS = styled.Text`
  font-size: 10px;
  font-family: 'Geist';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const Body2XSEmphasized = styled.Text`
  font-size: 10px;
  font-family: 'Geist';
  font-weight: 500;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

// Mono
export const BodyMMono = styled.Text`
  font-size: 16px;
  font-family: 'Geist Mono';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyMMonoEmphasized = styled.Text`
  font-size: 16px;
  font-family: 'Geist Mono';
  font-weight: 500;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodySMono = styled.Text`
  font-size: 14px;
  font-family: 'Geist Mono';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodySMonoSecondary = styled.Text`
  font-size: 14px;
  font-family: 'Geist Mono';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textSecondary};
`;

export const BodySMonoEmphasized = styled.Text`
  font-size: 14px;
  font-family: 'Geist Mono';
  font-weight: 500;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyXSMono = styled.Text`
  font-size: 12px;
  font-family: 'Geist Mono';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyXSMonoEmphasized = styled.Text`
  font-size: 12px;
  font-family: 'Geist Mono';
  font-weight: 500;
  color: ${({ theme }: ThemedTextProps) => theme.colors.textPrimary};
`;

export const BodyXSMonoSecondary = styled.Text`
  font-size: 12px;
  font-family: 'Geist Mono';
  font-weight: 400;
  color: ${({ theme }: ThemedTextProps) => theme.colors.midEmText};
`;
