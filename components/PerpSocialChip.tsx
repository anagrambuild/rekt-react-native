import { ImageSourcePropType, View } from 'react-native';

import { BodyMSecondary, BodySSecondary, Column, Row } from './common';
import greenArrow from '@/assets/images/app-pngs/green-arrow.png';
import lostFace from '@/assets/images/app-pngs/lost-face.png';
import redArrow from '@/assets/images/app-pngs/red-arrow.png';
import rektBomb from '@/assets/images/app-pngs/rekt-bomb.png';
import wonCash from '@/assets/images/app-pngs/won-cash.png';
import FireIcon from '@/assets/images/app-svgs/fire.svg';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line import/no-named-as-default
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

const pfpSize = 40;
const pfpBorderRadius = 12;

const posistionImgSize = 20;
const fireIconSize = 14;

const arrowMap = {
  long: greenArrow,
  short: redArrow,
  won: wonCash,
  lost: lostFace,
};

export type PerpPosition = 'long' | 'short' | 'won' | 'lost';

interface PerpSocialChipProps {
  imgSrc: ImageSourcePropType;
  position: PerpPosition;
  meta: string;
  earningMultiple: number | null;
}

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  align-self: flex-start;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  border-radius: 16px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.cardEmphasized};
`;

const AvatarWrapper = styled.View`
  position: relative;
`;

const PositionWrapper = styled.View`
  position: absolute;
  bottom: -4;
  right: -8;
`;

export const PerpSocialChip = ({
  imgSrc,
  position,
  meta,
  earningMultiple,
}: PerpSocialChipProps) => {
  const theme = useTheme() as DefaultTheme;
  const { t } = useTranslation();

  const getMetaColor = () => {
    if (position === 'won') return theme.colors.profit;
    if (position === 'lost' || meta === 'Got rekt') return theme.colors.loss;
    return theme.colors.highEmText;
  };

  return (
    <Container>
      <AvatarWrapper>
        <Image
          source={imgSrc}
          style={{
            width: pfpSize,
            height: pfpSize,
            borderRadius: pfpBorderRadius,
            marginStart: 2,
          }}
        />
        {meta === 'Got rekt' && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: pfpSize,
              height: pfpSize,
              borderRadius: pfpBorderRadius,
              backgroundColor: 'rgba(82, 82, 91, 0.85)',
              zIndex: 2,
              marginStart: 2,
            }}
          />
        )}
        <PositionWrapper>
          <Image
            source={meta === 'Got rekt' ? rektBomb : arrowMap[position]}
            style={{
              width: posistionImgSize,
              height: posistionImgSize,
              zIndex: 2,
            }}
          />
        </PositionWrapper>
      </AvatarWrapper>
      <Column
        $alignItems='flex-start'
        $width='auto'
        style={{ paddingStart: 10, paddingEnd: 1 }}
      >
        <Row $width='auto' $gap={8}>
          <BodyMSecondary style={{ color: theme.colors.midEmText }}>
            {`${t(position.charAt(0).toUpperCase() + position.slice(1))}`}
          </BodyMSecondary>
          {position === 'won' && (
            <Row $width='auto' $gap={4}>
              <FireIcon width={fireIconSize} height={fireIconSize} />
              <BodySSecondary
                style={{
                  color: theme.colors.highEmText,
                  fontFamily: 'Unbounded',
                  fontWeight: 'bold',
                }}
              >
                {`${earningMultiple}x`}
              </BodySSecondary>
            </Row>
          )}
        </Row>
        <BodyMSecondary style={{ color: getMetaColor(), fontWeight: 'bold' }}>
          {meta}
        </BodyMSecondary>
      </Column>
    </Container>
  );
};
