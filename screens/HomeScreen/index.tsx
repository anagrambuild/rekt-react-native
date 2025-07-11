import RektLogo from '@/assets/images/rekt-logo.svg';
import {
  Column,
  Gap,
  Row,
  ScreenContainer,
  ScrollRow,
  Title4,
} from '@/components';
import { useHomeContext } from '@/contexts';

import {
  LongButton,
  PerpSocialChip,
  PriceChartCard,
  ShortButton,
  TokenChip,
} from './homeComponents';
import { LiveTradeView } from './homeComponents/LiveTradeView';
import type { PnlState } from './homeComponents/PriceChart';
import { perpSocials, tokens } from './mockData';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const HomeScreen = () => {
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
  } = useHomeContext();

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

  // Default to 'short' if no trade yet
  const setTradeSide = (side: 'long' | 'short') => {
    if (trade) {
      setTrade({ ...trade, side });
    }
    // Do not create a new trade here; only update if one exists
  };

  const isActiveTrade = trade && trade.status === 'open';

  // Mock PnL state: profit for long, loss for short, neutral if no trade
  let pnlState: PnlState = 'neutral';
  if (isActiveTrade) {
    pnlState = trade.side === 'long' ? 'profit' : 'loss';
  }

  return (
    <ScreenContainer>
      <Column $gap={16}>
        <Column $gap={0}>
          <Row>
            <RektLogo width={60} height={60} />
            <Row $justifyContent='flex-end' $gap={16} $width='auto'>
              {tokens.map((token) => (
                <TokenChip
                  key={token.id}
                  imgSrc={token.imgSrc}
                  value={token.value}
                />
              ))}
            </Row>
          </Row>

          <ScrollRow contentContainerStyle={{ gap: 16 }}>
            {perpSocials.map((perpSocial) => (
              <PerpSocialChip
                key={perpSocial.id}
                imgSrc={perpSocial.imgSrc}
                position={perpSocial.position}
                meta={perpSocial.meta}
                earningMultiple={perpSocial.earningMultiple}
              />
            ))}
          </ScrollRow>
        </Column>

        <PriceChartCard showLiquidation={!!isActiveTrade} pnlState={pnlState} />
      </Column>
      <Gap height={24} />
      <Column $gap={16}>
        <Row style={{ paddingStart: 16 }}>
          <Title4>{t('Ride the market')}</Title4>
        </Row>
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
    </ScreenContainer>
  );
};
