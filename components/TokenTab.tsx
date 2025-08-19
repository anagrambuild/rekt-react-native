import BtcSelected from '@/assets/images/app-svgs/btc-selected.svg';
import BtcUnselected from '@/assets/images/app-svgs/btc-unselected.svg';
import EthSelected from '@/assets/images/app-svgs/eth-selected.svg';
import EthUnselected from '@/assets/images/app-svgs/eth-unselected.svg';
import SolSelected from '@/assets/images/app-svgs/sol-selected.svg';
import SolUnselected from '@/assets/images/app-svgs/sol-unselected.svg';

import { BodyS, PressableOpacity } from './common';
import styled, { DefaultTheme } from 'styled-components/native';

interface TabContainerProps {
  selected: boolean;
  theme: DefaultTheme;
  disabled?: boolean;
}

const TabContainer = styled(PressableOpacity)<TabContainerProps>`
  flex-direction: row;
  background-color: ${({
    selected,
    theme,
  }: {
    selected: boolean;
    theme: DefaultTheme;
  }) => (selected ? theme.colors.background : 'transparent')};
  border-radius: 12px;
  padding: 16px;
  align-items: center;
  flex: 1;
  padding: 4px 12px 4px 8px;
  gap: 8px;
  opacity: ${({ disabled }: { disabled?: boolean }) => (disabled ? 0.5 : 1)};
`;

type TokenTabProps = {
  name: 'sol' | 'eth' | 'btc';
  price: string;
  selected: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

const tokenNameMap = {
  sol: 'Solana',
  eth: 'Ethereum',
  btc: 'Bitcoin',
};

export const TokenTab: React.FC<TokenTabProps> = ({
  name,
  selected,
  onPress,
  disabled = false,
}) => {
  let IconComponent;
  if (name === 'sol') {
    IconComponent = selected ? SolSelected : SolUnselected;
  } else if (name === 'eth') {
    IconComponent = selected ? EthSelected : EthUnselected;
  } else {
    IconComponent = selected ? BtcSelected : BtcUnselected;
  }

  return (
    <TabContainer
      selected={selected}
      onPress={disabled ? () => {} : onPress || (() => {})}
      disabled={disabled}
    >
      <IconComponent width={32} height={32} />
      <BodyS selected={selected} disabled={disabled}>
        {tokenNameMap[name]}
      </BodyS>
    </TabContainer>
  );
};
