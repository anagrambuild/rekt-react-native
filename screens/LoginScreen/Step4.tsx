import { useState } from "react";
import { Platform, View } from "react-native";

import iphoneFrame from "@/assets/images/app-pngs/iphone-frame.png";
import topNav from "@/assets/images/app-pngs/top-nav.png";
import {
  AmountInput,
  AppleGooglePayButton,
  BodyMEmphasized,
  BodySSecondary,
  Column,
  Gap,
  PresetButton,
  Row,
  ScrollRow,
  Title4,
} from "@/components";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

const googleText = "Instant and secure, backed by Google Pay";
const appleText = "Instant and secure, backed by Apple Pay";

const isAndroid = Platform.OS === "android";

export const Step4 = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [value, setvalue] = useState("200.00");
  return (
    <Column
      $padding={0}
      $alignItems="center"
      style={{
        justifyContent: "flex-start",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* iPhone Frame as background wrapper */}
      <Image
        source={iphoneFrame}
        contentFit="contain"
        style={{
          width: "100%",
          height: 640,
          alignSelf: "stretch",
        }}
      />

      {/* Content positioned inside the frame */}
      <View
        style={{
          marginTop: -620,
          left: 0,
          right: 0,
          zIndex: 1000,
          alignItems: "center",
          width: "100%",
        }}
      >
        <Image
          source={topNav}
          contentFit="contain"
          style={{
            width: "95%",
            height: 60,
          }}
        />
        <View
          style={{
            paddingStart: 32,
            paddingEnd: 32,
            overflow: "hidden",
            width: "100%",
            marginTop: 16,
            gap: 16,
          }}
        >
          <Row $justifyContent="flex-start" $alignItems="center" $gap={8}>
            <MaterialIcons
              name="chevron-left"
              size={24}
              color={theme.colors.textPrimary}
            />
            <Title4>{t("Deposit")}</Title4>
          </Row>
          <Gap height={8} />
          <Column $gap={16}>
            <BodyMEmphasized>{t("Enter amount")}</BodyMEmphasized>
            <AmountInput
              value={value}
              onChangeText={() => {}}
              disabled
              editable={false}
            />
            <Gap height={8} />
            <ScrollRow $gap={8} keyboardShouldPersistTaps="always">
              <PresetButton value={"$10"} onPress={() => setvalue("$10")} />
              <PresetButton value={"$50"} onPress={() => setvalue("$50")} />
              <PresetButton value={"$100"} onPress={() => setvalue("$100")} />
              <PresetButton value={"$200"} onPress={() => setvalue("$200")} />
              <PresetButton value={"$500"} onPress={() => setvalue("$500")} />
              <PresetButton value={"$1000"} onPress={() => setvalue("$1000")} />
            </ScrollRow>
            <Gap height={8} />
            <AppleGooglePayButton />
            <Row $gap={4} $justifyContent="center">
              <MaterialIcons
                name="lock"
                size={16}
                color={theme.colors.textSecondary}
              />
              <BodySSecondary>
                {t(isAndroid ? googleText : appleText)}
              </BodySSecondary>
            </Row>
            <Gap height={16} />
          </Column>
        </View>
      </View>
    </Column>
  );
};
