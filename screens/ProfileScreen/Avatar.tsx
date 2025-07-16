import { PressableOpacity } from '@/components';

import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import styled, { DefaultTheme } from 'styled-components/native';

export const Avatar = ({ imgSrc }: { imgSrc: any }) => {
  const onUploadPress = () => {
    console.log('upload');
  };

  // Create the video player, set to loop and play automatically
  const player = useVideoPlayer(
    require('@/assets/videos/add-pfp.mp4'),
    (player) => {
      player.loop = true;
      player.play();
    }
  );

  return (
    <AvatarContainer>
      <AvatarImage source={imgSrc} />
      <UploadButtonContainer>
        <PressableOpacity onPress={onUploadPress}>
          <VideoView
            player={player}
            style={{ width: 32, height: 32, borderRadius: 16 }}
          />
        </PressableOpacity>
      </UploadButtonContainer>
    </AvatarContainer>
  );
};

const imgSize = 80;
const AvatarContainer = styled.View`
  padding: 6px;
  border-radius: ${imgSize / 2 + 6}px;
  border-width: 3px;
  border-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.textSecondary};
`;

const AvatarImage = styled(Image)`
  width: ${imgSize}px;
  height: ${imgSize}px;
  border-radius: ${imgSize / 2}px;
`;

const UploadButtonContainer = styled.View`
  position: absolute;
  bottom: 0;
  right: -8px;
`;
