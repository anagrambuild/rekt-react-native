import { TextInput } from "react-native";

import { Column, Row } from "./containers";
import { BodyS } from "./texts";
import styled from "styled-components/native";

export const StyledInput = styled.TextInput`
  font-family: "Geist";
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
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  textContentType?: "emailAddress" | "username" | "password" | "none";
  returnKeyType: "done" | "next" | "search" | "send";
  onSubmitEditing: () => void;
  secureTextEntry?: boolean;
  ref?: React.RefObject<TextInput | null>;
}

export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  textContentType,
  returnKeyType,
  onSubmitEditing,
  secureTextEntry = false,
  ref,
}: IntputProps) => {
  return (
    <Column
      $gap={4}
      $width="auto"
      $alignItems="flex-start"
      $justifyContent="flex-start"
    >
      {label && <BodyS>{label}</BodyS>}
      <Row $gap={8} $alignItems="center">
        <StyledInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          secureTextEntry={secureTextEntry}
          ref={ref}
        />
      </Row>
    </Column>
  );
};
