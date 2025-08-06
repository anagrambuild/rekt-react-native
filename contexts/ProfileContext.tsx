import { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { getSecureAuth } from '@/utils/secureAuth';

import { useWallet } from './WalletContext';
import { useTranslation } from 'react-i18next';

// DetailedTradeData type moved inline since we no longer use mock data
interface DetailedTradeData {
  type: 'long' | 'short';
  symbol: 'btc' | 'eth' | 'sol';
  amount: number;
  leverage: number;
  percentage: number;
  isProfit: boolean;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  duration: string;
  profitAmount: number;
}

export interface User {
  username: string;
  imgSrc: string | number;
  balance: number;
}

interface ProfileContextType {
  view: 'trades' | 'minigame';
  setView: (view: 'trades' | 'minigame') => void;
  isEditProfileModalVisible: boolean;
  setIsEditProfileModalVisible: (visible: boolean) => void;
  isTradeActivityModalVisible: boolean;
  setIsTradeActivityModalVisible: (visible: boolean) => void;
  selectedTrade: DetailedTradeData | null;
  setSelectedTrade: (trade: DetailedTradeData | null) => void;
  userImage: string | number;
  setUserImage: (image: string | number) => void;
  userData: User;
  handleImageUpload: (imageUri: string) => Promise<void>;
  handleImageRemoval: () => Promise<void>;
  isOnOffRampModalVisible: boolean;
  setIsOnOffRampModalVisible: (visible: boolean) => void;
  handleTransferIn: () => void;
  handleCardPayment: () => void;
  handleWithdraw: () => void;
  handleHistory: () => void;
  profileId: string | null;
  isUserLoading: boolean;
  withdrawalAddress: string;
  setWithdrawalAddress: (address: string) => void;
  withdrawalAmount: string;
  setWithdrawalAmount: (amount: string) => void;
}

export const ProfileContext = createContext<ProfileContextType>({
  view: 'trades',
  setView: () => {},
  isEditProfileModalVisible: false,
  setIsEditProfileModalVisible: () => {},
  isTradeActivityModalVisible: false,
  setIsTradeActivityModalVisible: () => {},
  selectedTrade: null,
  setSelectedTrade: () => {},
  userImage: '',
  setUserImage: () => {},
  userData: { username: '', imgSrc: '', balance: 0 },
  handleImageUpload: async () => {},
  handleImageRemoval: async () => {},
  isOnOffRampModalVisible: false,
  setIsOnOffRampModalVisible: () => {},
  handleTransferIn: () => {},
  handleCardPayment: () => {},
  handleWithdraw: () => {},
  handleHistory: () => {},
  profileId: null,
  isUserLoading: false,
  withdrawalAddress: '',
  setWithdrawalAddress: () => {},
  withdrawalAmount: '',
  setWithdrawalAmount: () => {},
});

export const useProfileContext = () => {
  return useContext(ProfileContext);
};

export const ProfileProvider = ({
  children,
  userProfile,
}: {
  children: React.ReactNode;
  userProfile: any | null;
}) => {
  const { t } = useTranslation();
  const { usdcBalance } = useWallet();
  const [view, setView] = useState<'trades' | 'minigame'>('trades');
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] =
    useState(false);
  const [isTradeActivityModalVisible, setIsTradeActivityModalVisible] =
    useState(false);
  const [selectedTrade, setSelectedTrade] = useState<DetailedTradeData | null>(
    null
  );
  const [isOnOffRampModalVisible, setIsOnOffRampModalVisible] = useState(false);

  // State for profile ID and user data
  const [profileId, setProfileId] = useState<string | null>(null);
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  // Fetch profile ID from secure storage
  useEffect(() => {
    const getProfileId = async () => {
      try {
        const authResult = await getSecureAuth();
        if (authResult.isValid && authResult.data?.profileId) {
          setProfileId(authResult.data.profileId);
        }
      } catch (error) {
        console.error('Error getting profile ID:', error);
      }
    };
    getProfileId();
  }, []);

  // User image state - start with userProfile image or empty string
  const [userImage, setUserImage] = useState<string | number>(
    userProfile?.profileImage || ''
  );

  // Update user image when userProfile data changes
  useEffect(() => {
    if (userProfile?.profileImage) {
      setUserImage(userProfile.profileImage);
    }
  }, [userProfile?.profileImage]);

  // Reset internal state when userProfile becomes null (on logout)
  // OR refetch profileId when userProfile is set (on login/signup)
  useEffect(() => {
    if (!userProfile) {
      // User logged out - reset everything
      setProfileId(null);
      setUserImage('');
      setView('trades');
      setIsEditProfileModalVisible(false);
      setIsTradeActivityModalVisible(false);
      setSelectedTrade(null);
      setIsOnOffRampModalVisible(false);
      setWithdrawalAddress('');
      setWithdrawalAmount('');
    } else {
      // User logged in or new user created - refetch profileId from secure storage
      const refetchProfileId = async () => {
        try {
          const authResult = await getSecureAuth();
          if (authResult.isValid && authResult.data?.profileId) {
            setProfileId(authResult.data.profileId);
          }
        } catch (error) {
          console.error('Error refetching profile ID:', error);
        }
      };
      refetchProfileId();
    }
  }, [userProfile]);

  const userData: User = {
    username: userProfile?.username || '',
    imgSrc: userImage,
    balance: usdcBalance || 0,
  };

  // Determine if user data is still loading
  const isUserLoading = !userProfile;

  const handleImageUpload = async (imageUri: string) => {
    try {
      setUserImage(imageUri);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        t('Error'),
        t('Failed to update profile picture. Please try again.')
      );
      // Revert to previous image on error
      setUserImage(userProfile?.profileImage || '');
    }
  };

  const handleImageRemoval = async () => {
    try {
      // Set to empty string to show no image state
      setUserImage('');
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert(
        t('Error'),
        t('Failed to remove profile picture. Please try again.')
      );
    }
  };

  const handleTransferIn = () => {
    // Handle transfer-in logic
    console.log('Transfer-in pressed');
  };

  const handleCardPayment = () => {
    // Handle card/Apple Pay logic
    console.log('Card/Apple Pay pressed');
  };

  const handleWithdraw = () => {
    // Handle withdraw logic
    console.log('Withdraw pressed');
  };

  const handleHistory = () => {
    // Handle history logic
    console.log('History pressed');
  };

  return (
    <ProfileContext.Provider
      value={{
        view,
        setView,
        isEditProfileModalVisible,
        setIsEditProfileModalVisible,
        isTradeActivityModalVisible,
        setIsTradeActivityModalVisible,
        selectedTrade,
        setSelectedTrade,
        userImage,
        setUserImage,
        userData,
        handleImageUpload,
        handleImageRemoval,
        isOnOffRampModalVisible,
        setIsOnOffRampModalVisible,
        handleTransferIn,
        handleCardPayment,
        handleWithdraw,
        handleHistory,
        profileId,
        isUserLoading,
        withdrawalAddress,
        setWithdrawalAddress,
        withdrawalAmount,
        setWithdrawalAmount,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
