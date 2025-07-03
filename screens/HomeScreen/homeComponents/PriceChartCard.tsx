import { Card, Picker, ScrollRow } from '@/components';
import { useHomeContext } from '@/contexts';

import { PriceChart } from './PriceChart';
import { TokenTab } from './TokenTab';
import styled from 'styled-components/native';

export const PriceChartCard = () => {
  const {
    selectedToken,
    setSelectedToken,
    selectedTimeframe,
    setSelectedTimeframe,
    priceChartTimeframes,
  } = useHomeContext();

  return (
    <Card style={{ gap: 4 }}>
      <ScrollRow contentContainerStyle={{ gap: 4 }}>
        <TokenTab
          name='sol'
          price='100'
          selected={selectedToken === 'sol'}
          onPress={() => setSelectedToken('sol')}
        />
        <TokenTab
          name='eth'
          price='100'
          selected={selectedToken === 'eth'}
          onPress={() => setSelectedToken('eth')}
        />
        <TokenTab
          name='btc'
          price='100'
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
        <PriceChart />
      </ChartContainer>
    </Card>
  );
};

const ChartContainer = styled.View`
  position: relative;
`;

const PickerContainer = styled.View`
  position: absolute;
  top: 12;
  left: 12;
  z-index: 1;
`;
