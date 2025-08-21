import { BodySEmphasized, PressableOpacity, Row } from "@/components";

import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";

export const EditButton = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Button onPress={onPress}>
      <Row $width="auto" $gap={6} $alignItems="center">
        <MaterialIcon name="edit" size={16} color={theme.colors.textPrimary} />
        <BodySEmphasized>{t("Edit")}</BodySEmphasized>
      </Row>
    </Button>
  );
};

const Button = styled(PressableOpacity)`
  background-color: ${({ theme }: any) => theme.colors.cardEmphasized};
  padding: 12px;
  border-radius: 100px;
`;
