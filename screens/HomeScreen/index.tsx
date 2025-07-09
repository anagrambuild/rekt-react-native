import RektLogo from '@/assets/images/rekt-logo.svg';
import {
  Column,
  Gap,
  Row,
  ScreenContainer,
  ScrollRow,
  Title4,
} from '@/components';
import { useHomeContext } from '@/contexts';

import {
  LongButton,
  PerpSocialChip,
  PriceChartCard,
  ShortButton,
  TokenChip,
} from './homeComponents';
import { perpSocials, tokens } from './mockData';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const HomeScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { setSolTradeSide, setEthTradeSide, setBtcTradeSide, selectedToken } =
    useHomeContext();

  const setTradeSide =
    selectedToken === 'sol'
      ? setSolTradeSide
      : selectedToken === 'eth'
      ? setEthTradeSide
      : setBtcTradeSide;

  return (
    <ScreenContainer>
      <Column $gap={16}>
        <Column $gap={0}>
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
        </Column>

        <PriceChartCard />
      </Column>
      <Gap height={24} />
      <Column $gap={16}>
        <Row style={{ paddingStart: 16 }}>
          <Title4>{t('Ride the market')}</Title4>
        </Row>
        <Row $padding={0}>
          <ShortButton
            onPress={() => {
              setTradeSide('short');
              router.push('/trade');
            }}
            title={t('Short')}
            subtitle={t('Price will go down')}
          />
          <LongButton
            onPress={() => {
              setTradeSide('long');
              router.push('/trade');
            }}
            title={t('Long')}
            subtitle={t('Price will go up')}
          />
        </Row>
      </Column>
    </ScreenContainer>
  );
};
