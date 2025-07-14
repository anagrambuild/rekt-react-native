import DiceIcon from '@/assets/images/app-svgs/dice.svg';
import FireIcon from '@/assets/images/app-svgs/fire.svg';
import TradeIcon from '@/assets/images/app-svgs/trade.svg';
import {
  Card,
  Column,
  PressableOpacity,
  Row,
  ScreenContainer,
  SegmentContainer,
  SegmentControl,
  Title2,
  Title4,
} from '@/components';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Avatar } from './Avatar';
import { ProfileHeader } from './ProfileHeader';
import { ProfileInfoCards } from './ProfileInfoCards';
import { userMockData } from './profileMockData';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

export const ProfileScreen = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const handleLinkPress = () => {
    console.log('link');
  };
  // TODO - break Activity Row to its own file
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
        <Row $justifyContent='space-between'>
          <Row $width='auto' $gap={4}>
            <Title4>{t('Activity')}</Title4>
            <Card
              style={{
                borderRadius: 8,
                width: 'auto',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: theme.colors.cardEmphasized,
                paddingStart: 12,
                paddingEnd: 12,
              }}
            >
              <FireIcon width={24} height={24} />
              <Title4 style={{ fontSize: 12 }}>2x</Title4>
            </Card>
          </Row>
          <SegmentContainer>
            <SegmentControl
              Svg={TradeIcon}
              selected={true}
              onPress={() => {}}
            />
            <SegmentControl
              Svg={DiceIcon}
              selected={false}
              onPress={() => {}}
            />
          </SegmentContainer>
        </Row>
      </Column>
    </ScreenContainer>
  );
};

export default ProfileScreen;
