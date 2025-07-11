import { useState } from 'react';

import skull from '@/assets/images/app-pngs/skull.png';
import {
  BodyM,
  BodyMSecondary,
  BodySEmphasized,
  Card,
  Column,
  Divider,
  HorizontalSlider,
  PulsatingContainer,
  Row,
  Switch,
} from '@/components';
import { useHomeContext } from '@/contexts/HomeContext';

import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

export const SliderCard = () => {
  const { t } = useTranslation();
  const { selectedToken, solTrade, ethTrade, btcTrade } = useHomeContext();

  const amount =
    selectedToken === 'sol'
      ? solTrade?.amount ?? 10
      : selectedToken === 'eth'
      ? ethTrade?.amount ?? 10
      : btcTrade?.amount ?? 10;

  const leverage =
    selectedToken === 'sol'
      ? solTrade?.leverage ?? 1
      : selectedToken === 'eth'
      ? ethTrade?.leverage ?? 1
      : btcTrade?.leverage ?? 1;

  const [isSolMaxLeverageOn, setIsSolMaxLeverageOn] = useState(false);
  const [isEthMaxLeverageOn, setIsEthMaxLeverageOn] = useState(false);
  const [isBtcMaxLeverageOn, setIsBtcMaxLeverageOn] = useState(false);

  const isMaxLeverageOn =
    selectedToken === 'sol'
      ? isSolMaxLeverageOn
      : selectedToken === 'eth'
      ? isEthMaxLeverageOn
      : isBtcMaxLeverageOn;

  const setIsMaxLeverageOn =
    selectedToken === 'sol'
      ? setIsSolMaxLeverageOn
      : selectedToken === 'eth'
      ? setIsEthMaxLeverageOn
      : setIsBtcMaxLeverageOn;

  return (
    <Card $padding={16} style={{ gap: 8 }}>
      <Column $gap={16} $alignItems='flex-start'>
        <Row $padding={0} style={{ height: 30 }}>
          <BodySEmphasized>{t('Leverage')}</BodySEmphasized>
          {(leverage >= 100 || isMaxLeverageOn) && (
            <Switch
              onPress={() => setIsMaxLeverageOn((prev) => !prev)}
              isOn={isMaxLeverageOn}
              icon={
                <PulsatingContainer>
                  <Image source={skull} style={{ width: 30, height: 30 }} />
                </PulsatingContainer>
              }
            />
          )}
        </Row>
        <Divider />
        <Column $gap={8} $alignItems='flex-start'>
          <Row>
            <BodyM>{leverage}x</BodyM>
            <BodyM>{`$${leverage * amount}`}</BodyM>
          </Row>
          <Row>
            <BodyMSecondary>{t('Leverage')}</BodyMSecondary>
            <BodyMSecondary>{t('Buying power')}</BodyMSecondary>
          </Row>
        </Column>
      </Column>
      <HorizontalSlider isMaxLeverageOn={isMaxLeverageOn} />
    </Card>
  );
};
