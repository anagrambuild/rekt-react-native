import { Platform, View } from 'react-native';

import iphoneFrame from '@/assets/images/app-pngs/iphone-frame.png';
import topNav from '@/assets/images/app-pngs/top-nav.png';
import {
  AppleGooglePayButton,
  BodyMEmphasized,
  BodySSecondary,
  Column,
  Gap,
  PresetButton,
  Row,
  ScrollRow,
  Title4,
} from '@/components';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

const googleText = 'Instant and secure, backed by Google Pay';
const appleText = 'Instant and secure, backed by Apple Pay';

const isAndroid = Platform.OS === 'android';

export const Step4 = () => {
  const { t } = useTranslation();
  const theme = useTheme();
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
        style={{
          width: '100%',
          height: 640,
          resizeMode: 'contain',
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
          style={{
            width: '100%',
            height: 60,
            resizeMode: 'contain',
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
          <Row $justifyContent='flex-start' $alignItems='center' $gap={8}>
            <MaterialIcons
              name='chevron-left'
              size={24}
              color={theme.colors.textPrimary}
            />
            <Title4>{t('Deposit')}</Title4>
          </Row>
          <Gap height={16} />
          <Column $gap={16}>
            <BodyMEmphasized>{t('Enter amount')}</BodyMEmphasized>
            <AmountInput
              value={'200.00'}
              onChangeText={() => {}}
              disabled
              editable={false}
            />
            <Gap height={16} />
            <ScrollRow $gap={8} keyboardShouldPersistTaps='always'>
              <PresetButton value={'$10'} onPress={() => {}} />
              <PresetButton value={'$50'} onPress={() => {}} />
              <PresetButton value={'$100'} onPress={() => {}} />
              <PresetButton value={'$200'} onPress={() => {}} />
              <PresetButton value={'$500'} onPress={() => {}} />
              <PresetButton value={'$1000'} onPress={() => {}} />
            </ScrollRow>
            <Gap height={16} />
            <AppleGooglePayButton />
            <Row $gap={4} $justifyContent='center'>
              <MaterialIcons
                name='lock'
                size={16}
                color={theme.colors.textSecondary}
              />
              <BodySSecondary>
                {t(isAndroid ? googleText : appleText)}
              </BodySSecondary>
            </Row>
            <Gap height={16} />
          </Column>
        </View>
      </View>
    </Column>
  );
};

const AmountInput = styled.TextInput`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
  font-family: 'Unbounded';
  font-size: 40px;
  font-weight: 500;
`;
