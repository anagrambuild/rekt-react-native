import { useRef, useState } from "react";
import { FlatList } from "react-native";

import defaultAvatar from "@/assets/images/app-pngs/avatar.png";
import {
  BodyM,
  Column,
  Gap,
  PressableOpacity,
  Row,
  SegmentContainer,
  SegmentControl,
  Title3,
} from "@/components";
import { useProfileContext } from "@/contexts";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { GenericCardComponent } from "./LeaderboardCards";
import {
  LeaderboardEntry,
  losersPnlMockData,
  PnlEntry,
  winnersPnlMockData,
} from "./leaderboardMockData";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";

const Ranks = ({
  view,
  setView,
}: {
  view: "winners" | "rekt";
  setView: (view: "pnl") => void;
}) => {
  const { userData } = useProfileContext();
  const theme = useTheme();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);

  const [timeline, setTimeline] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );

  // Mock user data - in real app this would come from context/API
  const currentUser = {
    id: "current-user",
    rank: view === "winners" ? 180 : 1200,
    username: userData.username,
    score: view === "winners" ? 9876 : 98,
    avatar: defaultAvatar,
    isWinner: view === "winners",
  };

  // Generate mock data based on view and timeline
  const getMockData = (): (LeaderboardEntry | PnlEntry)[] => {
    if (view === "winners") {
      return winnersPnlMockData.map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
    } else {
      return losersPnlMockData.map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
    }
  };

  const mockData = getMockData();

  const renderRankItem = ({ item }: { item: LeaderboardEntry | PnlEntry }) => {
    const isPnl = "isWinner" in item;
    const isWinner = isPnl ? item.isWinner : view === "winners";

    // Convert to LeaderboardEntry format for GenericCardComponent
    const leaderboardEntry = {
      id: item.id,
      rank: item.rank,
      username: item.username,
      score: isPnl
        ? (item as PnlEntry).amount
        : (item as LeaderboardEntry).score,
      avatar: item.avatar,
    };

    return (
      <GenericCardComponent
        entry={leaderboardEntry}
        isWinner={isWinner}
        isPnl={isPnl}
      />
    );
  };

  return (
    <Column style={{ flex: 1 }} $justifyContent="flex-start">
      <HeaderRow>
        <PressableOpacity onPress={() => setView("pnl")}>
          <Row $justifyContent="flex-start" $gap={8}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={theme.colors.textSecondary}
            />
            <Title3>{view === "winners" ? t("Winners") : t("Rekt")}</Title3>
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
      </HeaderRow>

      <Row>
        <BodyM
          style={{
            backgroundColor: "#3d3d3d",
            borderRadius: 8,
            padding: 2,
          }}
        >
          {"This screen is under development and this is not real data"}
        </BodyM>
      </Row>
      <Gap />

      <FlatList
        ref={flatListRef}
        data={mockData}
        renderItem={renderRankItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 4 }}
        style={{ width: "100%", marginBottom: 100 }}
      />

      {/* Floating Profile */}

      <FloatingProfile>
        <GenericCardComponent
          entry={{
            id: currentUser.id,
            rank: currentUser.rank,
            username: currentUser.username,
            score: currentUser.score,
            avatar: currentUser.avatar,
          }}
          isWinner={currentUser.isWinner}
          isPnl={true}
        />
      </FloatingProfile>
    </Column>
  );
};

const HeaderRow = styled(Row)`
  margin-bottom: 16px;
`;

const FloatingProfile = styled(PressableOpacity)`
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  z-index: 1000;
`;

export default Ranks;
