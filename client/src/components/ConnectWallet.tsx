import { useState } from "react";
import { WalletButton } from "@/components/wallet-button";
import { WalletModal } from "@/components/wallet-modal";
import { useWalletContext } from "@/components/WalletProvider";

export function ConnectWallet() {
  const [modalOpen, setModalOpen] = useState(false);
  const { address, connect, disconnect } = useWalletContext();

  const handleConnect = async (provider: any) => {
    setModalOpen(false);
    await connect(provider);
  };

  return (
    <>
      <WalletButton
        address={address}
        onConnect={() => setModalOpen(true)}
        onDisconnect={disconnect}
      />
      <WalletModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnect={handleConnect}
      />
    </>
  );
}
