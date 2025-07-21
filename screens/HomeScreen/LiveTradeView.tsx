import rektBomb from '@/assets/images/app-pngs/rekt-bomb.png';
import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import {
  BodyMEmphasized,
  BodyMSecondary,
  BodySEmphasized,
  Card,
  Column,
  PressableOpacity,
  Row,
  Title5,
} from '@/components';
import { useHomeContext } from '@/contexts';
import { Trade } from '@/contexts/HomeContext';

import { LongArrow, ShortArrow } from './long-short-buttons';
import { liquidationPrices } from './mockData';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

interface LiveTradeViewProps {
  trade: Trade;
}

export const LiveTradeView = ({ trade }: LiveTradeViewProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { selectedToken, setSolTrade, setEthTrade, setBtcTrade } =
    useHomeContext();

  // Mock values for now
  const currentValue = 250.2;
  const profitPercent = 128.22;
  const isProfit = profitPercent >= 0;
  const rektAt =
    liquidationPrices[selectedToken as keyof typeof liquidationPrices];

  const handleClose = () => {
    if (selectedToken === 'sol') setSolTrade(null);
    else if (selectedToken === 'eth') setEthTrade(null);
    else setBtcTrade(null);
  };

  return (
    <Card>
      <Column $gap={4}>
        <Row $padding={12} style={{ paddingTop: 8 }}>
          <Row $gap={12} $width='auto'>
            {trade.side === 'long' ? (
              <LongArrow size={28} />
            ) : (
              <ShortArrow size={28} />
            )}
            <BodyMEmphasized>
              {trade.leverage}x {t(trade.side === 'long' ? 'Long' : 'Short')}
            </BodyMEmphasized>
          </Row>
          <SellNowButton onPress={handleClose}>
            <SellNowText>{t('Sell now')}</SellNowText>
          </SellNowButton>
        </Row>

        <InnerCard>
          <Row $alignItems='flex-end'>
            <Column $gap={4} $alignItems='flex-start' $width='auto'>
              <Title5>${currentValue.toFixed(2)}</Title5>
              <BodyMSecondary>{t('Current value')}</BodyMSecondary>
            </Column>
            <Column $gap={4} $alignItems='flex-end' $width='auto'>
              <ProfitText $isProfit={isProfit} theme={theme}>
                {isProfit ? '+' : ''}
                {profitPercent.toFixed(2)}%
              </ProfitText>
              <BodyMSecondary>{t('Profit')}</BodyMSecondary>
            </Column>
          </Row>
        </InnerCard>

        <InnerCard>
          <Row>
            <Row $gap={8} $alignItems='center' $width='auto'>
              <RektIcon source={rektBomb} />
              <BodyMSecondary>{t('Rekt at')}</BodyMSecondary>
            </Row>
            <BodySEmphasized>${rektAt}</BodySEmphasized>
          </Row>
        </InnerCard>
        <InnerCard>
          <Row>
            <Row $gap={8} $alignItems='center' $width='auto'>
              <UsdcIcon width={20} height={20} />
              <BodyMSecondary>{t('Amount invested')}</BodyMSecondary>
            </Row>
            <BodySEmphasized>${trade.amount}</BodySEmphasized>
          </Row>
        </InnerCard>
      </Column>
    </Card>
  );
};

const SellNowButton = styled(PressableOpacity)`
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.textPrimary};
  border-radius: 100px;
  padding: 6px 12px;
  align-items: center;
  justify-content: center;
`;

const SellNowText = styled(BodySEmphasized)`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.background};
`;

const InnerCard = styled(Card)`
  padding: 16px;
  gap: 16px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

// Fix linter error for ProfitText
interface ProfitTextProps {
  theme: DefaultTheme;
  $isProfit: boolean;
}

const ProfitText = styled(Title5)<ProfitTextProps>`
  color: ${({ theme, $isProfit }: ProfitTextProps) =>
    $isProfit ? theme.colors.profit : theme.colors.loss};
`;

const RektIcon = styled(Image)`
  width: 20px;
  height: 20px;
`;
