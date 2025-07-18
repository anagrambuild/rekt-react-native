import { FlatList, Platform, SafeAreaView } from 'react-native';

import { Column, Gap, PressableOpacity, Row, Title2 } from '@/components';
import { useProfileContext } from '@/contexts';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ActivityRow } from './ActivityRow';
import { Avatar } from './Avatar';
import { EditProfileModal } from './EditProfileModal';
import { NoActivity } from './NoActivity';
import { OnOffRampModal } from './OnOffRampModal';
import { ProfileHeader } from './ProfileHeader';
import { ProfileInfoCards } from './ProfileInfoCards';
import { detailedTradeData } from './profileMockData';
import { TradeActivityModal } from './TradeAcivityModal';
import { TradeActivityCard } from './TradeActivityCard';
import { useTheme } from 'styled-components/native';

const screenPadding = 20;
const paddingTop = Platform.OS === 'ios' ? 0 : 30;

export const ProfileScreen = () => {
  const theme = useTheme();
  const {
    view,
    setView,
    isEditProfileModalVisible,
    setIsEditProfileModalVisible,
    isTradeActivityModalVisible,
    setIsTradeActivityModalVisible,
    setSelectedTrade,
    userImage,
    userData,
    handleLinkPress,
    isOnOffRampModalVisible,
  } = useProfileContext();

  const handleTradePress = (index: number) => {
    const selectedTrade = detailedTradeData[index];
    setSelectedTrade(selectedTrade);
    setIsTradeActivityModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Column
        $padding={screenPadding}
        style={{ marginTop: paddingTop, flex: 1, paddingBottom: 4 }}
      >
        <ProfileHeader
          setIsEditProfileModalVisible={setIsEditProfileModalVisible}
        />
        <Gap height={12} />
        <Column $gap={12} style={{ flex: 1 }}>
          <Avatar imgSrc={userImage} />
          <Row $gap={6} $alignItems='center' $width='auto'>
            <Title2>{`@${userData.username}`}</Title2>
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
          <ActivityRow view={view} setView={setView} />
          {view === 'trades' ? (
            <FlatList
              data={detailedTradeData}
              keyExtractor={(_, idx) => idx.toString()}
              renderItem={({ item, index }) => (
                <PressableOpacity onPress={() => handleTradePress(index)}>
                  <TradeActivityCard {...item} />
                </PressableOpacity>
              )}
              contentContainerStyle={{
                gap: 4,
                paddingBottom: 12,
              }}
              style={{ width: '100%' }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <NoActivity />
          )}
        </Column>
      </Column>
      {isEditProfileModalVisible && (
        <EditProfileModal
          visible={isEditProfileModalVisible}
          onRequestClose={() => setIsEditProfileModalVisible(false)}
        />
      )}
      {isTradeActivityModalVisible && <TradeActivityModal />}
      {isOnOffRampModalVisible && <OnOffRampModal />}
    </SafeAreaView>
  );
};

export default ProfileScreen;
