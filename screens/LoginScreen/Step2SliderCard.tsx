import { useState } from "react";

import skull from "@/assets/images/app-pngs/skull.png";
import {
  BodyM,
  BodyMSecondary,
  BodySEmphasized,
  Card,
  Column,
  Divider,
  PulsatingContainer,
  Row,
  Switch,
} from "@/components";

import { Step2HorizontalSlider } from "./Step2HorizontalSlider";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

export const Step2SliderCard = ({
  leverage,
  amount,
  setLeverage,
  disableAutoTimer = () => {},
}: {
  leverage: number;
  amount: number;
  setLeverage: (leverage: number) => void;
  disableAutoTimer?: () => void;
}) => {
  const { t } = useTranslation();
  const [isMaxLeverageOn, setIsMaxLeverageOn] = useState(false);

  return (
    <Card $padding={16} style={{ gap: 8 }}>
      <Column $gap={16} $alignItems="flex-start">
        <Row $padding={0} style={{ height: 30 }}>
          <BodySEmphasized>{t("Leverage")}</BodySEmphasized>
          {(leverage >= 100 || isMaxLeverageOn) && (
            <Switch
              onPress={() => {
                setIsMaxLeverageOn(!isMaxLeverageOn);
                disableAutoTimer();
              }}
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
      <Step2HorizontalSlider
        setLeverage={setLeverage}
        leverage={leverage}
        isMaxLeverageOn={isMaxLeverageOn}
      />
    </Card>
  );
};
