import { useHomeContext } from '@/contexts';

import { usePreventRemove } from '@react-navigation/native';

import {
  Column,
  Gap,
  LogoBanner,
  Row,
  ScreenContainer,
  Title4,
} from '../../components';
import { PriceChartCard } from '../HomeScreen/PriceChartCard';
import { LongButton, ShortButton } from './green-red-buttons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const MiniGameScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    selectedToken,
    solTrade,
    setSolTrade,
    ethTrade,
    setEthTrade,
    btcTrade,
    setBtcTrade,
    openPositions,
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

  // Check for active trades - either from local state or actual open positions
  const currentPosition = openPositions.find((position) => {
    const tokenMap = { sol: 'SOL-PERP', eth: 'ETH-PERP', btc: 'BTC-PERP' };
    return position.asset === tokenMap[selectedToken as keyof typeof tokenMap];
  });

  const isActiveTrade = (trade && trade.status === 'open') || !!currentPosition;

  return (
    <ScreenContainer>
      <Column $gap={16}>
        <LogoBanner />

        <PriceChartCard showLiquidation={!!isActiveTrade} />
      </Column>
      <Gap height={12} />
      <Column $gap={16}>
        {!isActiveTrade && (
          <Row style={{ paddingStart: 16 }}>
            <Title4>{t('Ride the market')}</Title4>
          </Row>
        )}

        <Row $padding={0}>
          <LongButton
            onPress={() => {
              setTradeSide('long');
              router.push('/trade');
            }}
            title={t('Green')}
            subtitle={t('$1 on green candle')}
          />
          <ShortButton
            onPress={() => {
              setTradeSide('short');
              router.push('/trade');
            }}
            title={t('Red')}
            subtitle={t('$1 on red candle')}
          />
        </Row>
      </Column>
      <Gap height={4} />
    </ScreenContainer>
  );
};
