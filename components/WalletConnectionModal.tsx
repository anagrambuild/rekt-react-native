import { Modal } from "./common/Modal";
import { WalletConnectionContent } from "./WalletConnectionContent";

interface WalletConnectionModalProps {
  visible: boolean;
  onRequestClose: () => void;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  visible,
  onRequestClose,
}) => {
  return (
    <Modal visible={visible} onRequestClose={onRequestClose}>
      <WalletConnectionContent onRequestClose={onRequestClose} />
    </Modal>
  );
};
