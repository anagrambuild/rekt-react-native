import { useEffect } from 'react';

import RektLogo from '@/assets/images/rekt-logo.svg';
import {
  Column,
  LoginButton,
  ScreenContainer,
  SignupButton,
  Title1,
} from '@/components';
import { useAppContext } from '@/contexts';
import { router } from 'expo-router';

const Index = () => {
  const { isLoggedIn, setIsLoggedIn } = useAppContext();

  // Function to check if user is logged in and redirect
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn]);

  return (
    <ScreenContainer>
      <RektLogo width={100} height={100} />
      <Title1>Hello World</Title1>
      <Column>
        <SignupButton onPress={() => setIsLoggedIn(true)} />
        <LoginButton onPress={() => setIsLoggedIn(true)} />
      </Column>
    </ScreenContainer>
  );
};

export default Index;
