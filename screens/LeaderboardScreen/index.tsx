import { FlatList, Platform } from "react-native";

import { BodyM, Column, Gap, Row, Title2 } from "@/components";

import {
  FirstPlaceCardComponent,
  GenericCardComponent,
  SecondThirdCardComponent,
} from "./LeaderboardCards";
import { LeaderboardEntry, leaderboardMockData } from "./leaderboardMockData";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";

const screenPadding = 16;
const paddingTop = Platform.OS === "ios" ? 60 : 40;

export const renderTopThree = () => {
  const firstPlace = leaderboardMockData[0];
  const secondPlace = leaderboardMockData[1];
  const thirdPlace = leaderboardMockData[2];

  return (
    <Column $gap={4}>
      <FirstPlaceCardComponent entry={firstPlace} />
      <Row $gap={4} $justifyContent="center">
        <SecondThirdCardComponent entry={secondPlace} />
        <SecondThirdCardComponent entry={thirdPlace} />
      </Row>
    </Column>
  );
};

const renderGenericCard = ({ item }: { item: LeaderboardEntry }) => {
  return <GenericCardComponent entry={item} />;
};

export const LeaderboardScreen = () => {
  const { t } = useTranslation();
  const remainingEntries = leaderboardMockData.slice(3);

  return (
    <Column
      style={{ flex: 1, marginTop: paddingTop, padding: screenPadding }}
      alignItems="flex-start"
    >
      <Column $gap={4} $alignItems="flex-start">
        <Title2>{t("Leaderboard")}</Title2>
        <Row>
          <BodyM style={{ backgroundColor: "#333333" }}>
            {t("This screen is under development and this is not real data")}
          </BodyM>
        </Row>
        <Gap height={36} />
        {renderTopThree()}
      </Column>
      <FlatListContainer>
        <FlatList
          data={remainingEntries}
          renderItem={renderGenericCard}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, gap: 4 }}
        />
      </FlatListContainer>
    </Column>
  );
};

const FlatListContainer = styled.View`
  width: 100%;
  flex: 1;
  margin-top: 4px;
`;
