import { FlatList, Platform, SafeAreaView } from 'react-native';

import { Column, Gap, PressableOpacity, Row, Title2 } from '@/components';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ActivityRow } from './ActivityRow';
import { Avatar } from './Avatar';
import { ProfileHeader } from './ProfileHeader';
import { ProfileInfoCards } from './ProfileInfoCards';
import { tradeActivityMockData, userMockData } from './profileMockData';
import { TradeActivityCard } from './TradeActivityCard';
import { useTheme } from 'styled-components/native';

const screenPadding = 20;
const paddingTop = Platform.OS === 'ios' ? 0 : 30;

export const ProfileScreen = () => {
  const theme = useTheme();
  const handleLinkPress = () => {
    console.log('link');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Column
        $padding={screenPadding}
        style={{ marginTop: paddingTop, flex: 1, paddingBottom: 0 }}
      >
        <ProfileHeader />
        <Gap height={12} />
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
          <Gap height={2} />
          <ActivityRow />
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
