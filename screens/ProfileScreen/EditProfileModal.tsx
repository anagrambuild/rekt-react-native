import { useState } from "react";
import { ActivityIndicator, Alert, Image, Keyboard } from "react-native";

import {
  BodyMSecondary,
  BodyS,
  Card,
  Column,
  Gap,
  Modal,
  ModalIconButton,
  PrimaryButton,
  Row,
  SecondaryButton,
  StyledInput,
  Title4,
} from "@/components";
import { useAppContext, useProfileContext } from "@/contexts";
import { useImagePicker, useUsernameValidation } from "@/hooks";
import {
  deleteAvatar,
  updateUserProfile,
  uploadAvatar,
} from "@/utils/backendApi";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme } from "styled-components/native";
import { Toast } from "toastify-react-native";

export const EditProfileModal = ({
  visible,
  onRequestClose,
}: {
  visible: boolean;
  onRequestClose: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { userData, userId } = useProfileContext();
  const { setUserProfile } = useAppContext();
  const [username, setUsername] = useState(userData.username);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { takePhoto, pickFromLibrary, isLoading } = useImagePicker();

  // Use the unified username validation hook
  const usernameValidation = useUsernameValidation(username, {
    currentUsername: userData.username,
  });

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    // Error state will be managed by useEffect based on query results
  };

  const handleSave = async () => {
    if (!userId) {
      Toast.show({
        text1: t("Error"),
        text2: t("Profile ID not found"),
        type: "error",
      });
      return;
    }

    // Validate username if changed
    if (username !== userData.username) {
      // Check required validation first
      if (!usernameValidation.validateRequired()) {
        return;
      }

      // Check username validation using the hook
      if (!usernameValidation.isValid) {
        if (usernameValidation.isChecking) {
          Toast.show({
            text1: t("Please wait"),
            text2: t("Checking username availability..."),
            type: "info",
          });
          return;
        }
        if (usernameValidation.hasError) {
          Toast.show({
            text1: t("Error"),
            text2: usernameValidation.error,
            type: "error",
          });
          return;
        }
        // Generic validation failure
        Toast.show({
          text1: t("Error"),
          text2: t("Please check your username and try again"),
          type: "error",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let avatarUrl: string | undefined;

      // Upload new image if one was selected
      if (newImageUri) {
        try {
          avatarUrl = await uploadAvatar(
            newImageUri,
            `avatar_${Date.now()}.jpg`
          );

          // Only delete old avatar after successful upload of new one
          if (
            avatarUrl &&
            userData.imgSrc &&
            typeof userData.imgSrc === "string" &&
            userData.imgSrc.startsWith("http")
          ) {
            // Don't await this - we don't want to fail the profile update if deletion fails
            deleteAvatar(userData.imgSrc).catch(error => {
              console.warn(
                "Failed to delete old avatar, but continuing:",
                error
              );
            });
          }
        } catch (avatarError) {
          console.warn("Avatar upload failed:", avatarError);
          Toast.show({
            text1: t("Warning"),
            text2: t(
              "Failed to upload new profile picture, but other changes were saved."
            ),
            type: "error",
          });
        }
      }

      // Handle image removal (set avatar to empty)
      if (newImageUri === "") {
        // Delete old avatar if it exists
        if (
          userData.imgSrc &&
          typeof userData.imgSrc === "string" &&
          userData.imgSrc.startsWith("http")
        ) {
          // Don't await this - we don't want to fail the profile update if deletion fails
          deleteAvatar(userData.imgSrc).catch(error => {
            console.warn(
              "Failed to delete old avatar during removal, but continuing:",
              error
            );
          });
        }
        avatarUrl = ""; // Set to empty string to remove avatar
      }

      // Update profile with new data
      const updateData: { username?: string; avatar_url?: string } = {};

      if (username !== userData.username) {
        updateData.username = username;
      }

      if (avatarUrl !== undefined) {
        updateData.avatar_url = avatarUrl;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await updateUserProfile(userId, updateData);

        // Update the app context with new user data
        setUserProfile(updatedUser);

        Toast.show({
          text1: t("Success"),
          text2: t("Profile updated successfully"),
          type: "success",
        });
      }

      onRequestClose();
    } catch (error) {
      console.error("Profile update failed:", error);
      Toast.show({
        text1: t("Error"),
        text2: t("Failed to update profile. Please try again."),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUsername(userData.username);
    setNewImageUri(null);
    onRequestClose();
  };

  const handleImageUploadModal = () => {
    Alert.alert(t("Upload"), "", [
      {
        text: t("Take photo"),
        onPress: async () => {
          const result = await takePhoto();
          if (result) {
            setNewImageUri(result.uri);
          }
        },
      },
      {
        text: t("Choose from library"),
        onPress: async () => {
          const result = await pickFromLibrary();
          if (result) {
            setNewImageUri(result.uri);
          }
        },
      },
      { text: t("Cancel"), style: "cancel" },
    ]);
  };

  const handleImageRemoval = async () => {
    setNewImageUri(""); // Set to empty string to indicate removal
  };

  // Determine which image to show
  const currentImageSrc =
    newImageUri !== null
      ? newImageUri === ""
        ? null
        : newImageUri // empty string means removed
      : userData.imgSrc;

  const hasImage =
    currentImageSrc && currentImageSrc !== "" && currentImageSrc !== null;

  return (
    <Modal visible={visible} onRequestClose={handleClose}>
      <Column $gap={24} $alignItems="flex-start">
        <Row $gap={12} $justifyContent="flex-start">
          <MaterialIcon
            name="edit"
            size={18}
            color={theme.colors.textPrimary}
          />
          <Title4>{t("Edit profile")}</Title4>
        </Row>
        <Column $gap={4}>
          <Card $padding={16}>
            <Row $width="auto" $alignItems="flex-start">
              <Column
                $gap={4}
                $width="auto"
                $alignItems="flex-start"
                $justifyContent="flex-start"
              >
                <BodyS>{t("Profile picture")}</BodyS>
                <BodyMSecondary>{t("Max. size 5MB")}</BodyMSecondary>
                <Gap height={12} />
                {hasImage ? (
                  <ModalIconButton
                    onPress={handleImageRemoval}
                    icon={
                      <MaterialIcon
                        name="delete-outline"
                        size={16}
                        color={theme.colors.onSecondary}
                      />
                    }
                  >
                    {t("Remove")}
                  </ModalIconButton>
                ) : (
                  <ModalIconButton
                    onPress={handleImageUploadModal}
                    disabled={isLoading}
                    icon={
                      <MaterialIcon
                        name="upload"
                        size={16}
                        color={theme.colors.onSecondary}
                      />
                    }
                  >
                    {isLoading ? "..." : t("Upload")}
                  </ModalIconButton>
                )}
              </Column>
              <Image
                source={
                  hasImage
                    ? typeof currentImageSrc === "string"
                      ? { uri: currentImageSrc }
                      : currentImageSrc
                    : require("@/assets/images/app-pngs/avatar.png")
                }
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                }}
                resizeMode="cover"
              />
            </Row>
          </Card>

          <Card $padding={16}>
            <Column
              $gap={4}
              $width="auto"
              $alignItems="flex-start"
              $justifyContent="flex-start"
            >
              <BodyS>{t("Username")}</BodyS>
              <BodyMSecondary>
                {t("Only letters & numbers allowed")}
              </BodyMSecondary>
              <Row $gap={8} $alignItems="center">
                <StyledInputContainer>
                  <StyleAt>@</StyleAt>
                  <StyledInput
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder={t("Enter your username")}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </StyledInputContainer>
                {usernameValidation.isChecking && (
                  <ActivityIndicator size="small" color={theme.colors.tint} />
                )}
                {usernameValidation.isAvailable === true &&
                  !usernameValidation.hasError &&
                  username !== userData.username && (
                    <SuccessIndicator>✓</SuccessIndicator>
                  )}
                {(usernameValidation.isAvailable === false ||
                  usernameValidation.hasError) && (
                  <ErrorIndicator>✗</ErrorIndicator>
                )}
              </Row>
              {usernameValidation.hasError ? <ErrorText>{usernameValidation.error}</ErrorText> : null}
            </Column>
          </Card>
        </Column>
        <Column $gap={8}>
          <PrimaryButton
            onPress={handleSave}
            disabled={usernameValidation.hasError || isSubmitting}
            loading={isSubmitting}
          >
            {t("Save changes")}
          </PrimaryButton>
          <SecondaryButton onPress={handleClose} disabled={isSubmitting}>
            {t("Cancel")}
          </SecondaryButton>
        </Column>
      </Column>
    </Modal>
  );
};

const StyledInputContainer = styled.View`
  position: relative;
  flex: 1;
`;

const StyleAt = styled.Text`
  position: absolute;
  left: 0;
  top: 16px;
  color: ${({ theme }: any) => theme.colors.textSecondary};
  z-index: 1;
`;

const ErrorText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.loss};
  font-size: 12px;
  font-family: "Geist";
  margin-left: 4px;
`;

const SuccessIndicator = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.profit};
  font-size: 16px;
  font-weight: bold;
`;

const ErrorIndicator = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.loss};
  font-size: 16px;
  font-weight: bold;
`;
