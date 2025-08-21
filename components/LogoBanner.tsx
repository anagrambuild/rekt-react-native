import PointsIcon from "@/assets/images/app-svgs/points.svg";
import UsdcIcon from "@/assets/images/app-svgs/usdc.svg";
import RektLogo from "@/assets/images/rekt-logo.svg";
import { useWallet } from "@/contexts/WalletContext";

import { Row } from "./common/containers";
import { BodyMSecondary } from "./common/texts";
import styled, { DefaultTheme } from "styled-components/native";

export const LogoBanner = () => {
  const { usdcBalance, isLoadingBalance } = useWallet();
  return (
    <Row>
      <RektLogo width={60} height={60} />
      <Row $justifyContent="flex-end" $gap={16} $width="auto">
        <TokenChip Icon={PointsIcon} value="58K" />
        <TokenChip
          Icon={UsdcIcon}
          value={
            isLoadingBalance ? "..." : (usdcBalance || 6900).toLocaleString()
          }
        />
      </Row>
    </Row>
  );
};

const Container = styled.View`
  flex-direction: row;
  gap: 4px;
`;

const StyledTokenChip = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.backgroundSecondary};
  padding: 2px 12px 4px 0;
  border-radius: 8px;
`;

interface TokenChipProps {
  Icon: React.ComponentType<{ width?: number; height?: number }>;
  value: string;
}

export const TokenChip = ({ Icon, value }: TokenChipProps) => {
  return (
    <Container>
      <StyledTokenChip>
        <Icon width={28} height={28} />
        <BodyMSecondary>{value}</BodyMSecondary>
      </StyledTokenChip>
    </Container>
  );
};
