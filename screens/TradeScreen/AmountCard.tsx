import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import {
  Body1Secondary,
  BodyM,
  Card,
  IconButton,
  PressableOpacity,
} from '@/components';
import { Row } from '@/components/common/containers';
import { useHomeContext } from '@/contexts/HomeContext';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

export const AmountCard = ({
  setAmountModalVisible,
}: {
  setAmountModalVisible: (visible: boolean) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    selectedToken,
    solTrade,
    setSolTrade,
    ethTrade,
    setEthTrade,
    btcTrade,
    setBtcTrade,
  } = useHomeContext();

  const trade =
    selectedToken === 'sol'
      ? solTrade
      : selectedToken === 'eth'
      ? ethTrade
      : btcTrade;

  const setTrade =
    selectedToken === 'sol'
      ? setSolTrade
      : selectedToken === 'eth'
      ? setEthTrade
      : setBtcTrade;

  const amount = trade?.amount ?? 10;

  const setAmount = (newAmount: number) => {
    if (trade) {
      setTrade({ ...trade, amount: newAmount });
    } else {
      setTrade({
        side: 'short', // default
        entryPrice: 0,
        amount: newAmount,
        leverage: 1,
        status: 'open',
      });
    }
  };

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
            onPress={() => setAmount(Math.max(0, amount - 1))}
          />
          <BodyM>{`$${amount}`}</BodyM>
          <IconButton
            name='add'
            onPress={() => setAmount(Math.max(amount + 1))}
          />
        </Row>
      </Row>
    </Card>
  );
};
