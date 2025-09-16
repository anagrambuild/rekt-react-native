import { Platform } from "react-native";

import { AndroidBannerRow } from "./AndroidBannerRow";
import { IosBannerRow } from "./IosBannerRow";

export const AnimatedBannerRow = ({ items }: { items: any[] }) => {
  return Platform.OS === "android" ? (
    <AndroidBannerRow items={items} />
  ) : (
    <IosBannerRow items={items} />
  );
};
