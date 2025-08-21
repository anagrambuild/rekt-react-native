import skull from "@/assets/images/app-pngs/skull.png";
import {
  BodyM,
  BodyMSecondary,
  BodySEmphasized,
  Card,
  Column,
  Divider,
  HorizontalSlider,
  PulsatingContainer,
  Row,
  Switch,
} from "@/components";
import { useHomeContext } from "@/contexts/HomeContext";

import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

export const SliderCard = ({
  leverage,
  amount,
  setLeverage,
}: {
  leverage: number;
  amount: number;
  setLeverage?: (leverage: number) => void;
}) => {
  const { t } = useTranslation();
  const {
    selectedToken,
    solTrade,
    setSolTrade,
    ethTrade,
    setEthTrade,
    btcTrade,
    setBtcTrade,
  } = useHomeContext();

  // Get current trade state based on selected token
  const getCurrentTrade = () => {
    switch (selectedToken) {
      case "sol":
        return solTrade;
      case "eth":
        return ethTrade;
      case "btc":
        return btcTrade;
      default:
        return solTrade;
    }
  };

  const setCurrentTrade = (trade: any) => {
    switch (selectedToken) {
      case "sol":
        setSolTrade(trade);
        break;
      case "eth":
        setEthTrade(trade);
        break;
      case "btc":
        setBtcTrade(trade);
        break;
      default:
        setSolTrade(trade);
        break;
    }
  };

  const currentTrade = getCurrentTrade();
  const isMaxLeverageOn = currentTrade?.isMaxLeverageOn || false;

  const setIsMaxLeverageOn = (value: boolean) => {
    setCurrentTrade({
      ...currentTrade,
      side: currentTrade?.side || "short",
      entryPrice: currentTrade?.entryPrice || 0,
      amount: currentTrade?.amount || 10,
      leverage: currentTrade?.leverage || 1,
      status: "draft",
      isMaxLeverageOn: value,
    });
  };

  return (
    <Card $padding={16} style={{ gap: 8 }}>
      <Column $gap={16} $alignItems="flex-start">
        <Row $padding={0} style={{ height: 30 }}>
          <BodySEmphasized>{t("Leverage")}</BodySEmphasized>
          {(leverage >= 100 || isMaxLeverageOn) && (
            <Switch
              onPress={() => setIsMaxLeverageOn(!isMaxLeverageOn)}
              isOn={isMaxLeverageOn}
              icon={
                <PulsatingContainer>
                  <Image source={skull} style={{ width: 30, height: 30 }} />
                </PulsatingContainer>
              }
            />
          )}
        </Row>
        <Divider />
        <Column $gap={8} $alignItems="flex-start">
          <Row>
            <BodyM>{leverage}x</BodyM>
            <BodyM>{`$${leverage * amount}`}</BodyM>
          </Row>
          <Row>
            <BodyMSecondary>{t("Leverage")}</BodyMSecondary>
            <BodyMSecondary>{t("Buying power")}</BodyMSecondary>
          </Row>
        </Column>
      </Column>
      <HorizontalSlider setLeverage={setLeverage} leverage={leverage} />
    </Card>
  );
};
