import { View } from 'react-native';

import { Title1 } from '@/components';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Title1>Hello World</Title1>
    </View>
  );
}
