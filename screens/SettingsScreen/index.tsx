import { useState } from "react";

import RektLogo from "@/assets/images/rekt-logo.svg";
import {
  Body1Emphasized,
  BodySSecondary,
  Column,
  PressableOpacity,
  Row,
  ScreenContainer,
  Title5,
} from "@/components";
import { useAppContext, useProfileContext, useWallet } from "@/contexts";
import { supabase } from "@/utils/supabase";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { Avatar } from "../ProfileScreen/Avatar";
import { EditProfileModal } from "../ProfileScreen/EditProfileModal";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { useSettingsData } from "./settingsData";
import { SettingsSection } from "./SettingsSection";
import { SignOutModal } from "./SignOutModal";
import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

export const SettingsScreen = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setIsLoggedIn, setUserProfile, setShowSignUpForm } = useAppContext();
  const { disconnect } = useWallet();
  const {
    userImage,
    userData,
    isEditProfileModalVisible,
    setIsEditProfileModalVisible,
  } = useProfileContext();

  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] =
    useState(false);

  const { helpAndSupportOptions, accountActionsOptions } = useSettingsData();

  const handleLogout = async () => {
    try {
      // Clear secure storage
      await supabase.auth.signOut();

      // Disconnect wallet
      disconnect();

      // Clear user profile and sign up form state
      setUserProfile(null);
      setShowSignUpForm(false);

      // Set logged in state to false
      setIsLoggedIn(false);

      // Explicitly navigate to app/index
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still try to log out even if there's an error
      setIsLoggedIn(false);
      router.replace("/");
    }
  };

  const handleSignOut = () => {
    setIsSignOutModalVisible(false);
    handleLogout();
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountModalVisible(false);
    // TODO: Implement delete account functionality
    console.log("Delete account pressed");
  };

  // Update the options with actual handlers
  const updatedHelpAndSupportOptions = helpAndSupportOptions.map(option => ({
    ...option,
    onPress: () => console.log(`${option.labelKey} pressed`),
  }));

  const updatedAccountActionsOptions = accountActionsOptions.map(option => {
    if (option.id === "delete-account") {
      return {
        ...option,
        onPress: () => setIsDeleteAccountModalVisible(true),
      };
    }
    if (option.id === "sign-out") {
      return {
        ...option,
        onPress: () => setIsSignOutModalVisible(true),
      };
    }
    return option;
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        <Column
          $padding={8}
          $gap={24}
          $justifyContent="space-between"
          $alignItems="flex-start"
          style={{ flex: 1 }}
        >
          <Column $gap={24} $alignItems="flex-start">
            <Row $justifyContent="flex-start" $gap={12}>
              <PressableOpacity onPress={() => router.back()}>
                <MaterialIcon
                  name="keyboard-arrow-left"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </PressableOpacity>
              <Title5>{t("Settings")}</Title5>
            </Row>

            {/* AVATAR */}
            <Row $gap={12} $width="auto" $justifyContent="flex-start">
              <Avatar imgSrc={userImage} size={44} />
              <PressableOpacity
                onPress={() => setIsEditProfileModalVisible(true)}
              >
                <Column $width="auto" $alignItems="flex-start">
                  <Body1Emphasized>
                    {userData.username || "liamdig"}
                  </Body1Emphasized>
                  <Row $width="auto" $gap={4}>
                    <BodySSecondary>{t("Edit profile")}</BodySSecondary>
                    <MaterialIcon
                      name="chevron-right"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                  </Row>
                </Column>
              </PressableOpacity>
            </Row>

            {/* HELP & SUPPORT SECTION */}
            <SettingsSection
              titleKey="Help & Support"
              options={updatedHelpAndSupportOptions}
            />

            {/* ACCOUNT ACTIONS SECTION */}
            <SettingsSection
              titleKey="Account Actions"
              options={updatedAccountActionsOptions}
            />
          </Column>

          {/* REKT LOGO AND VERSION INFO */}
          <Column $gap={4} $alignItems="flex-start" style={{ width: "100%" }}>
            <RektLogo width={40} height={40} />
            <BodySSecondary>{t("REKT V2.0.12")}</BodySSecondary>
            <BodySSecondary>{t("COPYRIGHT © 2025")}</BodySSecondary>
          </Column>
        </Column>

        {/* MODALS */}
        {isEditProfileModalVisible && (
          <EditProfileModal
            visible={isEditProfileModalVisible}
            onRequestClose={() => setIsEditProfileModalVisible(false)}
          />
        )}

        {/* SIGN OUT CONFIRMATION MODAL */}
        {isSignOutModalVisible && (
          <SignOutModal
            visible={isSignOutModalVisible}
            onRequestClose={() => setIsSignOutModalVisible(false)}
            onConfirm={handleSignOut}
          />
        )}

        {/* DELETE ACCOUNT CONFIRMATION MODAL */}
        {isDeleteAccountModalVisible && (
          <DeleteAccountModal
            visible={isDeleteAccountModalVisible}
            onRequestClose={() => setIsDeleteAccountModalVisible(false)}
            onConfirm={handleDeleteAccount}
          />
        )}
      </ScreenContainer>
    </>
  );
};
