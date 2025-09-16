import { useState } from "react";

import {
  Column,
  PressableOpacity,
  Row,
  SegmentContainer,
  SegmentControl,
  Title3,
} from "@/components";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

const Ranks = ({
  view,
  setView,
}: {
  view: "winners" | "rekt";
  setView: (view: "pnl") => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [timeline, setTimeline] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  return (
    <Column style={{ flex: 1 }} $justifyContent="flex-start">
      <Row>
        <PressableOpacity onPress={() => setView("pnl")}>
          <Row $justifyContent="flex-start" $gap={8}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={theme.colors.textSecondary}
            />
            <Title3>{view === "winners" ? "Winners" : "Rekt"}</Title3>
          </Row>
        </PressableOpacity>
        <SegmentContainer>
          <SegmentControl
            label={t("1D")}
            selected={timeline === "daily"}
            onPress={() => setTimeline("daily")}
          />
          <SegmentControl
            label={t("7D")}
            selected={timeline === "weekly"}
            onPress={() => setTimeline("weekly")}
          />
          <SegmentControl
            label={t("30D")}
            selected={timeline === "monthly"}
            onPress={() => setTimeline("monthly")}
          />
        </SegmentContainer>
      </Row>
    </Column>
  );
};

export default Ranks;
