import { ScrollView } from 'react-native';

import { perpSocials, tokens } from './mockData';
import RektLogo from '@/assets/images/rekt-logo.svg';
import { PerpSocialChip, Row, ScreenContainer, TokenChip } from '@/components';

export const HomeScreen = () => {
  return (
    <ScreenContainer>
      <Row>
        <RektLogo width={60} height={60} />
        <Row $justifyContent='flex-end' $gap={16} $width='auto'>
          {tokens.map((token) => (
            <TokenChip
              key={token.id}
              imgSrc={token.imgSrc}
              value={token.value}
            />
          ))}
        </Row>
      </Row>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
      >
        {perpSocials.map((perpSocial) => (
          <PerpSocialChip
            key={perpSocial.id}
            imgSrc={perpSocial.imgSrc}
            position={perpSocial.position}
            meta={perpSocial.meta}
            earningMultiple={perpSocial.earningMultiple}
          />
        ))}
      </ScrollView>
    </ScreenContainer>
  );
};
