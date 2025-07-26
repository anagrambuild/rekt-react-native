import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useWallet } from '@/contexts/WalletContext';
import { getSessionInfo, refreshSecureAuthTimestamp } from '@/utils/secureAuth';

import { useTranslation } from 'react-i18next';

export interface SessionInfo {
  lastLogin?: Date;
  daysRemaining?: number;
  isExpiringSoon?: boolean;
}

export const useSessionManager = () => {
  const { t } = useTranslation();
  const { connected, disconnect } = useWallet();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle session expiration
  const handleSessionExpired = useCallback(async () => {
    try {
      disconnect();
      Alert.alert(
        t('Session Expired'),
        t('Your session has expired. Please reconnect your wallet.'),
        [{ text: t('OK') }]
      );
    } catch (error) {
      console.error('Error handling session expiration:', error);
    }
  }, [disconnect, t]);

  // Check session info
  const checkSession = useCallback(async () => {
    if (!connected) return;

    try {
      setIsLoading(true);
      const info = await getSessionInfo();
      setSessionInfo(info);

      // Show warning if session is expiring soon
      if (info?.isExpiringSoon && info.daysRemaining !== undefined) {
        if (info.daysRemaining === 0) {
          Alert.alert(
            t('Session Expiring'),
            t(
              'Your session expires today. Please reconnect your wallet to continue using the app.'
            ),
            [
              { text: t('Later'), style: 'cancel' },
              { text: t('Reconnect'), onPress: () => handleSessionExpired() },
            ]
          );
        } else {
          Alert.alert(
            t('Session Expiring Soon'),
            t(
              'Your session expires in {{days}} day(s). Consider reconnecting your wallet.',
              {
                days: info.daysRemaining,
              }
            ),
            [
              { text: t('Later'), style: 'cancel' },
              {
                text: t('Refresh Session'),
                onPress: async () => {
                  setIsLoading(true);
                  const success = await refreshSecureAuthTimestamp();
                  if (success) {
                    await checkSession();
                    Alert.alert(
                      t('Session Refreshed'),
                      t('Your session has been extended.')
                    );
                  } else {
                    Alert.alert(
                      t('Refresh Failed'),
                      t(
                        'Unable to refresh session. Please reconnect your wallet.'
                      )
                    );
                  }
                  setIsLoading(false);
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [connected, t, handleSessionExpired]);

  // Refresh session timestamp
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const success = await refreshSecureAuthTimestamp();
      if (success) {
        await checkSession();
        Alert.alert(
          t('Session Refreshed'),
          t('Your session has been extended.')
        );
      } else {
        Alert.alert(
          t('Refresh Failed'),
          t('Unable to refresh session. Please reconnect your wallet.')
        );
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      Alert.alert(
        t('Refresh Failed'),
        t('Unable to refresh session. Please reconnect your wallet.')
      );
    } finally {
      setIsLoading(false);
    }
  }, [t, checkSession]);

  // Periodic session check (every 30 minutes)
  useEffect(() => {
    if (!connected) return;

    // Initial check
    checkSession();

    // Set up periodic checks
    const interval = setInterval(() => {
      checkSession();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [connected, checkSession]);

  return {
    sessionInfo,
    isLoading,
    checkSession,
    refreshSession,
    handleSessionExpired,
  };
};
