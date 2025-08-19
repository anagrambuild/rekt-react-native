import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import {
  Body1Secondary,
  BodyM,
  Card,
  IconButton,
  PressableOpacity,
} from '@/components';
import { Row } from '@/components/common/containers';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

export const AmountCard = ({
  setAmountModalVisible = () => {},
  amount = 10,
  setAmount = () => {},
}: {
  setAmountModalVisible?: (visible: boolean) => void;
  amount?: number;
  setAmount?: (amount: number) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Card $padding={8}>
      <Row $gap={8}>
        <PressableOpacity onPress={() => setAmountModalVisible(true)}>
          <Row $gap={8} $width='auto'>
            <UsdcIcon />
            <Body1Secondary>{t('Amount')}</Body1Secondary>
            <MaterialIcon
              name='edit'
              size={16}
              color={theme.colors.textSecondary}
            />
          </Row>
        </PressableOpacity>
        <Row $gap={12} $width='auto'>
          <IconButton
            name='remove'
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAmount(Math.max(10, amount - 1));
            }}
          />
          <BodyM>{`$${amount}`}</BodyM>
          <IconButton
            name='add'
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setAmount(Math.max(amount + 1));
            }}
          />
        </Row>
      </Row>
    </Card>
  );
};
