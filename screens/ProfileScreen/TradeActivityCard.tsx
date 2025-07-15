import BtcUnselected from '@/assets/images/app-svgs/btc-unselected.svg';
import EthUnselected from '@/assets/images/app-svgs/eth-unselected.svg';
import SolUnselected from '@/assets/images/app-svgs/sol-unselected.svg';
import { BodyM, BodySMono, BodyXSMono, Card, Column, Row } from '@/components';

import Entypo from '@expo/vector-icons/Entypo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { PnL } from './ProfileInfoCards';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

interface TradeActivityCardProps {
  type: 'long' | 'short';
  symbol: 'btc' | 'eth' | 'sol';
  amount: number;
  leverage: number;
  percentage: number;
  isProfit: boolean;
}

export type { TradeActivityCardProps };

export const TradeActivityCard = ({
  type,
  symbol,
  amount,
  leverage,
  percentage,
  isProfit,
}: TradeActivityCardProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Card $padding={12}>
      <Row $width='auto'>
        <Row $width='auto' $justifyContent='flex-start' $gap={24}>
          <SymbolContainer>
            <Icon symbol={symbol} />
            <ArrowContainer>
              <MaterialCommunityIcons
                name={isProfit ? 'arrow-top-right' : 'arrow-bottom-right'}
                size={11}
                color={theme.colors.textPrimary}
              />
            </ArrowContainer>
          </SymbolContainer>
          <Column $width='auto' $alignItems='flex-start'>
            <BodyM>{t(type === 'long' ? 'Long' : 'Short')}</BodyM>
            <Row $width='auto'>
              <BodyXSMono>{`$${amount}`}</BodyXSMono>
              <Entypo
                name='dot-single'
                size={24}
                color={theme.colors.textSecondary}
              />
              <BodyXSMono>{`${leverage}x`}</BodyXSMono>
            </Row>
          </Column>
        </Row>
        <Column $width='auto' $gap={12}>
          <Row
            $width='auto'
            $gap={12}
            $padding={6}
            $alignItems='flex-start'
            style={{ flex: 1 }}
          >
            <BodySMono>{`${percentage}%`}</BodySMono>
            <PnL isProfit={isProfit} />
          </Row>
        </Column>
      </Row>
    </Card>
  );
};

const Icon = ({ symbol }: { symbol: 'btc' | 'eth' | 'sol' }) => {
  switch (symbol) {
    case 'btc':
      return <BtcUnselected />;
    case 'eth':
      return <EthUnselected />;
    case 'sol':
      return <SolUnselected />;
  }
};

const SymbolContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

const ArrowContainer = styled.View`
  position: absolute;
  right: -12px;
  bottom: -4px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.secondaryTapped};
  border-radius: 100px;
  padding: 4px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.card};
  border-width: 1px;
`;
