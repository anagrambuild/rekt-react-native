import {
  BodyM,
  BodyMSecondary,
  BodySEmphasized,
  Card,
  Column,
  Divider,
  HorizontalSlider,
  Row,
} from '@/components';
import { useHomeContext } from '@/contexts/HomeContext';

import { useTranslation } from 'react-i18next';

export const SliderCard = () => {
  const { t } = useTranslation();
  const { amount, leverage } = useHomeContext();
  return (
    <Card $padding={16} style={{ gap: 8 }}>
      <Column $gap={16} $alignItems='flex-start'>
        <BodySEmphasized>{t('Leverage')}</BodySEmphasized>
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
      <HorizontalSlider />
    </Card>
  );
};
