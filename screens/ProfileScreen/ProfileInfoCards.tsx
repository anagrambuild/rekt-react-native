import PointsIcon from '@/assets/images/app-svgs/points.svg';
import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import {
  Body1,
  BodySSecondary,
  BodyXSMonoSecondary,
  Card,
  Column,
  PressableOpacity,
  Row,
} from '@/components';
import { useHomeContext, useProfileContext, useWallet } from '@/contexts';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

const iconSize = 20;
const borderRadius = 8;

export const ProfileInfoCards = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { tradingHistory } = useHomeContext();

  // Calculate totals from actual trading history data
  const totalPnl = tradingHistory.reduce(
    (sum, position) => sum + position.pnl,
    0
  );
  const totalPoints = tradingHistory.reduce(
    (sum, position) => sum + (position.points || 0),
    0
  );
  const isProfit = totalPnl > 0;
  const { setIsOnOffRampModalVisible } = useProfileContext();
  const { usdcBalance, isLoadingBalance } = useWallet();
  return (
    <Column $gap={6}>
      <PressableOpacity
        style={{ width: '100%' }}
        onPress={() => setIsOnOffRampModalVisible(true)}
      >
        <Card>
          <Column $alignItems='flex-start' $padding={16} $gap={8}>
            <BodyXSMonoSecondary>
              {t('Balance').toUpperCase()}
            </BodyXSMonoSecondary>
            <Row $gap={6} $width='auto'>
              <Body1>
                {isLoadingBalance ? '...' : (usdcBalance || 0).toLocaleString()}
              </Body1>
              <UsdcIcon width={iconSize} height={iconSize} />
            </Row>
          </Column>
        </Card>
      </PressableOpacity>

      <Row
        $gap={8}
        $padding={0}
        $justifyContent='space-between'
        $alignItems='stretch'
      >
        <Card style={{ flex: 1, borderRadius }}>
          <Column $alignItems='flex-start' $padding={16} $gap={8} $width='auto'>
            <BodyXSMonoSecondary>
              {t('24H P&L').toUpperCase()}
            </BodyXSMonoSecondary>
            <Row $gap={6} $width='auto'>
              <Body1
                style={{
                  color: isProfit ? theme.colors.profit : theme.colors.loss,
                }}
              >
                {totalPnl.toFixed(2)}%
              </Body1>
              <PnL isProfit={isProfit} />
            </Row>
          </Column>
        </Card>

        <Card style={{ flex: 1, borderRadius }}>
          <Column $alignItems='flex-start' $padding={16} $gap={8} $width='auto'>
            <BodyXSMonoSecondary>
              {t('Points').toUpperCase()}
            </BodyXSMonoSecondary>
            <Row $gap={6} $width='auto'>
              <Body1>{totalPoints.toLocaleString()}</Body1>
              <PointsIcon width={iconSize} height={iconSize} />
            </Row>
          </Column>
        </Card>

        <Card style={{ flex: 0.5, borderRadius }}>
          <PressableOpacity>
            <Column $padding={16} $gap={8} $width='auto'>
              <BodyXSMonoSecondary>
                {t('More').toUpperCase()}
              </BodyXSMonoSecondary>
              <MaterialIcons
                name='chevron-right'
                size={16}
                color={theme.colors.textSecondary}
              />
            </Column>
          </PressableOpacity>
        </Card>
      </Row>
    </Column>
  );
};

const PnLContainer = styled.View`
  align-items: center;
  justify-content: center;
  width: ${iconSize}px;
  height: ${iconSize}px;
  background-color: ${({
    theme,
    $isProfit,
  }: {
    theme: DefaultTheme;
    $isProfit: boolean;
  }) => ($isProfit ? theme.colors.profitBg : theme.colors.lossBg)};
  border-color: ${({
    theme,
    $isProfit,
  }: {
    theme: DefaultTheme;
    $isProfit: boolean;
  }) => ($isProfit ? theme.colors.borderProfit : theme.colors.borderLoss)};
  border-width: 1px;
  border-radius: ${iconSize / 2}px;
`;

export const PnL = ({ isProfit }: { isProfit: boolean }) => {
  const theme = useTheme();
  return (
    <PnLContainer $isProfit={isProfit}>
      <BodySSecondary
        style={{
          color: isProfit ? theme.colors.profit : theme.colors.loss,
        }}
      >
        {isProfit ? 'P' : 'L'}
      </BodySSecondary>
    </PnLContainer>
  );
};
