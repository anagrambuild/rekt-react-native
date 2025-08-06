import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  View,
} from 'react-native';

import { Column, Gap, PressableOpacity, Row, Title2 } from '@/components';
import { useHomeContext, useProfileContext } from '@/contexts';
import { Position } from '@/utils/backendApi';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ActivityRow } from './ActivityRow';
import { Avatar } from './Avatar';
import { EditProfileModal } from './EditProfileModal';
import { NoActivity } from './NoActivity';
import { OnOffRampModal } from './OnOffRampModal';
import { ProfileHeader } from './ProfileHeader';
import { ProfileInfoCards } from './ProfileInfoCards';
import { TradeActivityModal } from './TradeAcivityModal';
import { TradeActivityCard } from './TradeActivityCard';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';
import { Toast } from 'toastify-react-native';

const screenPadding = 20;
const paddingTop = Platform.OS === 'ios' ? 0 : 30;

export const ProfileScreen = () => {
  const { t } = useTranslation();
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
    isUserLoading,
    isOnOffRampModalVisible,
  } = useProfileContext();

  const { tradingHistory, isLoadingHistory } = useHomeContext();

  // Map Position to TradeActivityCard props
  const mapPositionToTradeCard = (position: Position) => {
    // Extract symbol from asset (e.g., "SOL-PERP" -> "sol")
    const symbol = position.asset.split('-')[0].toLowerCase() as
      | 'btc'
      | 'eth'
      | 'sol';

    // Format duration from seconds to readable format
    const formatDuration = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days} ${t(days > 1 ? 'DAYS' : 'DAY')}`;
      if (hours > 0) return `${hours} ${t(hours > 1 ? 'HRS' : 'HR')}`;
      if (minutes > 0) return `${minutes} ${t(minutes > 1 ? 'MINS' : 'MIN')}`;
      return `${seconds} ${t(seconds !== 1 ? 'SECS' : 'SEC')}`;
    };
    return {
      type: position.direction as 'long' | 'short',
      symbol,
      amount: position.marginUsed,
      leverage: position.leverage,
      percentage: position.pnlPercentage,
      isProfit: position.pnl > 0,
      // Additional fields for DetailedTradeData compatibility
      entryPrice: position.entryPrice,
      exitPrice: position.exitPrice || position.currentPrice,
      entryTime: new Date(position.openedAt)
        .toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
        .toUpperCase(),
      exitTime: position.closedAt
        ? new Date(position.closedAt)
            .toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
            .toUpperCase()
        : 'OPEN',
      duration:
        position.status === 'open'
          ? t('ONGOING')
          : formatDuration(position.duration),
      profitAmount: position.pnl,
    };
  };

  const handleTradePress = (index: number) => {
    const selectedTrade = mapPositionToTradeCard(tradingHistory[index]);
    setSelectedTrade(selectedTrade);
    setIsTradeActivityModalVisible(true);
  };

  const handleLinkPress = async () => {
    Toast.success('Link pressed');
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
            <Title2>{isUserLoading ? '@...' : `@${userData.username}`}</Title2>
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
            isLoadingHistory ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator
                  size='small'
                  color={theme.colors.textSecondary}
                />
              </View>
            ) : (
              <FlatList
                data={tradingHistory}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => {
                  const mappedItem = mapPositionToTradeCard(item);
                  return (
                    <PressableOpacity onPress={() => handleTradePress(index)}>
                      <TradeActivityCard {...mappedItem} />
                    </PressableOpacity>
                  );
                }}
                contentContainerStyle={{
                  gap: 4,
                  paddingBottom: 12,
                }}
                style={{ width: '100%' }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<NoActivity />}
              />
            )
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
