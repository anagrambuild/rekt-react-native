import { Row, ScreenContainer, Title1 } from '@/components';

import { Stack } from 'expo-router';
export const TradeScreen = () => {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '', // or your custom title
          //   headerBackTitleVisible: false,
          // You can customize the header here
          // tabBarStyle: { display: 'none' }, // Hide tab bar
        }}
      />
      <ScreenContainer>
        <Row>
          <Title1>Trade</Title1>
        </Row>
      </ScreenContainer>
    </>
  );
};
