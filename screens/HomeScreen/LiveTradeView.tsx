import { ActivityIndicator } from 'react-native';

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
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

interface LiveTradeViewProps {
  trade: Trade;
}

export const LiveTradeView = ({ trade }: LiveTradeViewProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    selectedToken,
    setSolTrade,
    setEthTrade,
    setBtcTrade,
    closePosition,
    openPositions,
    isTrading,
  } = useHomeContext();

  // Find the actual position for this trade
  const currentPosition = openPositions.find(
    (pos) =>
      pos.asset === `${selectedToken.toUpperCase()}-PERP` &&
      pos.direction === trade.side
  );

  // Use real position data only
  const rektAt = currentPosition?.liquidationPrice;

  // Current value = initial margin + PnL (what the investment is worth now)
  const currentValue = currentPosition
    ? currentPosition.marginUsed + currentPosition.pnl
    : trade.amount;
  const profitPercent = currentPosition?.pnlPercentage || 128.22;
  const isProfit = currentPosition ? currentPosition.pnl >= 0 : null;

  const handleClose = async () => {
    if (currentPosition?.id) {
      // Close the actual position via backend
      const success = await closePosition(currentPosition.id);
      if (success) {
        // Clear local trade state after successful close
        if (selectedToken === 'sol') setSolTrade(null);
        else if (selectedToken === 'eth') setEthTrade(null);
        else setBtcTrade(null);
      }
    } else {
      // Fallback: just clear local state if no backend position found
      console.warn('No backend position found, clearing local state only');
      if (selectedToken === 'sol') setSolTrade(null);
      else if (selectedToken === 'eth') setEthTrade(null);
      else setBtcTrade(null);
    }
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
          <SellNowButton onPress={handleClose} disabled={isTrading}>
            {isTrading ? (
              <ActivityIndicator size='small' color={theme.colors.background} />
            ) : (
              <SellNowText>{t('Sell now')}</SellNowText>
            )}
          </SellNowButton>
        </Row>

        <InnerCard>
          <Row $alignItems='flex-end'>
            <Column $gap={4} $alignItems='flex-start' $width='auto'>
              <Title5>
                $
                {currentValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Title5>
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
            <BodySEmphasized>
              {rektAt ? `$${rektAt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t('N/A')}
            </BodySEmphasized>
          </Row>
        </InnerCard>
        <InnerCard>
          <Row>
            <Row $gap={8} $alignItems='center' $width='auto'>
              <UsdcIcon width={20} height={20} />
              <BodyMSecondary>{t('Amount invested')}</BodyMSecondary>
            </Row>
            <BodySEmphasized>
              $
              {trade.amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </BodySEmphasized>
          </Row>
        </InnerCard>
      </Column>
    </Card>
  );
};

interface SellNowButtonProps {
  theme: DefaultTheme;
  disabled?: boolean;
}

const SellNowButton = styled(PressableOpacity)<{ disabled?: boolean }>`
  background-color: ${({ theme, disabled }: SellNowButtonProps) =>
    disabled ? theme.colors.textSecondary : theme.colors.textPrimary};
  border-radius: 100px;
  padding: 6px 12px;
  align-items: center;
  justify-content: center;
  opacity: ${({ disabled }: SellNowButtonProps) => (disabled ? 0.6 : 1)};
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
