import {
  Column,
  PressableOpacity,
  Row,
  ScreenContainer,
  Title2,
} from '@/components';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Avatar } from './Avatar';
import { ProfileHeader } from './ProfileHeader';
import { ProfileInfoCards } from './ProfileInfoCards';
import { userMockData } from './profileMockData';
import { useTheme } from 'styled-components/native';

export const ProfileScreen = () => {
  const theme = useTheme();

  const handleLinkPress = () => {
    console.log('link');
  };

  return (
    <ScreenContainer>
      <ProfileHeader />
      <Column $gap={12}>
        <Avatar imgSrc={userMockData.imgSrc} />
        <Row $gap={6} $alignItems='center' $width='auto'>
          <Title2>{userMockData.username}</Title2>
          <PressableOpacity onPress={handleLinkPress}>
            <MaterialCommunityIcons
              name='link-variant'
              size={24}
              color={theme.colors.textSecondary}
            />
          </PressableOpacity>
        </Row>
        <ProfileInfoCards />
      </Column>
    </ScreenContainer>
  );
};

export default ProfileScreen;
