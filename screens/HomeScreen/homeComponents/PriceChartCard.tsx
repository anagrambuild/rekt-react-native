import { useState } from 'react';

import { Card, Row } from '@/components';

import { TokenTab } from './TokenTab';

export const PriceChartCard = () => {
  const [selectedToken, setSelectedToken] = useState<string>('sol');
  return (
    <Card>
      <Row gap={8} $alignItems='space-between'>
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
      </Row>
    </Card>
  );
};
