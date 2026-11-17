import { useState } from "react";
import { browserLocalData, clearLocalData } from "@scenespeak/core/legal/clear-local-data";
import { CONTACT_EMAIL, GEMINI_UNPAID_TIER, MIN_AGE, POLICY_UPDATED } from "@scenespeak/core/legal/policy";

export const PrivacyPage = ({ onBack }: { onBack: () => void }) => {
  const [cleared, setCleared] = useState<string | null>(null);

  const clear = async () => {
    try {
      const removed = await clearLocalData(browserLocalData());
      setCleared(removed > 0 ? "Done. Your SceneSpeak data on this device is deleted. Reloading…" : "There was nothing to delete on this device.");
      // In-memory progress would otherwise write itself back.
      if (removed > 0) setTimeout(() => window.location.reload(), 1200);
    } catch {
      setCleared("Couldn't delete everything. Clear this site's data in your browser settings instead.");
    }
  };

  return (
    <article className="legal card panel" aria-labelledby="privacy-title">
      <button type="button" className="secondary small" onClick={onBack}>
        ← Back
      </button>
      <h2 id="privacy-title">Privacy Policy</h2>
      <p className="legal-updated">Last updated {POLICY_UPDATED}</p>

      <p>
        SceneSpeak is a free, open-source language practice app. We try to keep as much as possible on your device. This page explains what
        leaves it, where it goes, and how to delete it.
      </p>

      <h3>What stays on your device</h3>
      <ul>
        <li>Your practice history, streaks, points and stars (browser storage).</li>
        <li>Your settings, like your chosen voice and whether you've seen the welcome tour.</li>
        <li>The weekly coach recap. It runs only with on-device AI and never sends your stats anywhere.</li>
        <li>Generated character voice clips and scene backdrops, cached so they aren't made twice.</li>
        <li>
          When Chrome's on-device AI (Gemini Nano) is set up, typed replies and grammar breakdowns are processed on your device. Chrome downloads
          and manages that model.
        </li>
      </ul>

      <h3>What is sent to the cloud</h3>
      <p>
        AI features use Google's Gemini through Firebase AI Logic. These are sent to Google when the cloud is used:
      </p>
      <ul>
        <li>Typed replies and lesson lines, for grading and grammar breakdowns, when on-device AI isn't ready or can't take the request.</li>
        <li>Voice recordings when you reply by voice. The clip is held in memory, sent once to be graded, and then discarded. SceneSpeak never stores or logs it.</li>
        <li>
          Lesson requests from "Create a lesson". Emails, phone numbers and long numbers are removed on your device first, and an on-device check
          screens the request when available.
        </li>
      </ul>
      {GEMINI_UNPAID_TIER && (
        <p className="legal-callout">
          SceneSpeak currently uses Gemini's free tier. Under Google's terms for unpaid services, Google may use what is sent to Gemini to improve
          its products, and human reviewers may read it. Please don't include personal or sensitive information in replies, recordings or lesson
          requests.
        </p>
      )}
      <p>
        Google processes this data under the{" "}
        <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">
          Gemini API Additional Terms
        </a>{" "}
        and the{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          Google Privacy Policy
        </a>
        .
      </p>

      <h3>Accounts and the leaderboard</h3>
      <ul>
        <li>You start as an anonymous guest: Firebase Authentication gives your browser a random ID with no personal details.</li>
        <li>Signing in with Google is optional. Google shares your name, email address and profile photo with Firebase so you can sign in.</li>
        <li>
          Joining the weekly leaderboard is optional. It stores only your first name and the number of days you practised that week, in Google
          Cloud Firestore. You can leave the board at any time from the Leaderboard page, which deletes your entry.
        </li>
      </ul>

      <h3>Security and abuse protection</h3>
      <p>
        Firebase App Check uses Google reCAPTCHA Enterprise to confirm requests come from the real app. reCAPTCHA collects device and browser
        information under Google's terms.
      </p>

      <h3>What we don't do</h3>
      <ul>
        <li>No ads, no analytics or tracking scripts, and no selling or sharing of your data.</li>
        <li>No storing of your voice recordings or images.</li>
      </ul>

      <h3>Children</h3>
      <p>
        SceneSpeak is meant for people aged {MIN_AGE} and older. Younger learners should use it with a parent or guardian, without signing in or
        joining the leaderboard. We don't knowingly collect personal information from children under {MIN_AGE}. If you think a child has shared
        personal information with us, contact us and we'll delete it.
      </p>

      <h3>Deleting your data</h3>
      <ul>
        <li>On this device: use the button below, or clear this site's data in your browser settings.</li>
        <li>Leaderboard: leave the board from the Leaderboard page.</li>
        <li>Anything else, including your sign-in account: email us and we'll delete it.</li>
      </ul>
      <div className="actions">
        <button type="button" className="secondary" onClick={() => void clear()}>
          Delete my data on this device
        </button>
      </div>
      <p role="status" aria-live="polite" className="audio-note">
        {cleared}
      </p>

      <h3>Changes and contact</h3>
      <p>
        If this policy changes, we'll update the date above. Questions or requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </article>
  );
};
