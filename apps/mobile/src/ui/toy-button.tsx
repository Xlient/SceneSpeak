import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { color, lift, outline, radius } from "../theme/tokens";

export interface ToyButtonProps {
  label: string;
  onPress: () => void;
  tint?: string;
  hint?: string;
  disabled?: boolean;
  children?: ReactNode;
}

/** Chunky KayKit-style button: thick outline and a hard drop that squashes on press. */
export const ToyButton = ({ label, onPress, tint = color.mint, hint, disabled = false, children }: ToyButtonProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
    {...(hint ? { accessibilityHint: hint } : {})}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
      styles.base,
      { backgroundColor: tint, transform: [{ translateY: pressed ? lift : 0 }] },
      pressed ? styles.pressed : styles.raised,
      disabled ? styles.disabled : null,
      focused ? styles.focused : null,
    ]}
  >
    {children ?? (
      <View>
        <Text style={styles.label}>{label}</Text>
      </View>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  raised: { boxShadow: `0 ${lift}px 0 ${color.ink}`, marginBottom: lift },
  pressed: { marginBottom: lift },
  disabled: { opacity: 0.5 },
  focused: { outlineWidth: 3, outlineColor: color.sky, outlineStyle: "solid", outlineOffset: 3 },
  label: { color: color.ink, fontSize: 17, fontWeight: "800", textAlign: "center" },
});
