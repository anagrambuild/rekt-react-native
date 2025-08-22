import { Keyboard, Pressable } from "react-native";

import UsdcIcon from "@/assets/images/app-svgs/usdc.svg";
import WalletSecondaryIcon from "@/assets/images/app-svgs/wallet-secondary.svg";
import {
  AmountInput,
  BodyMEmphasized,
  BodyMSecondary,
  BodyXSMonoSecondary,
  Card,
  Column,
  Divider,
  Gap,
  PressableOpacity,
  PrimaryButton,
  Row,
  Title5,
} from "@/components";
import { useProfileContext } from "@/contexts/ProfileContext";
import { truncateAddress } from "@/utils";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

export const Withdraw = ({
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
  const theme = useTheme();
  const { t } = useTranslation();
  const { userData, withdrawalAddress, withdrawalAmount, setWithdrawalAmount } =
    useProfileContext();

  const handleAmountChange = (text: string) => {
    // Allow only numbers with up to 2 decimal places
    if (/^\d*\.?\d{0,2}$/.test(text)) {
      setWithdrawalAmount(text);
    }
  };

  const handleBack = () => setView("balance");

  const handleWithdraw = () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) === 0) {
      return;
    }
    // Handle withdrawal logic here
    setView("withdrawal success");
  };

  const isWithdrawDisabled =
    !withdrawalAmount ||
    parseFloat(withdrawalAmount) === 0 ||
    !withdrawalAddress;

  const networkFee = 0.0;
  const amountToReceive = withdrawalAmount
    ? parseFloat(withdrawalAmount) - networkFee
    : 0;

  return (
    <Pressable onPress={() => Keyboard.dismiss()}>
      <Column $gap={16} $alignItems="center" $padding={4}>
        {/* Header Section */}
        <Row $justifyContent="flex-start" $gap={8}>
          <IconContainer onPress={handleBack}>
            <MaterialIcon
              name="chevron-left"
              size={24}
              color={theme.colors.textSecondary}
            />
          </IconContainer>
          <Title5>{t("Withdraw")}</Title5>
        </Row>
        <Gap />

        {/* Amount Input Section */}
        <Column $gap={8} $alignItems="center">
          <BodyMEmphasized>{t("Enter amount")}</BodyMEmphasized>
          <AmountInput
            value={withdrawalAmount}
            onChangeText={handleAmountChange}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            selectionColor={theme.colors.loss}
          />
          <BalancePill
            onPress={() => {
              const balanceAmount = userData.balance.toFixed(2);
              setWithdrawalAmount(balanceAmount);
            }}
          >
            <WalletSecondaryIcon
              width={16}
              height={16}
              color={theme.colors.textSecondary}
            />
            <BodyXSMonoSecondary>
              {userData.balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USDC
            </BodyXSMonoSecondary>
          </BalancePill>
        </Column>

        {/* Recipient and Fee Details Section */}
        <Card $padding={16} style={{ width: "100%" }}>
          <Column $gap={12}>
            {/* To Field */}
            <PressableOpacity
              onPress={() => setView("withdrawal address")}
              style={{ width: "100%" }}
            >
              <Row
                $justifyContent="space-between"
                $alignItems="center"
                $width="auto"
              >
                <Row $width="auto" $justifyContent="flex-start" $gap={16}>
                  <WalletIconContainer>
                    <WalletSecondaryIcon
                      width={16}
                      height={16}
                      color={theme.colors.textSecondary}
                    />
                  </WalletIconContainer>
                  <Column $gap={4} $alignItems="flex-start" $width="auto">
                    <BodyMEmphasized>{t("To")}</BodyMEmphasized>
                    <BodyMSecondary>
                      {withdrawalAddress
                        ? truncateAddress(withdrawalAddress)
                        : t("Set wallet address")}
                    </BodyMSecondary>
                  </Column>
                </Row>
                <WalletIconContainer>
                  <MaterialIcon
                    name={withdrawalAddress ? "edit" : "chevron-right"}
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </WalletIconContainer>
              </Row>
            </PressableOpacity>
          </Column>
        </Card>

        <Column $gap={12}>
          {/* Network Fee */}
          <Row $justifyContent="space-between" $alignItems="center">
            <BodyMSecondary>{t("Network fee")}</BodyMSecondary>
            <BodyMSecondary>${networkFee.toFixed(2)}</BodyMSecondary>
          </Row>
          <Divider />

          {/* You'll get */}
          <Row $justifyContent="space-between" $alignItems="center">
            <BodyMSecondary>{t("You'll get")}</BodyMSecondary>
            <Row $gap={4} $alignItems="center" $width="auto">
              <BodyMSecondary>{amountToReceive.toFixed(2)}</BodyMSecondary>
              <UsdcIcon width={20} height={20} />
            </Row>
          </Row>
        </Column>

        {/* Withdraw Button */}
        <PrimaryButton
          onPress={handleWithdraw}
          disabled={isWithdrawDisabled}
          style={{
            opacity: isWithdrawDisabled ? 0.5 : 1,
          }}
        >
          {t("Withdraw")}
        </PrimaryButton>
      </Column>
    </Pressable>
  );
};

const IconContainer = styled(PressableOpacity)`
  align-items: center;
  justify-content: center;
`;

const BalancePill = styled(PressableOpacity)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.secondary};
  border-radius: 100px;
`;

const WalletIconContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 100px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.cardEmphasized};
`;
