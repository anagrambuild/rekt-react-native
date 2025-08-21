import SettingsSlider from "@/assets/images/app-svgs/settings-slider.svg";
import { PressableOpacity, Row, Title2 } from "@/components";

import { EditButton } from "./EditButton";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

export const ProfileHeader = ({
  setIsEditProfileModalVisible,
}: {
  setIsEditProfileModalVisible: (visible: boolean) => void;
}) => {
  const { t } = useTranslation();

  const handleEditPress = () => {
    setIsEditProfileModalVisible(true);
  };

  const handleSettingsPress = () => {
    router.push("/settings");
  };
  return (
    <Row>
      <Title2>{t("Profile")}</Title2>
      <Row $gap={12} $width="auto">
        <EditButton onPress={handleEditPress} />
        <PressableOpacity onPress={handleSettingsPress}>
          <SettingsSlider />
        </PressableOpacity>
      </Row>
    </Row>
  );
};
