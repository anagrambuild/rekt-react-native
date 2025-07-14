import { IconButton } from '@/components';

import { Image } from 'expo-image';
import styled, { DefaultTheme } from 'styled-components/native';

export const Avatar = ({ imgSrc }: { imgSrc: any }) => {
  const onUploadPress = () => {
    console.log('upload');
  };
  return (
    <AvatarContainer>
      <AvatarImage source={imgSrc} />
      <UploadButtonContainer>
        <IconButton name='add' onPress={onUploadPress} />
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
  bottom: -4px;
  right: -12px;
`;
