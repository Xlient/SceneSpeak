import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { CONTACT_EMAIL, GEMINI_UNPAID_TIER, MIN_AGE, POLICY_UPDATED } from "@scenespeak/core/legal/policy";
import { clearAppData } from "../src/legal/app-data";
import { usePractice } from "../src/progress/practice-context";
import { color } from "../src/theme/tokens";
import { Bullets, Callout, ExternalLink, Heading, Para, legalStyles } from "../src/ui/legal";
import { ToyButton } from "../src/ui/toy-button";

// Mirrors the web Privacy Policy, worded for the app (device storage, no voice replies yet).
export default function PrivacyScreen() {
  const { reset } = usePractice();
  const [cleared, setCleared] = useState<string | null>(null);

  const clear = async () => {
    try {
      const removed = await clearAppData(AsyncStorage);
      reset();
      setCleared(removed > 0 ? "Done. Your SceneSpeak data on this device is deleted." : "There was nothing to delete on this device.");
    } catch {
      setCleared("Couldn't delete everything. Clear SceneSpeak's storage in your phone's app settings instead.");
    }
  };

  return (
    <ScrollView contentContainerStyle={legalStyles.page}>
      <Stack.Screen options={{ title: "Privacy Policy" }} />
      <Text style={legalStyles.updated}>Last updated {POLICY_UPDATED}</Text>
      <Para>
        SceneSpeak is a free, open-source language practice app. We try to keep as much as possible on your device. This page explains what leaves
        it, where it goes, and how to delete it.
      </Para>

      <Heading>What stays on your device</Heading>
      <Bullets
        items={[
          "Your practice history, streaks, points and stars (app storage on this phone).",
          "Your settings, like whether you've seen the welcome tour and whether you joined the leaderboard.",
          "When on-device AI is available (Gemini Nano on supported Android phones, Apple Intelligence on supported iPhones), typed replies are graded on your device. Your phone's system downloads and manages that model.",
        ]}
      />

      <Heading>What is sent to the cloud</Heading>
      <Para>AI features use Google's Gemini through Firebase AI Logic. These are sent to Google when the cloud is used:</Para>
      <Bullets
        items={[
          "Typed replies and lesson lines, for grading, when on-device AI isn't ready or can't take the request.",
          'Lesson requests from "Create a lesson". Emails, phone numbers and long numbers are removed on your device first, and an on-device check screens the request when available.',
        ]}
      />
      {GEMINI_UNPAID_TIER && (
        <Callout>
          SceneSpeak currently uses Gemini's free tier. Under Google's terms for unpaid services, Google may use what is sent to Gemini to improve its
          products, and human reviewers may read it. Please don't include personal or sensitive information in replies or lesson requests.
        </Callout>
      )}
      <Para>
        Google processes this data under the <ExternalLink url="https://ai.google.dev/gemini-api/terms">Gemini API Additional Terms</ExternalLink> and
        the <ExternalLink url="https://policies.google.com/privacy">Google Privacy Policy</ExternalLink>.
      </Para>

      <Heading>Accounts and the leaderboard</Heading>
      <Bullets
        items={[
          "You start as an anonymous guest: Firebase Authentication gives the app a random ID with no personal details.",
          "Joining the weekly leaderboard is optional. It stores only your first name and the number of days you practised that week, in Google Cloud Firestore. You can leave the board at any time from the Leaderboard tab, which deletes your entry.",
        ]}
      />

      <Heading>What we don't do</Heading>
      <Bullets items={["No ads, no analytics or tracking, and no selling or sharing of your data.", "No storing of your voice recordings or images."]} />

      <Heading>Children</Heading>
      <Para>
        SceneSpeak is meant for people aged {MIN_AGE} and older. Younger learners should use it with a parent or guardian, without joining the
        leaderboard. We don't knowingly collect personal information from children under {MIN_AGE}. If you think a child has shared personal
        information with us, contact us and we'll delete it.
      </Para>

      <Heading>Deleting your data</Heading>
      <Bullets
        items={[
          "On this device: use the button below, or clear SceneSpeak's storage in your phone's settings.",
          "Leaderboard: leave the board from the Leaderboard tab.",
          "Anything else: email us and we'll delete it.",
        ]}
      />
      <ToyButton label="Delete my data on this device" tint={color.card} onPress={() => void clear()} />
      {cleared ? (
        <Text style={legalStyles.updated} accessibilityLiveRegion="polite">
          {cleared}
        </Text>
      ) : null}

      <Heading>Changes and contact</Heading>
      <Para>
        If this policy changes, we'll update the date above. Questions or requests: <ExternalLink url={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</ExternalLink>.
      </Para>
    </ScrollView>
  );
}
