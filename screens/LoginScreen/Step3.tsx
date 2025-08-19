import { View } from 'react-native';

import iphoneFrame from '@/assets/images/app-pngs/iphone-frame.png';
import topNav from '@/assets/images/app-pngs/top-nav.png';
import { Column, Title4 } from '@/components';
import { renderTopThree } from '@/screens/LeaderboardScreen';

import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

export const Step3 = () => {
  const { t } = useTranslation();

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
            marginTop: 8,
            gap: 16,
          }}
        >
          <Title4>{t('Leaderboard')}</Title4>
          {renderTopThree()}
        </View>
      </View>
    </Column>
  );
};
