import type { ReactNode } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { color, outline, radius } from "../theme/tokens";

// Small building blocks for the Privacy and Terms pages.
export const Heading = ({ children }: { children: ReactNode }) => (
  <Text style={styles.heading} accessibilityRole="header">
    {children}
  </Text>
);

export const Para = ({ children }: { children: ReactNode }) => <Text style={styles.para}>{children}</Text>;

export const Bullets = ({ items }: { items: readonly ReactNode[] }) => (
  <View style={styles.list} accessibilityRole="list">
    {items.map((item, index) => (
      <View key={index} style={styles.item}>
        <Text style={styles.para} importantForAccessibility="no">
          •
        </Text>
        <Text style={[styles.para, styles.itemText]}>{item}</Text>
      </View>
    ))}
  </View>
);

export const Callout = ({ children }: { children: ReactNode }) => (
  <View style={styles.callout}>
    <Text style={styles.para}>{children}</Text>
  </View>
);

/** Inline link that opens in the browser or mail app. */
export const ExternalLink = ({ url, children }: { url: string; children: ReactNode }) => (
  <Text style={styles.link} accessibilityRole="link" onPress={() => void Linking.openURL(url)}>
    {children}
  </Text>
);

export const legalStyles = StyleSheet.create({
  page: { padding: 16, gap: 10, maxWidth: 720, width: "100%", alignSelf: "center" },
  updated: { fontSize: 13, color: color.inkSoft },
});

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: "800", color: color.ink, marginTop: 8 },
  para: { fontSize: 15, lineHeight: 22, color: color.ink },
  list: { gap: 6 },
  item: { flexDirection: "row", gap: 8 },
  itemText: { flex: 1 },
  callout: {
    backgroundColor: color.cream,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.small,
    padding: 12,
  },
  link: { color: color.ink, fontWeight: "800", textDecorationLine: "underline" },
});
