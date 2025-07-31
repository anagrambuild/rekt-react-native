import PointsIcon from '@/assets/images/app-svgs/points.svg';
import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import RektLogo from '@/assets/images/rekt-logo.svg';
import { useHomeContext, useWallet } from '@/contexts';

import { usePreventRemove } from '@react-navigation/native';

import { Column, Gap, Row, ScreenContainer, Title4 } from '../../components';
import { AnimatedBannerRow } from './AnimatedBannerRow';
import { LiveTradeView } from './LiveTradeView';
import { LongButton, ShortButton } from './long-short-buttons';
import { perpSocials } from './mockData';
import { PriceChartCard } from './PriceChartCard';
import { TokenChip } from './TokenChip';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const HomeScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { usdcBalance, isLoadingBalance } = useWallet();
  const {
    selectedToken,
    solTrade,
    setSolTrade,
    ethTrade,
    setEthTrade,
    btcTrade,
    setBtcTrade,
  } = useHomeContext();

  usePreventRemove(true, () => {});

  // Get current trade and setter for selected token
  const trade =
    selectedToken === 'sol'
      ? solTrade
      : selectedToken === 'eth'
      ? ethTrade
      : btcTrade;

  const setTrade =
    selectedToken === 'sol'
      ? setSolTrade
      : selectedToken === 'eth'
      ? setEthTrade
      : setBtcTrade;

  // Set trade side, creating a draft trade if none exists
  const setTradeSide = (side: 'long' | 'short') => {
    if (trade) {
      setTrade({ ...trade, side });
    } else {
      // Create a new draft trade with the selected side
      setTrade({
        side,
        entryPrice: 0,
        amount: 10,
        leverage: 1,
        status: 'draft',
        isMaxLeverageOn: false,
      });
    }
  };

  const isActiveTrade = trade && trade.status === 'open';

  return (
    <ScreenContainer>
      <Column $gap={16}>
        <Column $gap={0}>
          <Row>
            <RektLogo width={60} height={60} />
            <Row $justifyContent='flex-end' $gap={16} $width='auto'>
              <TokenChip Icon={PointsIcon} value='58K' />
              <TokenChip
                Icon={UsdcIcon}
                value={
                  isLoadingBalance ? '...' : (usdcBalance || 0).toLocaleString()
                }
              />
            </Row>
          </Row>

          <AnimatedBannerRow items={perpSocials} />
        </Column>

        <PriceChartCard showLiquidation={!!isActiveTrade} />
      </Column>
      <Gap height={12} />
      <Column $gap={16}>
        {!isActiveTrade && (
          <Row style={{ paddingStart: 16 }}>
            <Title4>{t('Ride the market')}</Title4>
          </Row>
        )}
        {isActiveTrade ? (
          <LiveTradeView trade={trade} />
        ) : (
          <Row $padding={0}>
            <ShortButton
              onPress={() => {
                setTradeSide('short');
                router.push('/trade');
              }}
              title={t('Short')}
              subtitle={t('Price will go down')}
            />
            <LongButton
              onPress={() => {
                setTradeSide('long');
                router.push('/trade');
              }}
              title={t('Long')}
              subtitle={t('Price will go up')}
            />
          </Row>
        )}
      </Column>
      <Gap height={4} />
    </ScreenContainer>
  );
};
