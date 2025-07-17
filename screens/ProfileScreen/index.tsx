import { useState } from 'react';
import { Alert, FlatList, Platform, SafeAreaView } from 'react-native';

import { Column, Gap, PressableOpacity, Row, Title2 } from '@/components';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ActivityRow } from './ActivityRow';
import { Avatar } from './Avatar';
import { EditProfileModal } from './EditProfileModal';
import { NoActivity } from './NoActivity';
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
  const [view, setView] = useState<'trades' | 'minigame'>('trades');
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] =
    useState(false);
  const [userImage, setUserImage] = useState<string | number>(
    userMockData.imgSrc
  );

  const userData = {
    username: userMockData.username,
    imgSrc: userImage,
  };

  const handleLinkPress = () => {
    console.log('link');
  };

  const handleImageUpload = async (imageUri: string) => {
    try {
      setUserImage(imageUri);
      // TODO: Here you would typically upload the image to your backend
      console.log('Image uploaded:', imageUri);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        t('Error'),
        t('Failed to update profile picture. Please try again.')
      );
      // Revert to previous image on error
      setUserImage(userMockData.imgSrc);
    }
  };

  const handleImageRemoval = async () => {
    try {
      // Set to empty string to show no image state
      setUserImage('');
      // TODO: Here you would typically remove the image from your backend
      console.log('Image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert(
        t('Error'),
        t('Failed to remove profile picture. Please try again.')
      );
    }
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
            <Title2>{`@${userMockData.username}`}</Title2>
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
          ) : (
            <NoActivity />
          )}
        </Column>
      </Column>
      {isEditProfileModalVisible && (
        <EditProfileModal
          visible={isEditProfileModalVisible}
          onRequestClose={() => setIsEditProfileModalVisible(false)}
          onUploadImage={handleImageUpload}
          onRemoveImage={handleImageRemoval}
          user={userData}
        />
      )}
    </SafeAreaView>
  );
};

export default ProfileScreen;
