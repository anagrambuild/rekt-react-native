import { ImageSourcePropType } from 'react-native';

import { BodyMSecondary } from '@/components';

import { Image } from 'expo-image';
import styled, { DefaultTheme } from 'styled-components/native';

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const StyledTokenChip = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.backgroundSecondary};
  padding: 4px 12px;
  height: 24px;
  border-radius: 12px;
`;

interface TokenChipProps {
  imgSrc: ImageSourcePropType;
  value: string;
}

export const TokenChip = ({ imgSrc, value }: TokenChipProps) => {
  return (
    <Container>
      <Image
        source={imgSrc}
        style={{
          width: 28,
          height: 28,
          position: 'absolute',
          left: -12,
          zIndex: 1,
        }}
      />
      <StyledTokenChip style={{ paddingStart: 20 }}>
        <BodyMSecondary>{value}</BodyMSecondary>
      </StyledTokenChip>
    </Container>
  );
};
