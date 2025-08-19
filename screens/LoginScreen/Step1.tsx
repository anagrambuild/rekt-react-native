import { View } from 'react-native';

import iphoneFrame from '@/assets/images/app-pngs/iphone-frame.png';
import topNav from '@/assets/images/app-pngs/top-nav.png';
import { Column, LogoBanner, Row } from '@/components';

import { AnimatedBannerRow } from '../HomeScreen/AnimatedBannerRow';
import { perpSocials } from '../HomeScreen/mockData';
import { PriceChartCard } from '../HomeScreen/PriceChartCard';
import { Image } from 'expo-image';

export const Step1 = () => {
  return (
    <Column
      $padding={0}
      $alignItems='center'
      style={{
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden', // Add overflow hidden to clip the frame
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
          marginTop: -620, // Position content over the frame
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
        <Row style={{ paddingStart: 36, paddingEnd: 36 }}>
          <LogoBanner />
        </Row>
        <View
          style={{
            paddingStart: 32,
            paddingEnd: 32,
            overflow: 'hidden',
            width: '100%',
          }}
        >
          <AnimatedBannerRow items={perpSocials} />
          <PriceChartCard showLiquidation={false} loginScreen />
        </View>
      </View>
    </Column>
  );
};
