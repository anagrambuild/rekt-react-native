import avatar from '@/assets/images/app-pngs/avatar.png';
import { ScreenContainer } from '@/components/common/containers';

import { Avatar } from './Avatar';
import { ProfileHeader } from './ProfileHeader';

export const ProfileScreen = () => {
  return (
    <ScreenContainer>
      <ProfileHeader />
      <Avatar imgSrc={avatar} />
    </ScreenContainer>
  );
};

export default ProfileScreen;
