import { useState } from "react";
import { FlatList, Platform } from "react-native";

import DollarIcon from "@/assets/images/app-svgs/dollar.svg";
import DollarOutlineIcon from "@/assets/images/app-svgs/dollar-outline.svg";
import PointsWhiteIcon from "@/assets/images/app-svgs/points-white.svg";
import PointsWhiteOutlineIcon from "@/assets/images/app-svgs/points-white-outline.svg";
import {
  BodyM,
  Column,
  Row,
  SegmentContainer,
  SegmentControl,
  Title2,
} from "@/components";

import {
  FirstPlaceCardComponent,
  GenericCardComponent,
  SecondThirdCardComponent,
} from "./LeaderboardCards";
import { LeaderboardEntry, leaderboardMockData } from "./leaderboardMockData";
import { PnlView } from "./PnlView";
import Ranks from "./Ranks";
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

const renderGenericCard = ({
  item,
  isWinner,
  isPnl,
}: {
  item: LeaderboardEntry;
  isWinner: boolean;
  isPnl: boolean;
}) => {
  return (
    <GenericCardComponent entry={item} isWinner={isWinner} isPnl={isPnl} />
  );
};

export const LeaderboardScreen = () => {
  const { t } = useTranslation();
  const remainingEntries = leaderboardMockData.slice(3);

  const [view, setView] = useState<"leaderboard" | "pnl" | "winners" | "rekt">(
    "leaderboard"
  );

  const isRanks = view === "winners" || view === "rekt";
  return (
    <Column
      style={{
        flex: 1,
        marginTop: paddingTop,
        padding: screenPadding,
        paddingBottom: 4,
      }}
      alignItems="flex-start"
    >
      {!isRanks && (
        <Column $gap={4} $alignItems="flex-start">
          <Row>
            <Title2>{t("Stats")}</Title2>
            <SegmentContainer>
              <SegmentControl
                Svg={PointsWhiteIcon}
                SecondarySvg={PointsWhiteOutlineIcon}
                label={t("Leaderboard")}
                selected={view === "leaderboard"}
                onPress={() => setView("leaderboard")}
              />
              <SegmentControl
                Svg={DollarIcon}
                SecondarySvg={DollarOutlineIcon}
                label={t("P&L")}
                selected={view === "pnl"}
                onPress={() => setView("pnl")}
              />
            </SegmentContainer>
          </Row>
          <Gap>
            <Row $width="auto">
              <BodyM style={{ backgroundColor: "#333333" }}>
                {t(
                  "This screen is under development and this is not real data"
                )}
              </BodyM>
            </Row>
          </Gap>
        </Column>
      )}
      {view === "leaderboard" && (
        <>
          {renderTopThree()}
          <FlatListContainer>
            <FlatList
              data={remainingEntries}
              renderItem={({ item }) =>
                renderGenericCard({ item, isWinner: false, isPnl: false })
              }
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 4 }}
            />
          </FlatListContainer>
        </>
      )}
      {view === "pnl" && <PnlView setView={setView} />}
      {isRanks && <Ranks view={view} setView={setView} />}
    </Column>
  );
};

const FlatListContainer = styled.View`
  width: 100%;
  flex: 1;
  margin-top: 4px;
`;

const Gap = styled.View`
  height: 48px;
  width: 100%;
  margin: 8px 0;
`;
