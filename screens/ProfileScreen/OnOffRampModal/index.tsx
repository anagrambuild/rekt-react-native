import { useState } from 'react';

import { Modal } from '@/components';
import { useProfileContext } from '@/contexts';

import { Balance } from './Balance';
import { TransferIn } from './TransferIn';

export const OnOffRampModal = () => {
  const { isOnOffRampModalVisible, setIsOnOffRampModalVisible } =
    useProfileContext();

  const [view, setView] = useState<'balance' | 'transfer' | 'card'>('balance');

  const onRequestClose = () => {
    setIsOnOffRampModalVisible(false);
  };

  return (
    <Modal visible={isOnOffRampModalVisible} onRequestClose={onRequestClose}>
      {view === 'balance' && <Balance setView={setView} />}
      {view === 'transfer' && <TransferIn setView={setView} />}
      {/* {view === 'card' && <Card />} */}
    </Modal>
  );
};
