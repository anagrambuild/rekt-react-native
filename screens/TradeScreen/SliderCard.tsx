import {
  BodyM,
  BodyMSecondary,
  BodySEmphasized,
  Card,
  HorizontalSlider,
  Row,
} from '@/components';

import { useTranslation } from 'react-i18next';

export const SliderCard = () => {
  const { t } = useTranslation();
  return (
    <Card $padding={16} style={{ gap: 8 }}>
      <BodySEmphasized>{t('Leverage')}</BodySEmphasized>
      <Row>
        <BodyM>70x</BodyM>
        <BodyM>$700</BodyM>
      </Row>
      <Row>
        <BodyMSecondary>{t('Leverage')}</BodyMSecondary>
        <BodyMSecondary>{t('Buying power')}</BodyMSecondary>
      </Row>
      <HorizontalSlider />
    </Card>
  );
};
