import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import iphoneFrame from '@/assets/images/app-pngs/iphone-frame.png';
import topNav from '@/assets/images/app-pngs/top-nav.png';
import { Column } from '@/components';

import { AmountCard } from '../TradeScreen/AmountCard';
import { SliderCard } from '../TradeScreen/SliderCard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

export const Step2 = () => {
  const [leverage, setLeverage] = useState(100);
  const [amount, setAmount] = useState(10);

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

  return (
    <Column
      $padding={0}
      $alignItems='center'
      style={{
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* iPhone Frame as background wrapper */}
      <Image
        source={iphoneFrame}
        contentFit='contain'
        style={{
          width: '100%',
          height: 640,
          alignSelf: 'stretch',
        }}
      />

      {/* Content positioned inside the frame */}
      <View
        style={{
          marginTop: -620,
          left: 0,
          right: 0,
          zIndex: 1000,
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Image
          source={topNav}
          contentFit='contain'
          style={{
            width: '95%',
            height: 60,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            paddingStart: 32,
            paddingEnd: 32,
            overflow: 'hidden',
            width: '100%',
            marginTop: 64,
            gap: 16,
          }}
        >
          <AmountCard amount={amount} setAmount={setAmount} />
          <SliderCard
            leverage={leverage}
            amount={amount}
            loginScreen
            setLeverage={setLeverage}
          />
        </View>
      </View>
    </Column>
  );
};
