import React, { useEffect, useState } from "react";
import { Alert, StyleSheet } from "react-native";

import { PrimaryButton } from "@/components/common/buttons";
import { Column } from "@/components/common/containers";
import {
  BodyMEmphasized,
  BodyMSecondary,
  Title5,
} from "@/components/common/texts";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { Camera, CameraView } from "expo-camera";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScan,
  onClose,
  title,
  description,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;

    setScanned(true);

    // Basic validation for Solana address
    if (data && data.length >= 32 && data.length <= 44) {
      onScan(data);
    } else {
      Alert.alert(
        t("Invalid QR Code"),
        t(
          "The scanned QR code does not appear to contain a valid Solana wallet address."
        ),
        [
          {
            text: t("Try Again"),
            onPress: () => setScanned(false),
          },
          {
            text: t("Cancel"),
            onPress: onClose,
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <ScannerContainer>
        <Column $alignItems="center" $gap={16} $padding={32}>
          <BodyMSecondary>
            {t("Requesting camera permission...")}
          </BodyMSecondary>
        </Column>
      </ScannerContainer>
    );
  }

  if (hasPermission === false) {
    return (
      <ScannerContainer>
        <Column $alignItems="center" $gap={16} $padding={32}>
          <MaterialIcon
            name="camera-alt"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Title5>{t("Camera Permission Required")}</Title5>
          <BodyMSecondary style={{ textAlign: "center" }}>
            {t(
              "Please enable camera access in your device settings to scan QR codes."
            )}
          </BodyMSecondary>
          <PrimaryButton onPress={onClose} style={{ marginTop: 16 }}>
            {t("Close")}
          </PrimaryButton>
        </Column>
      </ScannerContainer>
    );
  }

  return (
    <ScannerContainer>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* Overlay */}
      <ScannerOverlay>
        {/* Header */}
        <CloseButton onPress={onClose}>
          <MaterialIcon
            name="close"
            size={24}
            color={theme.colors.textPrimary}
          />
        </CloseButton>
        <ScannerHeader>
          <Column $alignItems="center" $gap={4}>
            <Title5>{title || t("Scan QR Code")}</Title5>
            {description && (
              <BodyMSecondary style={{ textAlign: "center" }}>
                {description}
              </BodyMSecondary>
            )}
          </Column>
          <PlaceholderView />
        </ScannerHeader>

        {/* Scanning Area */}
        <ScannerArea>
          <ScanningFrame>
            <Corner top left theme={theme} />
            <Corner top right theme={theme} />
            <Corner bottom left theme={theme} />
            <Corner bottom right theme={theme} />
          </ScanningFrame>
        </ScannerArea>

        {/* Instructions */}
        <ScannerInstructions>
          <BodyMEmphasized style={{ textAlign: "center" }}>
            {t("Position the QR code within the frame")}
          </BodyMEmphasized>
          <BodyMSecondary style={{ textAlign: "center" }}>
            {t("The code will be scanned automatically")}
          </BodyMSecondary>
        </ScannerInstructions>
      </ScannerOverlay>
    </ScannerContainer>
  );
};

const ScannerContainer = styled.View<{ theme: DefaultTheme }>`
  flex: 1;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

const ScannerOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ScannerHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

const CloseButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  margin: 16px 0 0 16px;
`;

const PlaceholderView = styled.View`
  width: 40px;
`;

const ScannerArea = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 32px;
`;

const ScanningFrame = styled.View`
  width: 250px;
  height: 250px;
  position: relative;
`;

interface CornerProps {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  theme: DefaultTheme;
}

const Corner = styled.View<CornerProps>`
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: ${({ theme }: CornerProps) => theme.colors.primary};
  ${({ top, left }: CornerProps) =>
    top &&
    left &&
    `
    top: 0;
    left: 0;
    border-top-width: 4px;
    border-left-width: 4px;
  `}
  ${({ top, right }: CornerProps) =>
    top &&
    right &&
    `
    top: 0;
    right: 0;
    border-top-width: 4px;
    border-right-width: 4px;
  `}
  ${({ bottom, left }: CornerProps) =>
    bottom &&
    left &&
    `
    bottom: 0;
    left: 0;
    border-bottom-width: 4px;
    border-left-width: 4px;
  `}
  ${({ bottom, right }: CornerProps) =>
    bottom &&
    right &&
    `
    bottom: 0;
    right: 0;
    border-bottom-width: 4px;
    border-right-width: 4px;
  `}
`;

const ScannerInstructions = styled.View`
  padding: 32px;
  gap: 8px;
`;
