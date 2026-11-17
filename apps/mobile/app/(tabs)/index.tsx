import { Link, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { FEATURED_LESSONS } from "@scenespeak/core/lesson/featured/featured-lessons";
import { color, outline, radius, tintAt } from "../../src/theme/tokens";
import { LessonCard } from "../../src/ui/lesson-card";
import { ToyButton } from "../../src/ui/toy-button";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title} accessibilityRole="header">
        Learn the conversation you actually need.
      </Text>
      <View style={styles.create}>
        <Text style={styles.cardTitle}>What conversation do you need?</Text>
        <Text style={styles.cardBlurb}>Type a situation, like "opening a bank account". SceneSpeak builds a little 3D scene and a 5-minute lesson for it.</Text>
        <ToyButton label="Create a lesson" tint={color.butter} onPress={() => router.push("/create")} />
      </View>
      <Text style={styles.subtitle} accessibilityRole="header">
        Featured lessons
      </Text>
      <View style={styles.list}>
        {FEATURED_LESSONS.map(({ scenario, blurb, emoji }, index) => (
          <LessonCard
            key={scenario.id}
            title={scenario.title}
            blurb={blurb}
            emoji={emoji}
            language={scenario.language}
            level={scenario.level}
            tint={tintAt(index)}
            onPlay={() => router.push({ pathname: "/lesson/[id]", params: { id: scenario.id } })}
          />
        ))}
      </View>
      <View style={styles.footer}>
        {(
          [
            ["How it works", "/welcome"],
            ["Model Monitor", "/monitor"],
            ["Privacy", "/privacy"],
            ["Terms", "/terms"],
          ] as const
        ).map(([label, href]) => (
          <Link key={href} href={href} style={styles.footerLink}>
            {label}
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, maxWidth: 720, width: "100%", alignSelf: "center" },
  title: { fontSize: 26, fontWeight: "800", color: color.ink },
  create: {
    backgroundColor: color.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    borderRadius: radius.large,
    padding: 14,
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: color.ink },
  cardBlurb: { fontSize: 15, color: color.ink },
  subtitle: { fontSize: 20, fontWeight: "800", color: color.ink, marginTop: 4 },
  list: { gap: 10 },
  footer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16, marginTop: 12 },
  footerLink: { fontSize: 14, fontWeight: "700", color: color.inkSoft, textDecorationLine: "underline", padding: 4 },
});
