import { Card, Picker, ScrollRow, TokenTab } from '@/components';
import { useHomeContext } from '@/contexts';

import { PriceChart } from './PriceChart';
import styled from 'styled-components/native';

export const PriceChartCard = ({
  showLiquidation = false,
}: {
  showLiquidation?: boolean;
}) => {
  const {
    selectedToken,
    setSelectedToken,
    selectedTimeframe,
    setSelectedTimeframe,
    priceChartTimeframes,
    solTrade,
    ethTrade,
    btcTrade,
    tokenPrices,
  } = useHomeContext();

  // Get the current trade based on selected token
  const getCurrentTrade = () => {
    switch (selectedToken) {
      case 'sol':
        return solTrade;
      case 'eth':
        return ethTrade;
      case 'btc':
        return btcTrade;
      default:
        return null;
    }
  };

  const currentTrade = getCurrentTrade();

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
          price={formatPrice(tokenPrices?.sol?.current_price)}
          selected={selectedToken === 'sol'}
          onPress={() => setSelectedToken('sol')}
        />
        <TokenTab
          name='eth'
          price={formatPrice(tokenPrices?.eth?.current_price)}
          selected={selectedToken === 'eth'}
          onPress={() => setSelectedToken('eth')}
        />
        <TokenTab
          name='btc'
          price={formatPrice(tokenPrices?.btc?.current_price)}
          selected={selectedToken === 'btc'}
          onPress={() => setSelectedToken('btc')}
        />
      </ScrollRow>
      <ChartContainer>
        <PickerContainer>
          <Picker
            options={priceChartTimeframes}
            selectedValue={selectedTimeframe}
            onValueChange={setSelectedTimeframe}
          />
        </PickerContainer>
        <PriceChart showLiquidation={showLiquidation} trade={currentTrade} />
      </ChartContainer>
    </Card>
  );
};

const ChartContainer = styled.View`
  position: relative;
`;

const PickerContainer = styled.View`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
  opacity: 0.92;
`;
