import { useState } from 'react';

import { Card, ScrollRow } from '@/components';

import { PriceChart } from './PriceChart';
import { TokenTab } from './TokenTab';

export const PriceChartCard = () => {
  const [selectedToken, setSelectedToken] = useState<string>('sol');
  return (
    <Card>
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
      <PriceChart />
    </Card>
  );
};
