import { BodySEmphasized } from "../texts";
import { PressableOpacity } from "./PressableOpacity";
import styled from "styled-components/native";

const StyledButton = styled(PressableOpacity)<{ disabled?: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: ${(props: any) =>
    props.disabled
      ? props.theme.colors.secondary + "80"
      : props.theme.colors.secondary};
  padding: 6px 12px;
  border-radius: 100px;
  opacity: ${(props: any) => (props.disabled ? 0.6 : 1)};
`;

interface ModalIconButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  icon: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export const ModalIconButton = ({
  children,
  disabled,
  icon,
  ...props
}: ModalIconButtonProps) => {
  return (
    <StyledButton disabled={disabled} {...props}>
      {icon}
      <BodySEmphasized>{children}</BodySEmphasized>
    </StyledButton>
  );
};
