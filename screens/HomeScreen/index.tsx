import RektLogo from '@/assets/images/rekt-logo.svg';
import { Gap, Row, ScreenContainer, ScrollRow, Title4 } from '@/components';

import {
  LongButton,
  PerpSocialChip,
  PriceChartCard,
  ShortButton,
  TokenChip,
} from './homeComponents';
import { perpSocials, tokens } from './mockData';
import { useTranslation } from 'react-i18next';

export const HomeScreen = () => {
  const { t } = useTranslation();
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

      <ScrollRow contentContainerStyle={{ gap: 16 }}>
        {perpSocials.map((perpSocial) => (
          <PerpSocialChip
            key={perpSocial.id}
            imgSrc={perpSocial.imgSrc}
            position={perpSocial.position}
            meta={perpSocial.meta}
            earningMultiple={perpSocial.earningMultiple}
          />
        ))}
      </ScrollRow>

      <PriceChartCard />
      <Gap />
      <Row $padding={16}>
        <Title4>{t('Ride the market')}</Title4>
      </Row>
      <Row $padding={0}>
        <ShortButton
          onPress={() => console.log('short')}
          title={t('Short')}
          subtitle={t('Price will go down')}
        />
        <LongButton
          onPress={() => console.log('long')}
          title={t('Long')}
          subtitle={t('Price will go up')}
        />
      </Row>
    </ScreenContainer>
  );
};
