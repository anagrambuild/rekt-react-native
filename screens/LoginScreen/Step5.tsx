import { View } from 'react-native';

import iphoneFrame from '@/assets/images/app-pngs/iphone-frame.png';
import topNav from '@/assets/images/app-pngs/top-nav.png';
import { Column } from '@/components';

import { Balance } from '../ProfileScreen/OnOffRampModal/Balance';
import { Image } from 'expo-image';

export const Step5 = () => {
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
            marginTop: 24,
            gap: 16,
          }}
        >
          <Balance setView={() => {}} loginScreen />
        </View>
      </View>
    </Column>
  );
};
