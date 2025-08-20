import { Pressable, PressableProps } from "react-native";

interface PressableOpacityProps extends PressableProps {
  loading?: boolean;
}

export const PressableOpacity = ({
  children,
  loading,
  disabled,
  style,
  ...props
}: PressableOpacityProps) => {
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={state => {
        const baseStyle = typeof style === "function" ? style(state) : style;
        return [
          baseStyle,
          {
            opacity: state.pressed && !disabled && !loading ? 0.2 : 1,
          },
        ];
      }}
    >
      {children}
    </Pressable>
  );
};
