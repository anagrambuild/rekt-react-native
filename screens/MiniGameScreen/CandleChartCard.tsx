import { Card, ScrollRow, TokenTab } from '@/components';
import { useMiniGameContext } from '@/contexts';

import { CandleChart } from './CandleChart';
import styled from 'styled-components/native';

export const CandleChartCard = () => {
  const { gameState, selectedToken, setSelectedToken } = useMiniGameContext();

  // Format price for display
  const formatPrice = (price: number | undefined) => {
    if (!price) return '---';
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`;
    }
    return price.toFixed(0);
  };

  return (
    <Card style={{ gap: 4 }}>
      <ScrollRow contentContainerStyle={{ gap: 4 }}>
        <TokenTab
          name='sol'
          price={formatPrice(gameState.tokenPrices.sol.current_price)}
          selected={selectedToken === 'sol'}
          onPress={() => setSelectedToken('sol')}
        />
        <TokenTab
          name='eth'
          price={formatPrice(gameState.tokenPrices.eth.current_price)}
          selected={selectedToken === 'eth'}
          onPress={() => setSelectedToken('eth')}
        />
        <TokenTab
          name='btc'
          price={formatPrice(gameState.tokenPrices.btc.current_price)}
          selected={selectedToken === 'btc'}
          onPress={() => setSelectedToken('btc')}
        />
      </ScrollRow>
      <ChartContainer>
        <CandleChart />
      </ChartContainer>
    </Card>
  );
};

const ChartContainer = styled.View`
  position: relative;
`;


