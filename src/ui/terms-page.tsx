import { CONTACT_EMAIL, MIN_AGE, POLICY_UPDATED } from "../legal/policy";
import { REPO_URL } from "./links";

export const TermsPage = ({ onBack, onOpenPrivacy }: { onBack: () => void; onOpenPrivacy: () => void }) => (
  <article className="legal card panel" aria-labelledby="terms-title">
    <button type="button" className="secondary small" onClick={onBack}>
      ← Back
    </button>
    <h2 id="terms-title">Terms of Use</h2>
    <p className="legal-updated">Last updated {POLICY_UPDATED}</p>

    <p>By using SceneSpeak you agree to these terms. If you don't agree, please don't use the app.</p>

    <h3>The service</h3>
    <p>
      SceneSpeak is a free language practice app. It is provided "as is", without warranties of any kind, and may change or stop at any time. To
      the extent the law allows, we aren't liable for any loss or damage from using it.
    </p>

    <h3>AI-generated content</h3>
    <p>
      Lessons, grades, corrections, grammar notes and character voices are made by AI and can be wrong, unnatural or out of date. Use SceneSpeak
      for practice, not as a professional language, legal, medical or travel reference.
    </p>

    <h3>Using SceneSpeak fairly</h3>
    <ul>
      <li>You must be {MIN_AGE} or older, or use SceneSpeak with a parent or guardian.</li>
      <li>Don't ask it to make harmful, hateful, sexual or violent content. Requests like that are refused.</li>
      <li>Don't enter other people's personal information, or your own sensitive information.</li>
      <li>Don't try to abuse, overload or get around the app's protections, or use it to reach the AI services for other purposes.</li>
      <li>Keep leaderboard names friendly. We may remove entries that aren't.</li>
    </ul>

    <h3>Third-party services</h3>
    <p>
      SceneSpeak uses Google services (Gemini, Firebase and reCAPTCHA). Your use of those features is also subject to Google's terms. See the{" "}
      <button type="button" className="link-button" onClick={onOpenPrivacy}>
        Privacy Policy
      </button>{" "}
      for what is shared.
    </p>

    <h3>Open source</h3>
    <p>
      SceneSpeak's code is open source under the Apache License 2.0:{" "}
      <a href={REPO_URL} target="_blank" rel="noreferrer">
        view it on GitHub
      </a>
      . 3D models and other assets keep their own licenses.
    </p>

    <h3>Contact</h3>
    <p>
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    </p>
  </article>
);
