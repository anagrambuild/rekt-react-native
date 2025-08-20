import { useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import coinIcon from '@/assets/images/app-pngs/coin.png';
import UsdcIcon from '@/assets/images/app-svgs/usdc.svg';
import WalletSecondaryIcon from '@/assets/images/app-svgs/wallet-secondary.svg';
import { blueFlameUrl } from '@/assets/videos';
import {
  BodyMEmphasized,
  BodyMSecondary,
  BodySSecondary,
  BodyXSMonoSecondary,
  Card,
  Column,
  Divider,
  IconButton,
  ModalIconButton,
  PressableOpacity,
  PulsatingContainer,
  Row,
  Title2,
} from '@/components';
import { useAppContext, useProfileContext } from '@/contexts';

import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { EarningsCard } from './EarningsCard';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

const videoOffset = Platform.OS === 'ios' ? 38 : 30;

export const Balance = ({
  setView,
  loginScreen,
}: {
  setView: (
    view:
      | 'transfer'
      | 'withdraw'
      | 'withdrawal address'
      | 'withdrawal success'
      | 'confirm breeze'
  ) => void;
  loginScreen?: boolean;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { userData, handleHistory } = useProfileContext();
  const { hasBreeze } = useAppContext();
  const usdcIconRef = useRef<View>(null);
  const [usdcIconPosition, setUsdcIconPosition] = useState({ x: 0, y: 0 });
  const earningAmountRef = useRef<View | null>(null);
  const earningAmountTextRef = useRef<View | null>(null);
  const [earningAmountPosition, setEarningAmountPosition] = useState({
    x: 0,
    y: 0,
  });

  const player = useVideoPlayer(blueFlameUrl, (player) => {
    player.loop = true;
    player.play();
  });

  const goToTransfer = () => {
    if (loginScreen) return;
    setView('transfer');
  };
  const goToWithdraw = () => {
    if (loginScreen) return;
    setView('withdraw');
  };
  const goToConfirmBreeze = () => {
    if (loginScreen) return;
    setView('confirm breeze');
  };
  const goToCard = () => {
    if (loginScreen) return;
    // setView('card');
    console.log('go to card');
  };

  const handleUsdcIconLayout = () => {
    if (usdcIconRef.current) {
      usdcIconRef.current.measure((_x, _y, _width, _height, pageX, pageY) => {
        setUsdcIconPosition({ x: pageX, y: pageY });
      });
    }
  };

  const handleEarningAmountLayout = () => {
    if (earningAmountTextRef.current) {
      earningAmountTextRef.current.measure(
        (_x, _y, _width, _height, pageX, pageY) => {
          setEarningAmountPosition({ x: pageX, y: pageY });
        }
      );
    }
  };

  // Calculate the target position for the floating USDC icon animation
  // This represents the translation needed from the earnings amount position to the USDC icon position
  const targetPosition = useMemo(() => {
    return {
      x: usdcIconPosition.x - earningAmountPosition.x,
      y: earningAmountPosition.y - usdcIconPosition.y,
    };
  }, [usdcIconPosition, earningAmountPosition]);

  const showBreeze = hasBreeze || loginScreen;

  return (
    <Column>
      {showBreeze && (
        <VideoView
          player={player}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            bottom: videoOffset,
            left: 0,
            backgroundColor: 'transparent',
          }}
          pointerEvents='none'
          nativeControls={false}
        />
      )}
      <Column $gap={24} $alignItems='flex-start' $padding={8}>
        {/* Header Section */}
        <Column
          $justifyContent='space-between'
          $alignItems='flex-start'
          $gap={8}
        >
          <IconContainer>
            <WalletSecondaryIcon
              width={20}
              height={20}
              color={theme.colors.textSecondary}
            />
          </IconContainer>
          <Row $justifyContent='space-between'>
            <Column $alignItems='flex-start' $width='auto'>
              <BodyMSecondary>{t('Your balance')}</BodyMSecondary>
              <Row $width='auto' $gap={4} $justifyContent='flex-start'>
                {loginScreen ? (
                  <Title2>1800.00</Title2>
                ) : (
                  <Title2>
                    {userData.balance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Title2>
                )}
                <View ref={usdcIconRef} onLayout={handleUsdcIconLayout}>
                  {showBreeze ? (
                    <PulsatingContainer duration={1000}>
                      <UsdcIcon width={20} height={20} />
                    </PulsatingContainer>
                  ) : (
                    <UsdcIcon width={20} height={20} />
                  )}
                </View>
              </Row>
            </Column>

            {userData.balance > 0 ||
              (loginScreen && (
                <Row $width='auto' $gap={8}>
                  <ModalIconButton
                    onPress={goToWithdraw}
                    icon={
                      <AntDesign
                        name='minuscircle'
                        size={12}
                        color={theme.colors.textPrimary}
                      />
                    }
                  >
                    {t('Withdraw')}
                  </ModalIconButton>
                  <IconButton
                    name='history'
                    size={12}
                    color={theme.colors.textPrimary}
                    onPress={handleHistory}
                    disabled={loginScreen}
                  />
                </Row>
              ))}
          </Row>
        </Column>

        {/* APY Section */}
        {showBreeze ? (
          <EarningsCard
            targetPosition={targetPosition}
            handleEarningAmountLayout={handleEarningAmountLayout}
            earningAmountRef={earningAmountRef}
            earningAmountTextRef={earningAmountTextRef}
          />
        ) : (
          <Card $padding={16}>
            <PressableOpacity onPress={goToConfirmBreeze}>
              <Column $width='auto' $gap={4} $alignItems='flex-start'>
                <Image source={coinIcon} style={{ width: 64, height: 64 }} />
                <BodyMEmphasized>
                  {t('Earn 5% APY on your balance')}
                </BodyMEmphasized>
                <BodyMSecondary>
                  {t('Put your idle dollars to work')}
                </BodyMSecondary>
              </Column>
            </PressableOpacity>
          </Card>
        )}

        {/* Deposit Options Section */}
        <Column $gap={4} $width='100%' $alignItems='flex-start'>
          <BodyXSMonoSecondary>
            {t('Deposit funds').toUpperCase()}
          </BodyXSMonoSecondary>

          <DepositOption onPress={goToTransfer}>
            <Row $width='auto' $gap={12} $alignItems='center'>
              <FontAwesome5
                name='arrow-circle-down'
                size={24}
                color={theme.colors.textSecondary}
              />
              <Column $width='auto' $alignItems='flex-start'>
                <BodyMEmphasized>{t('Transfer-in')}</BodyMEmphasized>
                <BodySSecondary>{t('From Solana wallet')}</BodySSecondary>
              </Column>
            </Row>
            <MaterialIcons
              name='chevron-right'
              size={20}
              color={theme.colors.textSecondary}
            />
          </DepositOption>
          <Divider />
          <DepositOption onPress={goToCard}>
            <Row $width='auto' $gap={12} $alignItems='center'>
              <FontAwesome5
                name='cc-apple-pay'
                size={24}
                color={theme.colors.textSecondary}
              />
              <Column $width='auto' $alignItems='flex-start'>
                <BodyMEmphasized>{t('Card or Apple pay')}</BodyMEmphasized>
                <BodySSecondary>
                  {t('Instant and secure payment')}
                </BodySSecondary>
              </Column>
            </Row>
            <MaterialIcons
              name='chevron-right'
              size={20}
              color={theme.colors.textSecondary}
            />
          </DepositOption>
        </Column>
      </Column>
    </Column>
  );
};

const IconContainer = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
  align-items: center;
  justify-content: center;
`;

const DepositOption = styled.Pressable`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 4px;
  border-radius: 12px;
`;
