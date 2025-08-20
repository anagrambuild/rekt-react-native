import { View } from "react-native";

import DiceIcon from "@/assets/images/app-svgs/dice.svg";
import RektLogo from "@/assets/images/rekt-logo.svg";
import { TabIconWithIndicator } from "@/components";

// https://icons.expo.fyi/Index
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcon from "@expo/vector-icons/MaterialIcons";

import { Tabs } from "expo-router";
import { useTheme } from "styled-components/native";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.tint,
        headerShown: false,
        tabBarIconStyle: { marginTop: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <TabIconWithIndicator focused={focused}>
              <View style={{ marginBottom: -10 }}>
                <RektLogo width={40} height={40} />
              </View>
            </TabIconWithIndicator>
          ),
        }}
      />
      <Tabs.Screen
        name="minigame"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithIndicator focused={focused}>
              <DiceIcon width={24} height={24} color={color} />
            </TabIconWithIndicator>
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithIndicator focused={focused}>
              <MaterialIcon name="bar-chart" size={24} color={color} />
            </TabIconWithIndicator>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithIndicator focused={focused}>
              <FontAwesome name="user-circle" size={20} color={color} />
            </TabIconWithIndicator>
          ),
        }}
      />
    </Tabs>
  );
}
