import { useState } from 'react';
import { View } from 'react-native';

import {
  Column,
  PressableOpacity,
  PrimaryButton,
  Row,
  ScreenContainer,
  ScrollRow,
  SegmentContainer,
  SegmentControl,
} from '@/components';
import { useHomeContext } from '@/contexts/HomeContext';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { PerpSocialChip, PriceChartCard } from '../HomeScreen/homeComponents';
import { perpSocials } from '../HomeScreen/mockData';
import { AmountCard } from './AmountCard';
import { AmountModal } from './AmountModal';
import { SliderCard } from './SliderCard';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

export const TradeScreen = () => {
  const theme = useTheme();
  const { t } = useTranslation();
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
  const tradeSide = trade?.side ?? 'short';

  const setTradeSide = (side: 'long' | 'short') => {
    if (trade) {
      setTrade({ ...trade, side });
    }
  };

  const [amountPopupVisible, setAmountModalVisible] = useState(false);

  const entryPrice =
    selectedToken === 'sol' ? 171 : selectedToken === 'eth' ? 2568 : 109000;

  const mockTrade = {
    ...trade,
    side: tradeSide,
    entryPrice: entryPrice,
    status: 'open' as const, // <-- fix here
    amount: trade?.amount ?? 10,
    leverage: trade?.leverage ?? 1,
    timestamp: Date.now(),
  };

  const handleTrade = () => {
    // Set the trade for the selected token as active
    setTrade(mockTrade);
    router.push('/(tabs)');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        <Column
          $gap={12}
          $justifyContent='space-between'
          style={{ height: '100%' }}
        >
          <Column $gap={8}>
            <Row>
              <PressableOpacity onPress={() => router.back()}>
                <MaterialIcon
                  name='keyboard-arrow-left'
                  size={32}
                  color={theme.colors.textSecondary}
                />
              </PressableOpacity>
              <SegmentContainer>
                <SegmentControl
                  Svg={MaterialCommunityIcons}
                  svgProps={{
                    name: 'arrow-bottom-right-thin-circle-outline',
                  }}
                  label={t('Short')}
                  selected={tradeSide === 'short'}
                  onPress={() => setTradeSide('short')}
                />
                <SegmentControl
                  Svg={MaterialCommunityIcons}
                  svgProps={{ name: 'arrow-top-right-thin-circle-outline' }}
                  label={t('Long')}
                  selected={tradeSide === 'long'}
                  onPress={() => setTradeSide('long')}
                />
              </SegmentContainer>
              <View style={{ width: 32 }} />
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

            <PriceChartCard showLiquidation={true} />
          </Column>
          <Column $gap={4}>
            <AmountCard setAmountModalVisible={setAmountModalVisible} />
            <SliderCard />
          </Column>
          <PrimaryButton onPress={handleTrade}>
            {`${tradeSide.charAt(0).toUpperCase()}${tradeSide.slice(
              1
            )} ${selectedToken.toUpperCase()}`}
          </PrimaryButton>
        </Column>
      </ScreenContainer>
      {amountPopupVisible && (
        <AmountModal
          visible={amountPopupVisible}
          onClose={() => setAmountModalVisible(false)}
        />
      )}
    </>
  );
};
