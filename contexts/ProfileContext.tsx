import { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

import { userMockData } from '@/screens/ProfileScreen/profileMockData';

import { useTranslation } from 'react-i18next';

export interface User {
  username: string;
  imgSrc: string | number;
}

interface ProfileContextType {
  view: 'trades' | 'minigame';
  setView: (view: 'trades' | 'minigame') => void;
  isEditProfileModalVisible: boolean;
  setIsEditProfileModalVisible: (visible: boolean) => void;
  userImage: string | number;
  setUserImage: (image: string | number) => void;
  userData: User;
  handleImageUpload: (imageUri: string) => Promise<void>;
  handleImageRemoval: () => Promise<void>;
  handleLinkPress: () => void;
}

export const ProfileContext = createContext<ProfileContextType>({
  view: 'trades',
  setView: () => {},
  isEditProfileModalVisible: false,
  setIsEditProfileModalVisible: () => {},
  userImage: '',
  setUserImage: () => {},
  userData: { username: '', imgSrc: '' },
  handleImageUpload: async () => {},
  handleImageRemoval: async () => {},
  handleLinkPress: () => {},
});

export const useProfileContext = () => {
  return useContext(ProfileContext);
};

export const ProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const [view, setView] = useState<'trades' | 'minigame'>('trades');
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] =
    useState(false);
  const [userImage, setUserImage] = useState<string | number>(
    userMockData.imgSrc
  );

  const userData: User = {
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
    <ProfileContext.Provider
      value={{
        view,
        setView,
        isEditProfileModalVisible,
        setIsEditProfileModalVisible,
        userImage,
        setUserImage,
        userData,
        handleImageUpload,
        handleImageRemoval,
        handleLinkPress,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
