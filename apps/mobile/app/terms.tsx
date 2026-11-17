import { Link, Stack } from "expo-router";
import { ScrollView, Text } from "react-native";
import { CONTACT_EMAIL, MIN_AGE, POLICY_UPDATED } from "@scenespeak/core/legal/policy";
import { color } from "../src/theme/tokens";
import { Bullets, ExternalLink, Heading, Para, legalStyles } from "../src/ui/legal";

const REPO_URL = "https://github.com/Xlient/SceneSpeak";

// Same terms as the web app.
export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={legalStyles.page}>
      <Stack.Screen options={{ title: "Terms of Use" }} />
      <Text style={legalStyles.updated}>Last updated {POLICY_UPDATED}</Text>
      <Para>By using SceneSpeak you agree to these terms. If you don't agree, please don't use the app.</Para>

      <Heading>The service</Heading>
      <Para>
        SceneSpeak is a free language practice app. It is provided "as is", without warranties of any kind, and may change or stop at any time. To the
        extent the law allows, we aren't liable for any loss or damage from using it.
      </Para>

      <Heading>AI-generated content</Heading>
      <Para>
        Lessons, grades, corrections, grammar notes and character voices are made by AI and can be wrong, unnatural or out of date. Use SceneSpeak for
        practice, not as a professional language, legal, medical or travel reference.
      </Para>

      <Heading>Using SceneSpeak fairly</Heading>
      <Bullets
        items={[
          `You must be ${MIN_AGE} or older, or use SceneSpeak with a parent or guardian.`,
          "Don't ask it to make harmful, hateful, sexual or violent content. Requests like that are refused.",
          "Don't enter other people's personal information, or your own sensitive information.",
          "Don't try to abuse, overload or get around the app's protections, or use it to reach the AI services for other purposes.",
          "Keep leaderboard names friendly. We may remove entries that aren't.",
        ]}
      />

      <Heading>Third-party services</Heading>
      <Para>
        SceneSpeak uses Google services (Gemini and Firebase). Your use of those features is also subject to Google's terms. See the{" "}
        <Link href="/privacy" style={{ color: color.ink, fontWeight: "800", textDecorationLine: "underline" }}>
          Privacy Policy
        </Link>{" "}
        for what is shared.
      </Para>

      <Heading>Open source</Heading>
      <Para>
        SceneSpeak's code is open source under the GNU Affero General Public License v3.0 (AGPL-3.0): <ExternalLink url={REPO_URL}>view it on GitHub</ExternalLink>.
        3D models and other assets keep their own licenses.
      </Para>

      <Heading>Contact</Heading>
      <Para>
        <ExternalLink url={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</ExternalLink>
      </Para>
    </ScrollView>
  );
}
