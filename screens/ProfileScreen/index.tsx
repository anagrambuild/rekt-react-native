import { FlatList, Platform, SafeAreaView } from 'react-native';

import DiceIcon from '@/assets/images/app-svgs/dice.svg';
import FireIcon from '@/assets/images/app-svgs/fire.svg';
import TradeIcon from '@/assets/images/app-svgs/trade.svg';
import {
  Card,
  Column,
  PressableOpacity,
  Row,
  SegmentContainer,
  SegmentControl,
  Title2,
  Title4,
} from '@/components';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Avatar } from './Avatar';
import { ProfileHeader } from './ProfileHeader';
import { ProfileInfoCards } from './ProfileInfoCards';
import { tradeActivityMockData, userMockData } from './profileMockData';
import { TradeActivityCard } from './TradeActivityCard';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

const screenPadding = 20;
const paddingTop = Platform.OS === 'ios' ? 0 : 30;

export const ProfileScreen = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const handleLinkPress = () => {
    console.log('link');
  };
  // TODO - break Activity Row to its own file
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Column
        $padding={screenPadding}
        style={{ marginTop: paddingTop, flex: 1, paddingBottom: 0 }}
      >
        <ProfileHeader />
        <Column $gap={12} style={{ flex: 1 }}>
          <Avatar imgSrc={userMockData.imgSrc} />
          <Row $gap={6} $alignItems='center' $width='auto'>
            <Title2>{userMockData.username}</Title2>
            <PressableOpacity onPress={handleLinkPress}>
              <MaterialCommunityIcons
                name='link-variant'
                size={24}
                color={theme.colors.textSecondary}
              />
            </PressableOpacity>
          </Row>
          <ProfileInfoCards />
          <Row $justifyContent='space-between'>
            <Row $width='auto' $gap={4}>
              <Title4>{t('Activity')}</Title4>
              <Card
                style={{
                  borderRadius: 8,
                  width: 'auto',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: theme.colors.cardEmphasized,
                  paddingStart: 12,
                  paddingEnd: 12,
                }}
              >
                <FireIcon width={24} height={24} />
                <Title4 style={{ fontSize: 12 }}>2x</Title4>
              </Card>
            </Row>
            <SegmentContainer>
              <SegmentControl
                Svg={TradeIcon}
                selected={true}
                onPress={() => {}}
              />
              <SegmentControl
                Svg={DiceIcon}
                selected={false}
                onPress={() => {}}
              />
            </SegmentContainer>
          </Row>
          <FlatList
            data={tradeActivityMockData}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => <TradeActivityCard {...item} />}
            contentContainerStyle={{
              gap: 4,
              paddingBottom: 12,
            }}
            style={{ width: '100%' }}
            showsVerticalScrollIndicator={false}
          />
        </Column>
      </Column>
    </SafeAreaView>
  );
};

export default ProfileScreen;
