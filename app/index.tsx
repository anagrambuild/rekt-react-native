import RektLogo from '@/assets/images/rekt-logo.svg';
import {
  Column,
  LoginButton,
  ScreenContainer,
  SignupButton,
  Title1,
} from '@/components';

export default function Index() {
  return (
    <ScreenContainer>
      <RektLogo width={100} height={100} />
      <Title1>Hello World</Title1>
      <Column>
        <SignupButton onPress={() => console.log('signup')} />
        <LoginButton onPress={() => console.log('login')} />
      </Column>
    </ScreenContainer>
  );
}
