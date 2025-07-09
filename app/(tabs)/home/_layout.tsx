import { Stack } from 'expo-router';

export default function IndexLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          headerShown: false, // or configure as needed
        }}
      />
      <Stack.Screen
        name='live-trade'
        options={{
          title: 'Live Trade',
          headerShown: true, // or configure as needed
        }}
      />
    </Stack>
  );
}
