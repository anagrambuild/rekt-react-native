import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { supabase } from '@/utils/supabase';
import { getCurrentUser } from '@/utils/supabaseApi';

import { useTranslation } from 'react-i18next';

export const useSessionManager = () => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert(t('Error'), t('Failed to log out. Please try again.'));
    }
  }, [t]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    isLoading,
    checkAuth,
    handleLogout,
  };
};
