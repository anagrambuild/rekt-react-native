import { Pressable } from 'react-native';

import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import { Body1Secondary, BodyM, Card, IconButton } from '@/components';
import { Row } from '@/components/common/containers';
import { useHomeContext } from '@/contexts/HomeContext';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

export const AmountCard = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { amount, setAmount } = useHomeContext();
  return (
    <Card $padding={8}>
      <Row $gap={8}>
        <Pressable>
          <Row $gap={8} $width='auto'>
            <UsdcIcon />
            <Body1Secondary>{t('Amount')}</Body1Secondary>
            <MaterialIcon
              name='edit'
              size={16}
              color={theme.colors.textSecondary}
            />
          </Row>
        </Pressable>
        <Row $gap={12} $width='auto'>
          <IconButton name='remove' onPress={() => setAmount(amount - 1)} />
          <BodyM>{`$${amount}`}</BodyM>
          <IconButton name='add' onPress={() => setAmount(amount + 1)} />
        </Row>
      </Row>
    </Card>
  );
};
