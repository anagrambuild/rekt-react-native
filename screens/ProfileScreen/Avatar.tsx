import defaultAvatar from "@/assets/images/app-pngs/avatar.png";
import { badgeUrl } from "@/assets/videos";

import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import styled, { DefaultTheme } from "styled-components/native";

export const Avatar = ({
  imgSrc,
  size = 80,
}: {
  imgSrc: any;
  size?: number;
}) => {
  const hasImage = imgSrc && imgSrc !== "" && imgSrc !== null;
  // Create the video player, set to loop and play automatically
  const player = useVideoPlayer(badgeUrl, player => {
    player.loop = true;
    player.play();
  });

  return (
    <AvatarContainer $size={size}>
      <AvatarImage source={hasImage ? imgSrc : defaultAvatar} $size={size} />
      <BadgeContainer>
        <VideoView
          player={player}
          style={{ width: 32, height: 32, borderRadius: 16 }}
          pointerEvents="none"
          nativeControls={false}
        />
      </BadgeContainer>
    </AvatarContainer>
  );
};

const AvatarContainer = styled.View`
  padding: 6px;
  border-radius: ${({ $size }: { $size: number }) => $size / 2 + 6}px;
  border-width: 3px;
  border-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.textSecondary};
`;

const AvatarImage = styled(Image)`
  width: ${({ $size }: { $size: number }) => $size}px;
  height: ${({ $size }: { $size: number }) => $size}px;
  border-radius: ${({ $size }: { $size: number }) => $size / 2}px;
`;

const BadgeContainer = styled.View`
  position: absolute;
  bottom: 0;
  right: -8px;
`;
