import { midFireUrl } from "@/assets/videos";
import { ScreenContainer } from "@/components/common/containers";

import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme } from "styled-components/native";

export const LoadingScreen = () => {
  const theme = useTheme();

  const player = useVideoPlayer(midFireUrl, player => {
    player.loop = true;
    player.play();
  });

  return (
    <ScreenContainer
      alignItems="center"
      justifyContent="flex-end"
      noPadding
      contentContainerStyle={{
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: theme.colors.background,
        position: "relative",
      }}
    >
      <VideoView
        player={player}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "50%",
          zIndex: 0,
        }}
        pointerEvents="none"
        nativeControls={false}
      />
    </ScreenContainer>
  );
};
