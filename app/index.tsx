import {
  LoginButton,
  ScreenContainer,
  SignupButton,
  Title1,
} from '@/components';

export default function Index() {
  return (
    <ScreenContainer>
      <Title1>Hello World</Title1>
      <SignupButton onPress={() => console.log('signup')} />
      <LoginButton onPress={() => console.log('login')} />
    </ScreenContainer>
  );
}
