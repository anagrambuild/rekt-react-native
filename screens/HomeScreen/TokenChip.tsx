import { BodyMSecondary } from '@/components';

import styled, { DefaultTheme } from 'styled-components/native';

const Container = styled.View`
  flex-direction: row;
  gap: 4px;
`;

const StyledTokenChip = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.backgroundSecondary};
  padding: 2px 12px 4px 0;
  border-radius: 8px;
`;

interface TokenChipProps {
  Icon: React.ComponentType<{ width?: number; height?: number }>;
  value: string;
}

export const TokenChip = ({ Icon, value }: TokenChipProps) => {
  return (
    <Container>
      <StyledTokenChip>
        <Icon width={28} height={28} />
        <BodyMSecondary>{value}</BodyMSecondary>
      </StyledTokenChip>
    </Container>
  );
};
