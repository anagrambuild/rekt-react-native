import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  Linking,
  Platform,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import UsdcIcon from "@/assets/images/app-svgs/usdc.svg";
import {
  AmountInput,
  BodyMEmphasized,
  BodyMSecondary,
  BodySMonoSecondary,
  BodyXSMonoSecondary,
  Column,
  PresetButton,
  PressableOpacity,
  PrimaryButton,
  Row,
  ScrollRow,
  SecondaryButton,
  WalletConnectionContent,
  WebViewScreen,
} from "@/components";
import { useWallet } from "@/contexts";
import { useProfileContext } from "@/contexts/ProfileContext";

import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcon from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";

import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import styled, { DefaultTheme, useTheme } from "styled-components/native";
import { Toast } from "toastify-react-native";

import { OnOffRampViewType } from ".";

export const TransferIn = ({
  setView,
}: {
  setView: (view: OnOffRampViewType) => void;
}) => {
  const {
    setIsOnOffRampModalVisible,
    showExplorer,
    setShowExplorer,
    explorerUrl,
    setExplorerUrl,
    shouldRestoreOnOffRampModal,
    setShouldRestoreOnOffRampModal,
    savedOnOffRampView,
    setSavedOnOffRampView,
    savedTransferAmount,
    setSavedTransferAmount,
    wasInTransferFlow,
    setWasInTransferFlow,
  } = useProfileContext();

  const {
    connected,
    connecting,
    transferState,
    publicKey,
    connectForTransfer,
    initiateTransfer,
    resetTransfer,
    showWalletModal,
    setShowWalletModal,
  } = useWallet();

  const theme = useTheme();
  const { t } = useTranslation();
  const [amount, setAmount] = useState(savedTransferAmount || "50.00");
  const [showAddress, setShowAddress] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // Animation values
  const addressOpacityAnim = useRef(new Animated.Value(0)).current;
  const qrCodeOpacityAnim = useRef(new Animated.Value(0)).current;

  // TODO - change this to the user's address from profile
  const address = "GuY9pCs5yhf7pmSYa41xoYTZvMfqgHHiFyjaeTF2oTXc";
  const shortAddress =
    address.length > 10
      ? address.slice(0, 6) + "..." + address.slice(-4)
      : address;

  // Save transfer amount when it changes
  useEffect(() => {
    setSavedTransferAmount(amount);
  }, [amount, setSavedTransferAmount]);

  // Handle transfer state restoration
  useEffect(() => {
    if (shouldRestoreOnOffRampModal && savedOnOffRampView === "transferIn") {
      setShouldRestoreOnOffRampModal(false);
      setWasInTransferFlow(true);
    }
  }, [
    shouldRestoreOnOffRampModal,
    savedOnOffRampView,
    setShouldRestoreOnOffRampModal,
    setWasInTransferFlow,
  ]);

  // Listen for keyboard events to close QR code
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        if (showQRCode) {
          handleToggleQRCode();
        }
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQRCode]);

  // Animate address section when showAddress changes
  useEffect(() => {
    if (showAddress) {
      // Fade in
      Animated.timing(addressOpacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else {
      // Fade out first, then hide after animation completes
      Animated.timing(addressOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        // Animation completed, now we can hide the element
        // The element will be removed from layout after fade-out
      });
    }
  }, [showAddress, addressOpacityAnim]);

  // Animate QR code section when showQRCode changes
  useEffect(() => {
    if (showQRCode) {
      // Fade in
      Animated.timing(qrCodeOpacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else {
      // Fade out first, then hide after animation completes
      Animated.timing(qrCodeOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        // Animation completed, now we can hide the element
        // The element will be removed from layout after fade-out
      });
    }
  }, [showQRCode, qrCodeOpacityAnim]);

  const handleToggleAddress = () => {
    if (showAddress) {
      // Start fade out animation
      Animated.timing(addressOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        // After fade-out completes, hide the element
        setShowAddress(false);
      });
    } else {
      // Show immediately for fade-in
      setShowAddress(true);
    }
  };

  const handleToggleQRCode = () => {
    if (showQRCode) {
      // Start fade out animation
      Animated.timing(qrCodeOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        // After fade-out completes, hide the element
        setShowQRCode(false);
      });
    } else {
      // Dismiss keyboard first, then show QR code
      Keyboard.dismiss();
      // Show immediately for fade-in
      setShowQRCode(true);
    }
  };

  const handleBack = () => {
    if (
      transferState.status === "success" ||
      transferState.status === "failed"
    ) {
      resetTransfer();
      setWasInTransferFlow(false);
    } else {
      setView("balance");
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(address);

    if (Platform.OS === "android") {
      Toast.show({
        text1: t("Address copied to clipboard"),
        type: "success",
        backgroundColor: theme.colors.card,
        textColor: theme.colors.textPrimary,
        progressBarColor: theme.colors.profit,
        iconColor: theme.colors.profit,
      });
    } else {
      Alert.alert(t("Address copied to clipboard"));
    }
  };

  const onContactSupport = () => {
    Linking.openURL("mailto:ld@anagram.xyz");
  };

  const handleDeposit = async () => {
    const transferAmount = parseFloat(amount);
    if (!transferAmount || transferAmount <= 0) {
      Alert.alert(t("Invalid Amount"), t("Please enter a valid amount"));
      return;
    }

    // Address is now hardcoded, so this validation is no longer needed
    // if (!address) {
    //   Alert.alert(t("No Address"), t("Please connect your wallet first"));
    //   return;
    // }

    // Save current state for restoration
    setSavedOnOffRampView("transferIn");
    setSavedTransferAmount(amount);
    setWasInTransferFlow(true);

    // Handle different scenarios
    if (Platform.OS === "android") {
      if (connected && publicKey) {
        // Scenario 1: Android with already connected wallet
        await initiateTransfer(transferAmount, address);
      } else {
        // Scenario 2: Android without connected wallet - use MWA
        await connectForTransfer();
        // Transfer will be initiated after connection
        setTimeout(() => {
          initiateTransfer(transferAmount, address);
        }, 1000);
      }
    } else {
      // iOS scenarios
      if (connected && publicKey) {
        // Scenario 3: iOS with already connected wallet
        await initiateTransfer(transferAmount, address);
      } else {
        // Scenario 4: iOS without connected wallet - show wallet connection
        setShowWalletModal(true);
      }
    }
  };

  const handleViewOnExplorer = () => {
    if (transferState.explorerUrl) {
      setExplorerUrl(transferState.explorerUrl);
      setShowExplorer(true);
      setIsOnOffRampModalVisible(false);
    }
  };

  // Show WebView if explorer is requested
  if (showExplorer && explorerUrl) {
    return (
      <WebViewScreen
        url={explorerUrl}
        title={t("Transaction Explorer")}
        onBack={() => {
          setShowExplorer(false);
          setExplorerUrl(null);
        }}
      />
    );
  }

  // Show wallet connection modal for iOS
  if (showWalletModal && Platform.OS === "ios") {
    return (
      <WalletConnectionContent
        onRequestClose={() => {
          setShowWalletModal(false);
          // After wallet connection, initiate transfer if we were in transfer flow
          if (wasInTransferFlow) {
            setTimeout(() => {
              const transferAmount = parseFloat(amount);
              if (connected && publicKey && transferAmount > 0) {
                initiateTransfer(transferAmount, address);
              }
            }, 1000);
          }
        }}
      />
    );
  }

  // Handle transfer states
  if (transferState.status === "pending") {
    return (
      <Column $gap={16} $alignItems="center" $padding={4}>
        <IconContainer onPress={handleBack}>
          <MaterialIcon
            name="chevron-left"
            size={24}
            color={theme.colors.textSecondary}
          />
        </IconContainer>

        <UsdcIconContainer>
          <UsdcIcon width={44} height={44} />
          <AbsoluteContainer>
            <Feather name="loader" size={16} color={theme.colors.loss} />
          </AbsoluteContainer>
        </UsdcIconContainer>

        <BodyMEmphasized>{t("Processing transfer...")}</BodyMEmphasized>
        <BodyMSecondary style={{ textAlign: "center" }}>
          {t("Please confirm the transaction in your wallet.")}
        </BodyMSecondary>
        <SecondaryButton onPress={handleBack}>{t("Cancel")}</SecondaryButton>
      </Column>
    );
  }

  if (transferState.status === "success") {
    return (
      <Column $gap={16} $alignItems="center" $padding={4}>
        <IconContainer onPress={handleBack}>
          <MaterialIcon
            name="chevron-left"
            size={24}
            color={theme.colors.textSecondary}
          />
        </IconContainer>

        <UsdcIconContainer>
          <UsdcIcon width={44} height={44} />
          <AbsoluteContainer>
            <MaterialIcon
              name="check-circle"
              size={16}
              color={theme.colors.profit}
            />
          </AbsoluteContainer>
        </UsdcIconContainer>

        <BodyMEmphasized>{t("Transfer successful!")}</BodyMEmphasized>
        <BodyMSecondary style={{ textAlign: "center" }}>
          {t("Your USDC transfer of ${{amount}} has been completed.", {
            amount: transferState.amount,
          })}
        </BodyMSecondary>

        <PrimaryButton
          onPress={handleViewOnExplorer}
          disabled={!transferState.explorerUrl}
          icon={
            !transferState.explorerUrl ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.textSecondary}
              />
            ) : undefined
          }
        >
          {!transferState.explorerUrl
            ? t("Loading Explorer...")
            : t("View on Explorer")}
        </PrimaryButton>

        <SecondaryButton onPress={() => setIsOnOffRampModalVisible(false)}>
          {t("Done")}
        </SecondaryButton>
      </Column>
    );
  }

  if (transferState.status === "failed") {
    return (
      <Column $gap={16} $alignItems="center" $padding={4}>
        <IconContainer onPress={handleBack}>
          <MaterialIcon
            name="chevron-left"
            size={24}
            color={theme.colors.textSecondary}
          />
        </IconContainer>

        <UsdcIconContainer>
          <UsdcIcon width={44} height={44} />
          <AbsoluteContainer>
            <MaterialIcon name="error" size={16} color={theme.colors.loss} />
          </AbsoluteContainer>
        </UsdcIconContainer>

        <BodyMEmphasized>{t("Transfer failed")}</BodyMEmphasized>
        <BodyMSecondary style={{ textAlign: "center" }}>
          {transferState.error || t("An error occurred during the transfer.")}
        </BodyMSecondary>

        <PrimaryButton
          onPress={() => {
            resetTransfer();
            setWasInTransferFlow(false);
          }}
        >
          {t("Try Again")}
        </PrimaryButton>

        <SecondaryButton
          onPress={onContactSupport}
          icon={
            <MaterialIcon
              name="support-agent"
              size={24}
              color={theme.colors.textPrimary}
            />
          }
        >
          {t("Contact Support")}
        </SecondaryButton>
      </Column>
    );
  }

  // Main input form - wrapped in TouchableWithoutFeedback for keyboard dismissal
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Column $gap={16} $alignItems="center" $padding={4}>
        {/* Header Section */}
        <IconContainer onPress={handleBack}>
          <MaterialIcon
            name="chevron-left"
            size={24}
            color={theme.colors.textSecondary}
          />
        </IconContainer>

        <>
          <UsdcIconContainer>
            <UsdcIcon width={44} height={44} />
            <AbsoluteContainer>
              <FontAwesome5
                name="arrow-circle-down"
                size={20}
                color={theme.colors.textPrimary}
              />
            </AbsoluteContainer>
          </UsdcIconContainer>
          <Column>
            <BodyMEmphasized>
              {t("Send USDC to this account on Solana")}
            </BodyMEmphasized>
            <Row $gap={0}>
              <View style={{ width: 100 }} />
              <BodyMSecondary>{shortAddress}</BodyMSecondary>
              <Row $width="auto" $justifyContent="flex-end">
                <PressableOpacity
                  style={{ padding: 6 }}
                  onPress={copyToClipboard}
                >
                  <Octicons
                    name="copy"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </PressableOpacity>
                <PressableOpacity
                  style={{ padding: 6 }}
                  onPress={handleToggleQRCode}
                >
                  <MaterialIcon
                    name="qr-code-scanner"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </PressableOpacity>
                <PressableOpacity
                  style={{ padding: 6 }}
                  onPress={handleToggleAddress}
                >
                  <FontAwesome5
                    name={showAddress ? "eye-slash" : "eye"}
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </PressableOpacity>
              </Row>
            </Row>
          </Column>

          {/* Animated QR Code Section */}
          {showQRCode && (
            <Animated.View
              style={{
                width: "100%",
                opacity: qrCodeOpacityAnim,
              }}
            >
              <Column $alignItems="center" $gap={8}>
                <QRCodeContainer>
                  <CloseButton onPress={handleToggleQRCode}>
                    <MaterialIcon
                      name="close"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </CloseButton>
                  <QRCode
                    value={address}
                    size={200}
                    color={theme.colors.textPrimary}
                    backgroundColor={theme.colors.background}
                  />
                </QRCodeContainer>
              </Column>
            </Animated.View>
          )}

          {/* Animated Address Section */}
          {showAddress && (
            <Animated.View
              style={{
                width: "100%",
                opacity: addressOpacityAnim,
              }}
            >
              <Column $alignItems="flex-start" $gap={0}>
                <BodyXSMonoSecondary>
                  {t("Deposit address")}
                </BodyXSMonoSecondary>

                <AddressContainer>
                  <BodySMonoSecondary>{address}</BodySMonoSecondary>
                </AddressContainer>
              </Column>
            </Animated.View>
          )}

          <AmountInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            selectionColor={theme.colors.loss}
          />
          <ScrollRow $gap={8} keyboardShouldPersistTaps="always">
            <PresetButton value={"$10"} onPress={() => setAmount("10.00")} />
            <PresetButton value={"$50"} onPress={() => setAmount("50.00")} />
            <PresetButton value={"$100"} onPress={() => setAmount("100.00")} />
            <PresetButton value={"$200"} onPress={() => setAmount("200.00")} />
            <PresetButton value={"$500"} onPress={() => setAmount("500.00")} />
            <PresetButton
              value={"$1000"}
              onPress={() => setAmount("1000.00")}
            />
          </ScrollRow>

          {/* Deposit Options Section */}
          <Column $gap={8}>
            {!connected && (
              <InfoMessage>
                <BodyMSecondary
                  style={{
                    textAlign: "center",
                    color: theme.colors.textSecondary,
                  }}
                >
                  {t(
                    "You need to connect your wallet first to make a deposit."
                  )}
                </BodyMSecondary>
              </InfoMessage>
            )}
            <PrimaryButton
              onPress={handleDeposit}
              disabled={connecting || !amount || parseFloat(amount) <= 0}
            >
              {connecting
                ? t("Connecting...")
                : !connected
                ? t("Connect Wallet")
                : t("Deposit")}
            </PrimaryButton>
            <SecondaryButton onPress={() => setIsOnOffRampModalVisible(false)}>
              {t("Cancel")}
            </SecondaryButton>
          </Column>
        </>
      </Column>
    </TouchableWithoutFeedback>
  );
};

const IconContainer = styled(PressableOpacity)`
  padding: 0px 16px 0 0;
  align-items: flex-start;
  width: 100%;
`;

const UsdcIconContainer = styled.View`
  flex-direction: row;
  position: relative;
  align-items: center;
  justify-content: center;
`;

const AbsoluteContainer = styled.View`
  position: absolute;
  right: -6px;
  bottom: -2px;
  align-items: center;
  justify-content: center;
  height: 24px;
  width: 24px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
  border-radius: 12px;
`;

const AddressContainer = styled.View`
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 8px;
  border-radius: 12px;
`;

const QRCodeContainer = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border-radius: 12px;
`;

const CloseButton = styled(PressableOpacity)`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.secondary};
  border-radius: 12px;
  padding: 4px;
`;

const InfoMessage = styled.View`
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid
    ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;
