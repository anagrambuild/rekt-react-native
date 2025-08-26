import React, { useState } from "react";
import { Alert, Keyboard, Platform } from "react-native";

import UsdcIcon from "@/assets/images/app-svgs/usdc.svg";
import WalletSecondaryIcon from "@/assets/images/app-svgs/wallet-secondary.svg";
import {
  Body1,
  BodyMEmphasized,
  BodyMSecondary,
  BodySSecondary,
  Column,
  DangerButton,
  Modal,
  PressableOpacity,
  Row,
  SecondaryButton,
} from "@/components";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";

import bs58 from "bs58";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme } from "styled-components/native";
import { Toast } from "toastify-react-native";

interface DeleteAccountModalProps {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;
  onForceClose?: () => void; // Called when modal is closed after account deletion
}

type TransferStep =
  | "transfer"
  | "post-input"
  | "invalid"
  | "success"
  | "confirm-delete"
  | "deleted";

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onRequestClose,
  onConfirm,
  onForceClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Mock balance - in real app this would come from wallet context
  const mockBalance = 500;

  const [currentStep, setCurrentStep] = useState<TransferStep>("transfer");
  const [walletAddress, setWalletAddress] = useState("");
  const [isAddressValid, setIsAddressValid] = useState(false);

  const validateSolanaAddress = (address: string): boolean => {
    try {
      const cleanAddress = address.trim();

      // Basic format check first (fast)
      if (
        !cleanAddress ||
        cleanAddress.length < 32 ||
        cleanAddress.length > 44
      ) {
        return false;
      }

      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      if (!base58Regex.test(cleanAddress)) {
        return false;
      }

      // Actually decode and verify it's 32 bytes
      const decoded = bs58.decode(cleanAddress);
      return decoded.length === 32;
    } catch (error) {
      console.log("Error validating address:", error);
      return false;
    }
  };

  const handleAddressChange = (text: string) => {
    setWalletAddress(text);
    setIsAddressValid(validateSolanaAddress(text));
    // Dismiss error message when user starts typing
    if (currentStep === "invalid") {
      setCurrentStep("transfer");
    }
  };

  const handlePaste = async () => {
    const clipboardContent = await Clipboard.getStringAsync();
    setWalletAddress(clipboardContent);
    setIsAddressValid(validateSolanaAddress(clipboardContent));
    // Dismiss error message when user pastes
    if (currentStep === "invalid") {
      setCurrentStep("transfer");
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(walletAddress);

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

  const handleNext = () => {
    if (isAddressValid) {
      setCurrentStep("success");
    } else {
      setCurrentStep("invalid");
    }
  };

  const handleTransferSuccess = () => {
    setCurrentStep("confirm-delete");
  };

  const handleBack = () => {
    setCurrentStep("transfer");
  };

  const handleClose = () => {
    // If user has confirmed deletion, force close and clear state
    if (currentStep === "deleted") {
      if (onForceClose) {
        onForceClose();
      } else {
        onConfirm(); // Fallback to onConfirm if onForceClose not provided
      }
      return;
    }

    // Regular close - reset to initial state
    setCurrentStep("transfer");
    setWalletAddress("");
    setIsAddressValid(false);
    onRequestClose();
  };

  const handleFinalClose = () => {
    // Call onConfirm to actually delete the account and sign out
    onConfirm();
    // Close the modal - handleClose will determine the appropriate close behavior
    onRequestClose();
  };

  const renderTransferStep = () => (
    <Column $gap={16} $alignItems="flex-start" style={{ padding: 12 }}>
      <UsdcIcon width={32} height={32} />
      <Column $gap={4} $alignItems="flex-start">
        <BodyMEmphasized>
          {`${t("Your account has")} ${mockBalance} ${t("USDC")}`}
        </BodyMEmphasized>
        <BodyMSecondary>{t("Transfer it to another wallet")}</BodyMSecondary>
      </Column>

      {/* Wallet Address Input Section */}
      <Column $gap={12} $alignItems="flex-start">
        <BodyMEmphasized>{t("Wallet address")}</BodyMEmphasized>
        <AddressInputContainer>
          <WalletSecondaryIcon
            width={20}
            height={20}
            color={theme.colors.textSecondary}
          />
          <AddressInput
            value={walletAddress}
            onChangeText={handleAddressChange}
            placeholder={t("Enter Solana wallet address")}
            placeholderTextColor={theme.colors.textSecondary}
            numberOfLines={3}
            textAlignVertical="top"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </AddressInputContainer>
        <PasteButton onPress={handlePaste}>
          <Octicons name="paste" size={16} color={theme.colors.textSecondary} />
          <BodySSecondary>{t("Paste")}</BodySSecondary>
        </PasteButton>
        {currentStep === "invalid" && (
          <Row $gap={8} $width="auto">
            <MaterialIcon name="warning" size={20} color={theme.colors.loss} />
            <BodySSecondary style={{ color: theme.colors.loss }}>
              {t("Please enter a valid Solana wallet address")}
            </BodySSecondary>
          </Row>
        )}
      </Column>

      <SecondaryButton
        onPress={handleNext}
        // disabled={!isAddressValid}
      >
        {t("Next")}
      </SecondaryButton>
    </Column>
  );

  const renderSuccessStep = () => (
    <Column $gap={16} $alignItems="flex-start" $padding={12}>
      <MaterialIcon
        name="check-circle"
        size={32}
        color={theme.colors.textPrimary}
      />
      <Column $gap={4} $alignItems="flex-start">
        <Body1>{t("Transfer successful")}</Body1>

        <BodySSecondary>
          {t(
            "Your balance has been transferred to the specified wallet address"
          )}
        </BodySSecondary>
      </Column>
      <AddressInputContainer>
        <WalletSecondaryIcon
          width={20}
          height={20}
          color={theme.colors.textSecondary}
        />
        <AddressInput
          value={walletAddress}
          onChangeText={() => {}}
          placeholderTextColor={theme.colors.textSecondary}
          textAlignVertical="top"
          editable={false}
        />
      </AddressInputContainer>
      <PasteButton onPress={copyToClipboard}>
        <Octicons name="copy" size={16} color={theme.colors.textSecondary} />
        <BodySSecondary>{t("Copy")}</BodySSecondary>
      </PasteButton>

      <Column $gap={12} style={{ width: "100%" }}>
        <DangerButton onPress={handleTransferSuccess}>
          {t("Next → Delete account")}
        </DangerButton>
        <SecondaryButton onPress={handleBack}>{t("Back")}</SecondaryButton>
      </Column>
    </Column>
  );

  const renderConfirmDeleteStep = () => (
    <Column $gap={24} $alignItems="center" style={{ padding: 12 }}>
      <CircularIconContainer backgroundColor={theme.colors.loss}>
        <MaterialIcon
          name="warning"
          size={32}
          color={theme.colors.background}
        />
      </CircularIconContainer>

      <Body1 style={{ textAlign: "center" }}>{t("Are you sure?")}</Body1>

      <BodySSecondary style={{ textAlign: "center" }}>
        {t("Once deleted, your account can not be recovered.")}
      </BodySSecondary>

      <Column $gap={12} style={{ width: "100%" }}>
        <DangerButton onPress={() => setCurrentStep("deleted")}>
          {t("Yes, Delete account")}
        </DangerButton>
        <SecondaryButton onPress={handleClose}>{t("Close")}</SecondaryButton>
      </Column>
    </Column>
  );

  const renderDeletedStep = () => (
    <Column $gap={24} $alignItems="center" style={{ padding: 12 }}>
      <MaterialIcon
        name="check-circle"
        size={32}
        color={theme.colors.textPrimary}
      />

      <Body1 style={{ textAlign: "center" }}>
        {t("Your account has been deleted")}
      </Body1>

      <BodySSecondary style={{ textAlign: "center" }}>
        {t("Thank you for trying Rekt")}
      </BodySSecondary>

      <Column $gap={12} style={{ width: "100%" }}>
        <SecondaryButton onPress={handleFinalClose}>
          {t("Close")}
        </SecondaryButton>
      </Column>
    </Column>
  );

  const renderContent = () => {
    switch (currentStep) {
      case "transfer":
      case "post-input":
      case "invalid":
        return renderTransferStep();
      case "success":
        return renderSuccessStep();
      case "confirm-delete":
        return renderConfirmDeleteStep();
      case "deleted":
        return renderDeletedStep();
      default:
        return renderTransferStep();
    }
  };

  return (
    <Modal visible={visible} onRequestClose={handleClose}>
      {renderContent()}
    </Modal>
  );
};

const AddressInputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
  border-radius: 12px;
  padding: 16px;
  gap: 12px;
`;

const AddressInput = styled.TextInput`
  flex: 1;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
  font-family: "GeistMono";
  font-size: 14px;
`;

const PasteButton = styled(PressableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.secondary};
  border-radius: 100px;
  align-self: flex-start;
`;

const CircularIconContainer = styled.View<{ backgroundColor: string }>`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${({ backgroundColor }: { backgroundColor: string }) =>
    backgroundColor};
  justify-content: center;
  align-items: center;
`;
