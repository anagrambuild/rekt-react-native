import { useState } from 'react';

import { Modal } from '@/components';
import { useProfileContext } from '@/contexts';

import { Balance } from './Balance';
import { TransferIn } from './TransferIn';
import { Withdraw } from './Withdraw';
import { WithdrawalAddress } from './WithdrawalAddress';

export const OnOffRampModal = () => {
  const { isOnOffRampModalVisible, setIsOnOffRampModalVisible } =
    useProfileContext();

  const [view, setView] = useState<
    | 'balance'
    | 'transfer'
    | 'withdraw'
    | 'withdrawal address'
    | 'withdrawal success'
  >('balance');

  const onRequestClose = () => {
    setIsOnOffRampModalVisible(false);
  };

  return (
    <Modal visible={isOnOffRampModalVisible} onRequestClose={onRequestClose}>
      {view === 'balance' && <Balance setView={setView} />}
      {view === 'transfer' && <TransferIn setView={setView} />}
      {view === 'withdraw' && <Withdraw setView={setView} />}
      {view === 'withdrawal address' && <WithdrawalAddress setView={setView} />}
    </Modal>
  );
};
