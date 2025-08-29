import { Modal } from "./common/Modal";
import { WalletConnectionContent } from "./WalletConnectionContent";

interface WalletConnectionModalProps {
  visible: boolean;
  onRequestClose: () => void;
  onConnectionSuccess?: () => void;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  visible,
  onRequestClose,
  onConnectionSuccess,
}) => {
  return (
    <Modal visible={visible} onRequestClose={onRequestClose}>
      <WalletConnectionContent 
        onRequestClose={onRequestClose} 
        onConnectionSuccess={onConnectionSuccess}
      />
    </Modal>
  );
};
