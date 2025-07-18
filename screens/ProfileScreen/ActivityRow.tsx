import DiceIcon from '@/assets/images/app-svgs/dice.svg';
import FireIcon from '@/assets/images/app-svgs/fire.svg';
import TradeIcon from '@/assets/images/app-svgs/trade.svg';
import {
  Card,
  Row,
  SegmentContainer,
  SegmentControl,
  Title4,
} from '@/components';

import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

export const ActivityRow = ({
  view,
  setView,
}: {
  view: 'trades' | 'minigame';
  setView: (view: 'trades' | 'minigame') => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Row $justifyContent='space-between' style={{ paddingStart: 6 }}>
      <Row $width='auto' $gap={4}>
        <Title4>{t('Activity')}</Title4>
        <Card
          style={{
            borderRadius: 8,
            width: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: theme.colors.cardEmphasized,
            paddingStart: 12,
            paddingEnd: 12,
          }}
        >
          <FireIcon width={24} height={24} />
          <Title4 style={{ fontSize: 12 }}>2x</Title4>
        </Card>
      </Row>
      <SegmentContainer>
        <SegmentControl
          Svg={TradeIcon}
          selected={view === 'trades'}
          onPress={() => setView('trades')}
        />
        <SegmentControl
          Svg={DiceIcon}
          selected={view === 'minigame'}
          onPress={() => setView('minigame')}
        />
      </SegmentContainer>
    </Row>
  );
};
