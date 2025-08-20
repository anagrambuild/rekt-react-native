import { Image } from "react-native";

import LeaderLeavesLeft from "@/assets/images/app-svgs/leader-leaves-left.svg";
import LeaderLeavesRight from "@/assets/images/app-svgs/leader-leaves-right.svg";
import PointsNoBg from "@/assets/images/app-svgs/points-no-bg.svg";
import {
  BodyM,
  BodySMono,
  BodyXSMonoSecondary,
  Card,
  Column,
  Row,
  Title4,
} from "@/components";

import { LeaderboardEntry } from "./leaderboardMockData";
import styled, { DefaultTheme } from "styled-components/native";

interface FirstPlaceCardProps {
  entry: LeaderboardEntry;
}

export const FirstPlaceCardComponent: React.FC<FirstPlaceCardProps> = ({
  entry,
}) => (
  <Card>
    <Column $gap={12} $padding={12}>
      <RankText>#{entry.rank}</RankText>
      <Row $padding={12} $width="auto">
        <LeaderLeavesLeft />
        <AvatarContainer>
          <Avatar source={entry.avatar} />
        </AvatarContainer>
        <LeaderLeavesRight />
      </Row>
      <Title4>{entry.username}</Title4>
      <ScoreContainer>
        <PointsNoBg />
        <BodySMono>{entry.score.toLocaleString()}</BodySMono>
      </ScoreContainer>
    </Column>
  </Card>
);

interface SecondThirdCardProps {
  entry: LeaderboardEntry;
}

export const SecondThirdCardComponent: React.FC<SecondThirdCardProps> = ({
  entry,
}) => (
  <SecondThirdCard>
    <RankText>#{entry.rank}</RankText>
    <AvatarContainer>
      <Avatar source={entry.avatar} />
    </AvatarContainer>
    <BodyM>{entry.username}</BodyM>
    <ScoreContainer>
      <PointsNoBg />
      <BodySMono>{entry.score.toLocaleString()}</BodySMono>
    </ScoreContainer>
  </SecondThirdCard>
);

interface GenericCardProps {
  entry: LeaderboardEntry;
}

export const GenericCardComponent: React.FC<GenericCardProps> = ({ entry }) => (
  <GenericCard>
    <GenericAvatar source={entry.avatar} />
    <Column $gap={4} $alignItems="flex-start" style={{ flex: 1 }}>
      <BodyXSMonoSecondary>#{entry.rank}</BodyXSMonoSecondary>
      <Row $justifyContent="space-between">
        <BodyM>{entry.username}</BodyM>
        <Row $gap={4} $width="auto" $justifyContent="flex-end">
          <PointsNoBg />
          <BodySMono>{entry.score.toLocaleString()}</BodySMono>
        </Row>
      </Row>
    </Column>
  </GenericCard>
);

const RankText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.loss};
  font-size: 14px;
  font-weight: 600;
  font-family: "Geist";
  position: absolute;
  top: 12px;
  left: 12px;
`;

const AvatarContainer = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`;

const Avatar = styled(Image)`
  width: 80px;
  height: 80px;
  border-radius: 40px;
`;

const ScoreContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

// Second/Third Place Cards
const SecondThirdCard = styled(Card)`
  flex: 1;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 12px;
`;

// Generic Card for ranks 4+
const GenericCard = styled(Card)`
  width: 100%;
  padding: 12px;
  flex-direction: row;
  align-items: center;
  padding: 16px;
`;

const GenericAvatar = styled(Image)`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  margin-right: 16px;
`;
