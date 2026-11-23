import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { color, outline } from "../theme/tokens";

const HEIGHT = 18;

/** Chunky progress bar. Without a `progress` value it slides a block back and forth (the platform gave no byte counts). */
export const DownloadBar = ({ progress, label }: { progress?: number | undefined; label: string }) => {
  const slide = useRef(new Animated.Value(0)).current;
  const known = progress !== undefined;

  useEffect(() => {
    if (known) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(slide, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(slide, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [known, slide]);

  const percent = known ? Math.round(progress * 100) : undefined;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={percent === undefined ? { text: "In progress" } : { min: 0, max: 100, now: percent }}
      style={styles.wrap}
    >
      <View style={styles.track}>
        {known ? (
          <View style={[styles.fill, { width: `${percent}%` }]} />
        ) : (
          <Animated.View style={[styles.fill, styles.block, { left: slide.interpolate({ inputRange: [0, 1], outputRange: ["0%", "65%"] }) }]} />
        )}
      </View>
      <Text style={styles.caption}>{percent === undefined ? "Downloading…" : `${percent}%`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  track: {
    height: HEIGHT,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: HEIGHT,
    backgroundColor: color.cream,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: color.mint, borderRadius: HEIGHT },
  block: { position: "absolute", width: "35%" },
  caption: { fontSize: 13, fontWeight: "800", color: color.inkSoft, textAlign: "center" },
});
