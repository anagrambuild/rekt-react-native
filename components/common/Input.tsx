import { Column, Row } from './containers';
import { BodyS } from './texts';
import styled from 'styled-components/native';

export const StyledInput = styled.TextInput`
  font-family: 'Geist';
  font-size: 16px;
  font-weight: 400;
  color: ${({ theme }: any) => theme.colors.textPrimary};
  background-color: ${({ theme }: any) => theme.colors.field};
  width: 100%;
  padding: 12px 16px 12px 24px;
  border-radius: 12px;
  height: 48px;
`;

interface IntputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  returnKeyType: 'done' | 'next' | 'search' | 'send';
  onSubmitEditing: () => void;
}

export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  returnKeyType,
  onSubmitEditing,
}: IntputProps) => {
  return (
    <Column
      $gap={4}
      $width='auto'
      $alignItems='flex-start'
      $justifyContent='flex-start'
    >
      {label && <BodyS>{label}</BodyS>}
      <Row $gap={8} $alignItems='center'>
        <StyledInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
      </Row>
    </Column>
  );
};
