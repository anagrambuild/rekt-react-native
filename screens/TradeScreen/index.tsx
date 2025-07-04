import { Pressable, View } from 'react-native';

import {
  Column,
  Gap,
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
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';
export const TradeScreen = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { tradeSide, setTradeSide } = useHomeContext();
  console.log(tradeSide);
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        <Column $gap={16}>
          <Row>
            <Pressable onPress={() => router.back()}>
              <MaterialIcon
                name='keyboard-arrow-left'
                size={32}
                color={theme.colors.textSecondary}
              />
            </Pressable>
            <SegmentContainer>
              <SegmentControl
                Svg={MaterialCommunityIcons}
                svgProps={{ name: 'arrow-bottom-right-thin-circle-outline' }}
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

          <PriceChartCard />
          <Gap />
        </Column>
      </ScreenContainer>
    </>
  );
};
