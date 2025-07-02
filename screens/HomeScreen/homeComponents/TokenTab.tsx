import React from 'react';
import { TouchableOpacity } from 'react-native';

import BtcSelected from '@/assets/images/app-svgs/btc-selected.svg';
import BtcUnselected from '@/assets/images/app-svgs/btc-unselected.svg';
import EthSelected from '@/assets/images/app-svgs/eth-selected.svg';
import EthUnselected from '@/assets/images/app-svgs/eth-unselected.svg';
import SolSelected from '@/assets/images/app-svgs/sol-selected.svg';
import SolUnselected from '@/assets/images/app-svgs/sol-unselected.svg';
import { BodyS } from '@/components';
// eslint-disable-next-line import/no-named-as-default
import styled, { DefaultTheme } from 'styled-components/native';

interface TabContainerProps {
  selected: boolean;
  theme: DefaultTheme;
}

const TabContainer = styled(TouchableOpacity)<TabContainerProps>`
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
  padding: 4px;
  gap: 8px;
`;

type TokenTabProps = {
  name: 'sol' | 'eth' | 'btc';
  price: string;
  selected: boolean;
  onPress: () => void;
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
    <TabContainer selected={selected} onPress={onPress}>
      <IconComponent width={32} height={32} />
      <BodyS selected={selected}>{tokenNameMap[name]}</BodyS>
    </TabContainer>
  );
};
