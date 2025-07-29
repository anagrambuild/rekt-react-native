import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { highFireUrl, lowFireUrl, midFireUrl } from '@/assets/videos';
import {
  Column,
  PressableOpacity,
  PrimaryButton,
  Row,
  ScreenContainer,
  SegmentContainer,
  SegmentControl,
} from '@/components';
import { useHomeContext } from '@/contexts/HomeContext';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { AnimatedBannerRow } from '../HomeScreen/AnimatedBannerRow';
import { perpSocials } from '../HomeScreen/mockData';
import { PriceChartCard } from '../HomeScreen/PriceChartCard';
import { AmountCard } from './AmountCard';
import { AmountModal } from './AmountModal';
import { SliderCard } from './SliderCard';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
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
    router.replace('/');
  };

  // Select video based on leverage
  const leverage = trade?.leverage ?? 1;
  let videoLevel: 'low' | 'mid' | 'high' = 'low';
  if (leverage > 100) {
    videoLevel = 'high';
  } else if (leverage > 50) {
    videoLevel = 'mid';
  }

  // Haptic feedback on leverage increase
  const prevLeverageRef = useRef(leverage);
  useEffect(() => {
    if (leverage > prevLeverageRef.current) {
      if (leverage > 100) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (leverage > 50) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    prevLeverageRef.current = leverage;
  }, [leverage]);

  // Always call all three hooks
  const lowPlayer = useVideoPlayer(lowFireUrl, (player) => {
    player.loop = true;
    player.play();
  });
  const midPlayer = useVideoPlayer(midFireUrl, (player) => {
    player.loop = true;
    player.play();
  });
  const highPlayer = useVideoPlayer(highFireUrl, (player) => {
    player.loop = true;
    player.play();
  });

  let player;
  if (videoLevel === 'low') {
    player = lowPlayer;
  } else if (videoLevel === 'mid') {
    player = midPlayer;
  } else {
    player = highPlayer;
  }

  return (
    <>
      {/* Render the background video absolutely at the bottom half of the screen */}
      <VideoView
        player={player}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '50%',
        }}
        pointerEvents='none'
        nativeControls={false}
      />
      <View style={{ flex: 1, position: 'relative' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenContainer
          style={{ height: '100%', backgroundColor: 'transparent' }}
          noPadding
          contentContainerStyle={{
            position: 'relative',
            paddingBottom: 80,
            marginTop: 50,
          }}
        >
          <Column $padding={16} $gap={12} style={{ height: '100%' }}>
            <Column>
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

              <AnimatedBannerRow items={perpSocials} />

              <PriceChartCard showLiquidation={true} />
            </Column>
            <Column $gap={4}>
              <AmountCard setAmountModalVisible={setAmountModalVisible} />
              <SliderCard />
            </Column>
          </Column>
        </ScreenContainer>
        {/* Button container absolutely positioned above the video area */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingBottom: 24,
            zIndex: 10,
          }}
        >
          <PrimaryButton onPress={handleTrade}>
            {`${tradeSide.charAt(0).toUpperCase()}${tradeSide.slice(
              1
            )} ${selectedToken.toUpperCase()}`}
          </PrimaryButton>
        </View>
        {amountPopupVisible && (
          <AmountModal
            visible={amountPopupVisible}
            onClose={() => setAmountModalVisible(false)}
          />
        )}
      </View>
    </>
  );
};
