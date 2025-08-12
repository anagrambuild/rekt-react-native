import { View } from 'react-native';

import coinDarkIcon from '@/assets/images/app-pngs/coin-dark.png';
import {
  BodyMEmphasized,
  BodyMSecondary,
  Card,
  Column,
  Row,
} from '@/components';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { FloatingUsdcIcon } from './FloatingUsdcIcon';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components/native';

interface EarningsCardProps {
  targetUsdcPosition: { x: number; y: number };
  handleEarningAmountLayout: () => void;
  earningAmountRef: React.RefObject<View | null>;
}

export const EarningsCard = ({
  targetUsdcPosition,
  handleEarningAmountLayout,
  earningAmountRef,
}: EarningsCardProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <EarningsCardContainer
      ref={earningAmountRef}
      onLayout={handleEarningAmountLayout}
    >
      <Row $gap={16} $alignItems='center' $width='auto'>
        <Row $gap={12} $alignItems='center' $width='auto' style={{ flex: 1 }}>
          <CoinContainer>
            <Image
              source={coinDarkIcon}
              style={{
                width: 32,
                height: 32,
              }}
            />
          </CoinContainer>

          {/* Text content */}
          <Column $gap={4} $alignItems='flex-start'>
            <BodyMEmphasized>{t('Earnings so far')}</BodyMEmphasized>
            <Row $gap={8} $alignItems='center' $justifyContent='flex-start'>
              <BodyMSecondary>$0.0000002</BodyMSecondary>
              {/* Floating USDC Icon Animation - starts near the $ amount text */}
              <FloatingUsdcIcon size={16} targetPosition={targetUsdcPosition} />
            </Row>
          </Column>
        </Row>

        {/* Right arrow */}
        <MaterialIcon
          name='chevron-right'
          size={24}
          color={theme.colors.textPrimary}
        />
      </Row>
    </EarningsCardContainer>
  );
};

const EarningsCardContainer = styled(Card)`
  width: 100%;
  padding: 16px;
  background-color: ${({ theme }: { theme: any }) =>
    theme.colors.backgroundSecondary};
  border-radius: 12px;
  position: relative;
  overflow: visible;
`;

const CoinContainer = styled.View`
  width: 40px;
  height: 40px;
  position: relative;
`;
