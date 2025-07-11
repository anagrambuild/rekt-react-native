import { Card, Column, Gap, PrimaryButton, Row } from '@/components';
import {
  //   BodyM,
  BodyMEmphasized,
  BodyS,
  Title4,
} from '@/components/common/texts';
import { useHomeContext } from '@/contexts';
import { Trade } from '@/contexts/HomeContext';

import { useTranslation } from 'react-i18next';

interface LiveTradeViewProps {
  trade: Trade;
}

export const LiveTradeView = ({ trade }: LiveTradeViewProps) => {
  const { t } = useTranslation();
  const { selectedToken, setSolTrade, setEthTrade, setBtcTrade } =
    useHomeContext();

  const handleClose = () => {
    if (selectedToken === 'sol') setSolTrade(null);
    else if (selectedToken === 'eth') setEthTrade(null);
    else setBtcTrade(null);
  };

  return (
    <Card $padding={16}>
      <Column $gap={16} $alignItems='flex-start'>
        <Title4>{t('Position entered')}</Title4>
        <Row $gap={16}>
          <Column $gap={4} $alignItems='flex-start'>
            <BodyS>{t('Side')}</BodyS>
            <BodyMEmphasized>
              {t(trade.side === 'long' ? 'Long' : 'Short')}
            </BodyMEmphasized>
          </Column>
          <Column $gap={4} $alignItems='flex-start'>
            <BodyS>{t('Amount')}</BodyS>
            <BodyMEmphasized>{`$${trade.amount}`}</BodyMEmphasized>
          </Column>
          <Column $gap={4} $alignItems='flex-start'>
            <BodyS>{t('Leverage')}</BodyS>
            <BodyMEmphasized>{`${trade.leverage}x`}</BodyMEmphasized>
          </Column>
          <Column $gap={4} $alignItems='flex-start'>
            <BodyS>{t('Entry price')}</BodyS>
            <BodyMEmphasized>{`$${trade.entryPrice}`}</BodyMEmphasized>
          </Column>
        </Row>
        <Gap height={8} />
        {/* Chart removed from here; will be rendered in HomeScreen */}
        <Row $gap={16}>
          <Column $gap={4} $alignItems='flex-start'>
            <BodyS>{t('PnL')}</BodyS>
            <BodyMEmphasized>{'--'}</BodyMEmphasized>
            {/* Placeholder for PnL */}
          </Column>
        </Row>
        <Gap height={8} />
        <PrimaryButton onPress={handleClose}>
          {t('Close position')}
        </PrimaryButton>
      </Column>
    </Card>
  );
};
