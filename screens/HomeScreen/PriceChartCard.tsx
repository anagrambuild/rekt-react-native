import { Card, Picker, ScrollRow, TokenTab } from '@/components';
import { useHomeContext } from '@/contexts';

import { PriceChart } from './PriceChart';
import styled from 'styled-components/native';

// Generate dummy SOL chart data for login screen that matches the design
const generateDummySolData = () => {
  const now = Date.now();
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago

  // Create data points that show realistic price movement with ups and downs but overall upward trend
  const data = [
    { value: 167.5, timestamp: oneMonthAgo },
    { value: 167.1, timestamp: oneMonthAgo + 5 * 24 * 60 * 60 * 1000 }, // Down
    { value: 168.9, timestamp: oneMonthAgo + 10 * 24 * 60 * 60 * 1000 }, // Up
    { value: 169.2, timestamp: oneMonthAgo + 15 * 24 * 60 * 60 * 1000 }, // Down
    { value: 170.6, timestamp: oneMonthAgo + 20 * 24 * 60 * 60 * 1000 }, // Up
    { value: 170.2, timestamp: oneMonthAgo + 25 * 24 * 60 * 60 * 1000 }, // Down
    { value: 171.9, timestamp: now }, // Final up
  ];

  return data;
};

export const PriceChartCard = ({
  showLiquidation = false,
  loginScreen = false,
}: {
  showLiquidation?: boolean;
  loginScreen?: boolean;
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

  // Generate dummy data for login screen
  const dummySolData = generateDummySolData();

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

  // For login screen, always show SOL data and disable token selection
  const displayToken = loginScreen ? 'sol' : selectedToken;
  const displayPrice = loginScreen
    ? '171.90'
    : formatPrice(tokenPrices?.sol?.current_price);

  return (
    <Card style={{ gap: 4 }}>
      <ScrollRow contentContainerStyle={{ gap: 4 }}>
        <TokenTab
          name='sol'
          price={
            loginScreen
              ? displayPrice
              : formatPrice(tokenPrices?.sol?.current_price)
          }
          selected={displayToken === 'sol'}
          onPress={loginScreen ? undefined : () => setSelectedToken('sol')}
          disabled={loginScreen}
        />
        <TokenTab
          name='eth'
          price={formatPrice(tokenPrices?.eth?.current_price)}
          selected={displayToken === 'eth'}
          onPress={loginScreen ? undefined : () => setSelectedToken('eth')}
          disabled={loginScreen}
        />
        <TokenTab
          name='btc'
          price={formatPrice(tokenPrices?.btc?.current_price)}
          selected={displayToken === 'btc'}
          onPress={loginScreen ? undefined : () => setSelectedToken('btc')}
          disabled={loginScreen}
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
        <PriceChart
          showLiquidation={showLiquidation}
          trade={currentTrade}
          dummyData={loginScreen ? dummySolData : undefined}
        />
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
