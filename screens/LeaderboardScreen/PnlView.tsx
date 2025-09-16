import React from "react";
import { FlatList, Image } from "react-native";

import defaultAvatar from "@/assets/images/app-pngs/avatar.png";
import {
  BodyXSMonoSecondary,
  Column,
  PressableOpacity,
  Row,
  Title3,
} from "@/components";
import { useProfileContext } from "@/contexts";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { GenericCardComponent } from "./LeaderboardCards";
import {
  losersPnlMockData,
  PnlEntry,
  winnersPnlMockData,
} from "./leaderboardMockData";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

const renderPnlCard = ({ item }: { item: PnlEntry }) => {
  // Convert PnlEntry to LeaderboardEntry format for GenericCardComponent
  const leaderboardEntry = {
    id: item.id,
    rank: item.rank,
    username: item.username,
    score: item.amount,
    avatar: item.avatar,
  };

  return (
    <GenericCardComponent
      entry={leaderboardEntry}
      isWinner={item.isWinner}
      isPnl={true}
    />
  );
};

export const PnlView: React.FC<{
  setView: (view: "winners" | "rekt") => void;
}> = ({ setView }) => {
  const { t } = useTranslation();
  const { userImage } = useProfileContext();
  const hasImage = userImage && userImage !== "" && userImage !== null;
  const theme = useTheme();

  return (
    <PnlContainer>
      <Column $gap={16} style={{ flex: 1 }}>
        {/* Winners Section */}
        <Section>
          <SectionHeader onPress={() => setView("winners")}>
            <Title3>{t("Winners")}</Title3>
            <Row $width="auto" $gap={8}>
              <UserRankIndicator>
                <UserAvatar source={hasImage ? defaultAvatar : defaultAvatar} />
                <BodyXSMonoSecondary>#180</BodyXSMonoSecondary>
              </UserRankIndicator>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.textSecondary}
              />
            </Row>
          </SectionHeader>
          <FlatList
            data={winnersPnlMockData}
            renderItem={renderPnlCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 4 }}
            style={{ flex: 1 }}
          />
        </Section>

        {/* Losers Section */}
        <Section>
          <SectionHeader onPress={() => setView("rekt")}>
            <Title3>{t("Rekt")}</Title3>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.textSecondary}
            />
          </SectionHeader>
          <FlatList
            data={losersPnlMockData}
            renderItem={renderPnlCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 4 }}
            style={{ flex: 1 }}
          />
        </Section>
      </Column>
    </PnlContainer>
  );
};

const PnlContainer = styled.View`
  width: 100%;
  flex: 1;
`;

const Section = styled.View`
  width: 100%;
  flex: 1;
`;

const SectionHeader = styled(PressableOpacity)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const UserRankIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
  padding: 4px 8px 4px 0;
  border-radius: 12px;
`;

const UserAvatar = styled(Image)`
  width: 24px;
  height: 24px;
  border-radius: 12px;
`;
