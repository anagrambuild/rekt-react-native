import { useHomeContext, useMiniGameContext } from '@/contexts';

import { usePreventRemove } from '@react-navigation/native';

import {
  Column,
  Gap,
  LogoBanner,
  Row,
  ScreenContainer,
  Title4,
} from '../../components';
import { CandleChartCard } from './CandleChartCard';
import { LongButton, ShortButton } from './green-red-buttons';
import { useTranslation } from 'react-i18next';

export const MiniGameScreen = () => {
  const { t } = useTranslation();
  const { selectedToken, openPositions } = useHomeContext();
  const { makePrediction } = useMiniGameContext();

  usePreventRemove(true, () => {});

  // Check for active trades from actual open positions
  const currentPosition = openPositions.find((position) => {
    const tokenMap = { sol: 'SOL-PERP', eth: 'ETH-PERP', btc: 'BTC-PERP' };
    return position.asset === tokenMap[selectedToken as keyof typeof tokenMap];
  });

  const isActiveTrade = !!currentPosition;

  // Handle prediction selection
  const handlePrediction = (prediction: 'green' | 'red') => {
    makePrediction(prediction);
  };

  return (
    <ScreenContainer>
      <Column $gap={16}>
        <LogoBanner />

        <CandleChartCard />
      </Column>
      <Gap height={12} />
      <Column $gap={16}>
        {!isActiveTrade && (
          <Row style={{ paddingStart: 16 }}>
            <Title4>{t('Predict next candle')}</Title4>
          </Row>
        )}

        <Row $padding={0}>
          <LongButton
            onPress={() => handlePrediction('green')}
            title={t('Green')}
            subtitle={t('$1 on green candle')}
          />
          <ShortButton
            onPress={() => handlePrediction('red')}
            title={t('Red')}
            subtitle={t('$1 on red candle')}
          />
        </Row>
      </Column>
      <Gap height={4} />
    </ScreenContainer>
  );
};
