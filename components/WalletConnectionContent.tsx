import { useEffect, useRef } from "react";
import { Alert, Linking, View } from "react-native";

import PhantomIcon from "@/assets/images/app-svgs/phantom.svg";
import { useAppContext, useWallet } from "@/contexts";

import { Column } from "./common/containers";
// Use require for bs58 to avoid PRNG issues
import bs58 from "bs58";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { SvgProps } from "react-native-svg";
import styled, { DefaultTheme } from "styled-components/native";

interface WalletConnectionContentProps {
  onRequestClose: () => void;
  onConnectionSuccess?: () => void;
}

interface WalletOption {
  id: string;
  name: string;
  deepLink: string;
  appStoreUrl: string;
  enabled: boolean;
  icon?: React.ComponentType<SvgProps>;
}

export const WalletConnectionContent: React.FC<
  WalletConnectionContentProps
> = ({ onRequestClose, onConnectionSuccess }) => {
  const { t } = useTranslation();
  const { getDappKeyPair, setConnectionSuccessCallback, connected } =
    useWallet();
  const { setExpectingWalletConnection, setWalletConnectionCallback } =
    useAppContext();
  const callbackTriggeredRef = useRef(false);

  // Fallback mechanism: if wallet gets connected but deep link handler didn't fire
  useEffect(() => {
    if (connected && onConnectionSuccess && !callbackTriggeredRef.current) {
      callbackTriggeredRef.current = true;
      // Small delay to ensure state is properly set
      setTimeout(() => {
        onConnectionSuccess();
      }, 500);
    }
  }, [connected, onConnectionSuccess]);

  const walletOptions: WalletOption[] = [
    {
      id: "phantom",
      name: "Phantom",
      deepLink: "phantom://",
      appStoreUrl:
        "https://apps.apple.com/app/phantom-solana-wallet/id1598432977",
      enabled: true,
      icon: PhantomIcon,
    },
    {
      id: "solflare",
      name: "Solflare",
      deepLink: "solflare://",
      appStoreUrl: "https://apps.apple.com/app/solflare/id1580902717",
      enabled: false, // Coming soon
    },
    {
      id: "backpack",
      name: "Backpack",
      deepLink: "backpack://",
      appStoreUrl:
        "https://apps.apple.com/app/backpack-crypto-wallet/id1644542829",
      enabled: false, // Coming soon
    },
  ];

  const handleWalletPress = async (wallet: WalletOption) => {
    if (!wallet.enabled) {
      Alert.alert(
        t("Coming Soon"),
        t("{{walletName}} integration is coming soon!", {
          walletName: wallet.name,
        })
      );
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(wallet.deepLink);

      if (canOpen) {
        if (wallet.id === "phantom") {
          // Use Phantom's connect URL scheme with proper parameters (iOS only)
          const appUrl = `${Constants.expoConfig?.scheme}://`;
          const solanaNetwork =
            Constants.expoConfig?.extra?.solanaNetwork || "solana:devnet";
          const cluster = solanaNetwork.includes("mainnet")
            ? "mainnet-beta"
            : "devnet";

          try {
            // Use universal link format (recommended)
            const keyPair = getDappKeyPair();
            const publicKeyBuffer = global.Buffer.from(keyPair.publicKey);
            const encodedPublicKey = bs58.encode(publicKeyBuffer);

            const connectUrl = `https://phantom.app/ul/v1/connect?dapp_encryption_public_key=${encodedPublicKey}&cluster=${cluster}&app_url=${encodeURIComponent(
              appUrl
            )}&redirect_link=${encodeURIComponent(appUrl)}`;

            // Set up both callback mechanisms
            if (onConnectionSuccess) {
              // Set the deep link callback
              setConnectionSuccessCallback(() => {
                callbackTriggeredRef.current = true;
                setExpectingWalletConnection(false);
                setWalletConnectionCallback(null);
                onConnectionSuccess();
              });
              
              // Set the AppState fallback
              setExpectingWalletConnection(true);
              setWalletConnectionCallback(() => {
                callbackTriggeredRef.current = true;
                onConnectionSuccess();
              });

              // Set the AppState fallback
              setExpectingWalletConnection(true);
              setWalletConnectionCallback(() => {
                callbackTriggeredRef.current = true;
                onConnectionSuccess();
              });
            }

            await Linking.openURL(connectUrl);
            onRequestClose(); // Close modal immediately, response will be handled by URL scheme
          } catch (encodingError) {
            console.error("Failed to encode public key:", encodingError);
            Alert.alert(
              t("Connection Failed"),
              t("Failed to prepare wallet connection")
            );
          }
        }
      } else {
        Alert.alert(
          t("{{walletName}} Not Found", { walletName: wallet.name }),
          t("Please install {{walletName}} from the App Store", {
            walletName: wallet.name,
          }),
          [
            {
              text: t("Install"),
              onPress: () => Linking.openURL(wallet.appStoreUrl),
            },
            {
              text: t("Cancel"),
              style: "cancel",
            },
          ]
        );
      }
    } catch (error) {
      console.error(`${wallet.name} wallet connection failed:`, error);
      Alert.alert(t("Connection Failed"), t("Failed to connect to wallet"));
    }
  };

  return (
    <Column $gap={24} $alignItems="stretch">
      <ModalTitle>{t("Connect Wallet")}</ModalTitle>
      <ModalSubtitle>
        {t("Choose a wallet to connect to your account")}
      </ModalSubtitle>

      <Column $gap={12} $alignItems="stretch">
        {walletOptions.map(wallet => (
          <WalletButton
            key={wallet.id}
            onPress={() => handleWalletPress(wallet)}
            disabled={!wallet.enabled}
            $enabled={wallet.enabled}
          >
            <WalletButtonContent>
              <WalletName $enabled={wallet.enabled}>{wallet.name}</WalletName>
              {!wallet.enabled ? (
                <ComingSoonText>{t("Coming Soon")}</ComingSoonText>
              ) : (
                <View>
                  {wallet.icon && <wallet.icon height={32} width={32} />}
                </View>
              )}
            </WalletButtonContent>
          </WalletButton>
        ))}
      </Column>
    </Column>
  );
};

const ModalTitle = styled.Text`
  font-size: 24px;
  font-family: "Unbounded";
  font-weight: 600;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
  text-align: center;
`;

const ModalSubtitle = styled.Text`
  font-size: 16px;
  font-family: "Geist";
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textSecondary};
  text-align: center;
  margin-top: -8px;
`;

const WalletButton = styled.Pressable<{ $enabled: boolean }>`
  background-color: ${({
    theme,
    $enabled,
  }: {
    theme: DefaultTheme;
    $enabled: boolean;
  }) => ($enabled ? theme.colors.card : theme.colors.card + "60")};
  border: 1px solid
    ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  opacity: ${({ $enabled }: { $enabled: boolean }) => ($enabled ? 1 : 0.6)};
`;

const WalletButtonContent = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const WalletName = styled.Text<{ $enabled: boolean }>`
  font-size: 18px;
  font-family: "Geist";
  font-weight: 500;
  color: ${({ theme, $enabled }: { theme: DefaultTheme; $enabled: boolean }) =>
    $enabled ? theme.colors.textPrimary : theme.colors.textSecondary};
`;

const ComingSoonText = styled.Text`
  font-size: 12px;
  font-family: "Geist";
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textSecondary};
  font-style: italic;
`;
