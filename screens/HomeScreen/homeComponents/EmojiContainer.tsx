import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

import { PressableOpacity, Row } from '@/components';
import { IconButton } from '@/components/common/buttons/IconButton';

import styled, { DefaultTheme, useTheme } from 'styled-components/native';

const EMOJIS = ['🔥', '💀', '😍', '🤔', '😭'];

interface EmojiContainerProps {
  onEmojiPress?: (emoji: string) => void;
}

export const EmojiContainer: React.FC<EmojiContainerProps> = ({
  onEmojiPress,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const defaultButtonOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (open) {
      Animated.timing(defaultButtonOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: open ? 1 : 0.7,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: open ? 1 : 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, scaleAnim, fadeAnim, defaultButtonOpacity]);

  const onCloseContainer = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.7,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      Animated.timing(defaultButtonOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  if (!open) {
    return (
      <Animated.View
        style={{ opacity: defaultButtonOpacity }}
        pointerEvents={open ? 'none' : 'auto'}
      >
        <DefaultEmojiButton
          onPress={() => setOpen(true)}
          accessibilityLabel='Open emoji picker'
        >
          <EmojiText>😀</EmojiText>
        </DefaultEmojiButton>
      </Animated.View>
    );
  }

  return (
    <AnimatedContainer
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Row $gap={4} $width='auto'>
        <IconButton
          name='close'
          onPress={onCloseContainer}
          size={14}
          color={theme.colors.textPrimary}
          accessibilityLabel='Close emoji picker'
        />
        {EMOJIS.map((emoji) => (
          <EmojiButton
            key={emoji}
            onPress={() => {
              onCloseContainer();
            }}
            accessibilityLabel={`Send ${emoji}`}
          >
            <EmojiText>{emoji}</EmojiText>
          </EmojiButton>
        ))}
      </Row>
    </AnimatedContainer>
  );
};

const AnimatedContainer = styled(Animated.View)`
  position: absolute;
  left: 20px;
  bottom: -10px;
  flex-direction: row;
  z-index: 50;
`;

const DefaultEmojiButton = styled(PressableOpacity)`
  position: absolute;
  left: 20px;
  bottom: -10px;
  padding: 8px;
  background: ${({ theme }: { theme: DefaultTheme }) => theme.colors.secondary};
  border-radius: 20px;
  z-index: 50;
`;

const EmojiButton = styled(PressableOpacity)`
  padding: 8px;
  border-radius: 20px;
  background: ${({ theme }: { theme: DefaultTheme }) => theme.colors.secondary};
`;

export const EmojiText = styled.Text`
  font-size: 14px;
`;
