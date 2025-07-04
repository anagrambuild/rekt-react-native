import { useState } from 'react';
import { FlatList } from 'react-native';

import MaterialIcon from '@expo/vector-icons/MaterialIcons';

import { Modal } from './Modal';
import { BodyM } from './texts';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

interface PickerOption<T> {
  label: string;
  value: T;
}

interface PickerProps<T> {
  options: PickerOption<T>[];
  selectedValue: T | null;
  onValueChange: (value: T) => void;
}

export function Picker<T>({
  options,
  selectedValue,
  onValueChange,
}: PickerProps<T>) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const selectedLabel = options.find(
    (opt) => opt.value === selectedValue
  )?.label;

  return (
    <>
      <Trigger onPress={() => setVisible(true)}>
        <BodyM>{selectedLabel || ''}</BodyM>
        <MaterialIcon
          name='keyboard-arrow-down'
          size={20}
          color={theme.colors.textSecondary}
          style={{ marginLeft: 4 }}
        />
      </Trigger>
      <Modal visible={visible} onRequestClose={() => setVisible(false)}>
        <OptionsList
          data={options}
          keyExtractor={(item: PickerOption<T>) => String(item.value)}
          renderItem={({ item }: { item: PickerOption<T> }) => (
            <Option
              onPress={() => {
                onValueChange(item.value);
                setVisible(false);
              }}
            >
              <OptionText>{item.label}</OptionText>
            </Option>
          )}
        />
      </Modal>
    </>
  );
}

const Trigger = styled.Pressable`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.card};
  border-radius: 20px;
  padding: 8px 16px;
  align-self: flex-start;
`;

const OptionsList = styled(FlatList as new <T>() => FlatList<PickerOption<T>>)`
  max-height: 300px;
`;

const Option = styled.Pressable`
  padding: 12px 8px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.borderLight};
`;

const OptionText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textPrimary};
  font-size: 16px;
`;
