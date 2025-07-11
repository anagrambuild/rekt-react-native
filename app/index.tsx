import { useEffect } from 'react';

import RektLogo from '@/assets/images/rekt-logo.svg';
import {
  Column,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  Title1,
} from '@/components';
import { useAppContext } from '@/contexts';

import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { isLoggedIn, setIsLoggedIn } = useAppContext();
  const { t } = useTranslation();
  // Function to check if user is logged in and redirect
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn]);

  return (
    <ScreenContainer
      alignItems='stretch'
      justifyContent='flex-start'
      contentContainerStyle={{ flex: 1 }}
    >
      <Column
        $width='100%'
        $justifyContent='space-between'
        style={{ height: '100%' }}
      >
        <RektLogo width={100} height={100} />
        <Title1>{t('Welcome')}</Title1>
        <Column>
          <PrimaryButton onPress={() => setIsLoggedIn(true)}>
            {t('Sign up')}
          </PrimaryButton>
          <SecondaryButton onPress={() => setIsLoggedIn(true)}>
            {t('Login')}
          </SecondaryButton>
        </Column>
      </Column>
    </ScreenContainer>
  );
};

export default Index;
