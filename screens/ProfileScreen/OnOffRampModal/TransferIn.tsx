import { useEffect, useRef, useState } from "react";
import {
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
} from "@/components";
import { useAppContext } from "@/contexts";
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

export const TransferIn = ({
  setView,
}: {
  setView: (
    view:
      | "balance"
      | "transfer"
      | "withdraw"
      | "withdrawal address"
      | "withdrawal success"
  ) => void;
}) => {
  const { userProfile } = useAppContext();
  const { setIsOnOffRampModalVisible } = useProfileContext();

  const theme = useTheme();
  const { t } = useTranslation();
  const [amount, setAmount] = useState("50.00");
  const [showAddress, setShowAddress] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // Animation values
  const addressOpacityAnim = useRef(new Animated.Value(0)).current;
  const qrCodeOpacityAnim = useRef(new Animated.Value(0)).current;

  // const address = userProfile?.swigWalletAddress || t("No address found");
  const address = "0x1234567890ndh7djdksk23";
  const shortAddress = address.slice(0, 6) + "..." + address.slice(-4);

  const [isTransferred, setIsTransferred] = useState(false);

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

  const handleBack = () =>
    isTransferred ? setIsTransferred(false) : setView("balance");

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
        {!isTransferred ? (
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
              <PresetButton
                value={"$100"}
                onPress={() => setAmount("100.00")}
              />
              <PresetButton
                value={"$200"}
                onPress={() => setAmount("200.00")}
              />
              <PresetButton
                value={"$500"}
                onPress={() => setAmount("500.00")}
              />
              <PresetButton
                value={"$1000"}
                onPress={() => setAmount("1000.00")}
              />
            </ScrollRow>

            {/* Deposit Options Section */}
            <Column $gap={8}>
              <PrimaryButton onPress={() => setIsTransferred(true)}>
                {t("Deposit")}
              </PrimaryButton>
              <SecondaryButton
                onPress={() => setIsOnOffRampModalVisible(false)}
              >
                {t("Cancel")}
              </SecondaryButton>
            </Column>
          </>
        ) : (
          <>
            <UsdcIconContainer>
              <UsdcIcon width={44} height={44} />
              <AbsoluteContainer>
                <Feather name="loader" size={16} color={theme.colors.loss} />
              </AbsoluteContainer>
            </UsdcIconContainer>

            <BodyMEmphasized>{t("Thank you for depositing.")}</BodyMEmphasized>
            <BodyMSecondary style={{ textAlign: "center" }}>
              {t(
                "It can take up to a couple minutes to process. Contact support if you run into any issues."
              )}
            </BodyMSecondary>
            <PrimaryButton onPress={() => setIsOnOffRampModalVisible(false)}>
              {t("Done")}
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
          </>
        )}
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
