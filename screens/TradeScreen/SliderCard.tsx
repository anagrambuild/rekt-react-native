import { useState } from 'react';

import Skull from '@/assets/images/app-pngs/skull.png';
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
  const {
    selectedToken,
    solAmount,
    ethAmount,
    btcAmount,
    solLeverage,
    ethLeverage,
    btcLeverage,
  } = useHomeContext();

  const amount =
    selectedToken === 'sol'
      ? solAmount
      : selectedToken === 'eth'
      ? ethAmount
      : btcAmount;

  const leverage =
    selectedToken === 'sol'
      ? solLeverage
      : selectedToken === 'eth'
      ? ethLeverage
      : btcLeverage;

  const [isMaxLeverageOn, setIsMaxLeverageOn] = useState(false);

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
                  <Image source={Skull} style={{ width: 30, height: 30 }} />
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
