<div align="center">

<img src=".github/assets/logo-lockup.png" alt="SceneSpeak" width="420">

**Learn the conversation you actually need.**

Type the situation you're nervous about and practise it in a cozy 3D scene.<br>
Gemini Nano grades every reply **privately on your device**; cloud Gemini does the creative heavy lifting.

[![CI](https://github.com/Xlient/SceneSpeak/actions/workflows/ci.yml/badge.svg)](https://github.com/Xlient/SceneSpeak/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-455%20unit%20%2B%2021%20rules-brightgreen.svg)](#scripts)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)](tsconfig.json)
[![Firebase AI Logic](https://img.shields.io/badge/Firebase-AI%20Logic%20hybrid-FFCA28.svg?logo=firebase&logoColor=black)](https://firebase.google.com/docs/ai-logic)
[![#BuildHybridAI 2026](https://img.shields.io/badge/%23BuildHybridAI-2026-4285F4.svg)](https://firebasehybridaihackathon.devpost.com/)

[**For judges**](#for-judges) ·
[**Quick start**](#quick-start) ·
[**How hybrid works**](#how-hybrid-inference-is-used) ·
[**Contributing**](#contributing) ·
[**Add a lesson**](lessons/README.md)

Live demo: *coming soon* · Demo video: *coming soon*

</div>

---

## Contents

- [For judges](#for-judges)
- [Why SceneSpeak](#why-scenespeak)
- [Features](#features)
- [How hybrid inference is used](#how-hybrid-inference-is-used)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Full setup](#full-setup)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [Privacy](#privacy)
- [Credits](#credits)
- [License](#license)

## For judges

**Try it in about two minutes**

1. Open the live demo in desktop **Chrome 139+** (or [run it locally](#quick-start)).
2. Optional, for on-device AI: enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` and restart Chrome. The welcome tour downloads Gemini Nano after one click. Without it everything still works and grades in the cloud.
3. Play **Coffee at the café**, then tap **Create** and type a situation of your own.
4. Open the **Model Monitor** to see where every AI call ran, why, and how many cloud calls were saved.

No account needed: you start as an anonymous guest.

**Where Firebase AI Logic runs in the code**

| What | File |
| --- | --- |
| Firebase app + App Check (reCAPTCHA Enterprise) | [`src/ai/firebase.ts`](src/ai/firebase.ts) |
| Hybrid model factory (`InferenceMode`, `getGenerativeModel`) | [`src/ai/model.ts`](src/ai/model.ts) |
| On-device model setup and download | [`src/ai/device.ts`](src/ai/device.ts) |
| Routing policy: picks the inference mode per call | [`src/routing/route.ts`](src/routing/route.ts) |
| Every AI capability wired into the app | [`src/services/app-services.ts`](src/services/app-services.ts) |

**Hackathon requirements at a glance**

| Requirement | Where |
| --- | --- |
| Firebase AI Logic, imported and called at runtime | Files above |
| Hybrid inference with Gemini Nano on Web (Chrome) | [How hybrid inference is used](#how-hybrid-inference-is-used) |
| App Check | [`src/ai/firebase.ts`](src/ai/firebase.ts) |
| Other Firebase products | Authentication, Cloud Firestore (with emulator-tested rules), Hosting |
| Open source license | [AGPL-3.0](LICENSE) |
| Free to use, English UI | Yes |

## Why SceneSpeak

Phrasebooks teach you "the pen is on the table". What you actually need is the one conversation you're worried about: opening a bank account, checking into a hotel, asking a neighbour for a ladder. Practising that out loud with a person is awkward, tutors cost money, and most apps make you wade through a fixed curriculum to get there.

SceneSpeak turns that one situation into a five-minute role-play with a cute character in a low-poly 3D scene. Because you make a lot of mistakes while learning, the grading happens on your own device: private, instant and free.

**Who it's for:** adult beginners (A1 to B1) preparing for travel, a move or a new job. Spanish today; more languages are welcome as [community lessons](lessons/README.md).

## Features

| | Feature | Runs on |
| --- | --- | --- |
| 🎬 | **Featured lessons in 3D:** *Coffee at the café*, *Ordering at the bakery*, *Meet the neighbour* | — |
| ✍️ | **Create a lesson from a sentence:** a private on-device check, then a cloud-written role-play and a 3D set built from the asset catalog | Device + cloud |
| ✅ | **Instant feedback** on every typed reply: a score, a friendlier way to say it, and a hint | Device first |
| 🧩 | **Grammar breakdown** of any line, compared with English | Device first |
| 🎙️ | **Speaking mode** (opt-in): push to talk, graded in the cloud, never stored | Cloud |
| 📚 | **Lesson library:** share lessons, upvote, report; duplicates are suggested before writing a new one | Device + Firestore |
| ⭐ | **Progress:** stars, points, streaks and phrases to review, kept in your browser | Local |
| 🧑‍🏫 | **Weekly coach** that reads your stats without them leaving the device | Device only |
| 🏆 | **Weekly leaderboard** (opt-in): only a first name and days practised | Firestore |
| 📊 | **Model Monitor:** path, latency and routing reason for every AI call | — |
| 👋 | **Welcome tour** that sets up on-device AI, plus Privacy and Terms pages | — |

**Next:** cloud character voices (the player and cache are built), AI-painted backdrops (the UI and gradient fallback are built), more languages, and a mobile app.

## How hybrid inference is used

All AI goes through [Firebase AI Logic](https://firebase.google.com/docs/ai-logic) (`firebase/ai`). A small, unit-tested [routing policy](src/routing/route.ts) picks the mode for each call from ordered rules: privacy, capability, language support, connectivity, input size and the state of the on-device model. Each decision carries a plain-language reason that shows up in the Model Monitor.

| Job | Runs on | Why |
| --- | --- | --- |
| Grade a typed reply → `Grade` JSON | **Device first**, cloud fallback | Every reply: private, instant, free |
| Grammar breakdown | **Device first** | Short, frequent, personal |
| Check a lesson request (safety, topic, skills) | **Device first** | The request may be personal |
| "Is there already a lesson for this?" | **Device first** | A cheap judgement that can save a cloud call |
| Weekly coach recap | **Device only** | Practice stats never leave the browser |
| Write a new lesson (scenario + scene recipe) | **Cloud** | Long, creative structured output |
| Grade a voice reply (audio in) | **Cloud**, opt-in | The on-device model takes no audio |
| Offline with Nano ready | **Device only** | Practice keeps working without Wi-Fi |

**Model output is untrusted.** Every response is validated with Zod, and a reply grade with invalid JSON is retried once. Generated lessons only use room, character and prop IDs from the asset catalog, get one repair attempt if invalid, and are laid out by a pure, tested scene composer, so the model never invents geometry. Personal details are removed from lesson requests before any model sees them.

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    UI["React UI<br/>lesson, create, library, monitor"]
    Route["Routing policy<br/>task → inference mode"]
    Composer["Scene composer<br/>recipe → placed scene"]
    Catalog[("Asset catalog<br/>CC0 glTF props")]
    Player["three.js player"]
    Nano["Gemini Nano<br/>(Chrome built-in AI)"]
  end
  subgraph Firebase
    AC["App Check<br/>reCAPTCHA Enterprise"]
    AIL["Firebase AI Logic"]
    Gemini["Gemini (cloud)"]
    Auth["Authentication"]
    FS[("Cloud Firestore<br/>library, leaderboard")]
  end

  UI --> Route --> AIL
  AIL -- "on device" --> Nano
  AIL -- "cloud" --> Gemini
  AC -. "protects" .-> AIL
  UI --> Composer --> Catalog
  Composer --> Player
  UI --> Auth
  UI --> FS
```

## Quick start

Requires **Node 25** and **pnpm 12** (`npx -y pnpm@12.15.0 <command>` works if pnpm isn't installed).

```bash
git clone https://github.com/Xlient/SceneSpeak.git
cd SceneSpeak
pnpm install
cp .env.example .env.local   # fill in your Firebase values (see Full setup)
pnpm dev
```

Open http://localhost:5173.

## Full setup

<details>
<summary><b>1. Firebase project and AI Logic</b></summary>

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
2. Open **AI Logic** and enable it with the **Gemini Developer API** provider.
3. In **Project settings → Your apps**, register a **Web app** and copy its config.

</details>

<details>
<summary><b>2. App Check (required by AI Logic)</b></summary>

1. In **App Check**, register the web app with **reCAPTCHA Enterprise** and copy the site key.
2. For local development, add a **debug token** under App Check → Apps → ⋮ → Manage debug tokens. If you leave the token empty in `.env.local`, the dev build prints a new one in the browser console for you to register.

</details>

<details>
<summary><b>3. Authentication</b></summary>

In **Authentication → Sign-in method**, enable **Anonymous** and **Google**. Everyone starts as a guest; "Sign in with Google" links the guest to a Google account. If Anonymous is off, the app just offers Google sign-in.

</details>

<details>
<summary><b>4. Firestore (lesson library and leaderboard)</b></summary>

Create a **Firestore** database, then deploy the rules and indexes:

```bash
pnpm exec firebase deploy --only firestore
```

Without Firestore, sharing to the library is off and the Leaderboard shows only your local stats; featured and community lessons still work.

</details>

<details>
<summary><b>5. Environment</b></summary>

```bash
cp .env.example .env.local
```

Fill in the `VITE_FIREBASE_*` values, the App Check site key and (for development) the debug token. `.env.local` is git-ignored; never commit real keys.

</details>

<details>
<summary><b>6. On-device model (Gemini Nano)</b></summary>

- Desktop Chrome 139 or later.
- Enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, then restart Chrome.
- The model downloads on first use; Chrome only allows that after a click.
- Other browsers fall back to the cloud.

</details>

<details>
<summary><b>7. Deploying (optional)</b></summary>

Copy `.firebaserc.example` to `.firebaserc` (git-ignored) with your project ID, then use the Firebase CLI to deploy `dist/` to Hosting.

To deploy from GitHub instead, add the secrets and variable listed at the top of [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Pull requests then get a preview URL, and pushes to `main` go live.

</details>

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Typecheck, then build to `dist/` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Run the Vitest suite once (455 tests; also validates every lesson) |
| `pnpm test:rules` | Test `firestore.rules` against the Firestore emulator (21 tests; needs Java 21+) |

## Project structure

```
src/
  ai/          Firebase AI Logic client, prompts, parsers, App Check
  routing/     On-device vs cloud routing policy
  services/    Wires the real AI services (or stubs) into the UI
  lesson/      Lesson flow, scoring, featured lessons, generator contract
  library/     Shared lesson library (Firestore)
  leaderboard/ Opt-in weekly board (Firestore)
  auth/        Anonymous guest → Google
  scene/       Asset catalog, scene recipes, composer, three.js player
  audio/       Voice interfaces and push-to-talk recorder
  monitor/     Model Monitor events and summary
  onboarding/  Welcome tour and on-device setup
  schemas/     Zod schemas for model output
  ui/          React screens and components
lessons/       Community lessons, one JSON file per lesson
rules-tests/   Firestore security-rules tests (emulator)
public/assets/ CC0 glTF models used by the catalog
```

## Contributing

Contributions are welcome, especially **new lessons in any language**.

- **Add a lesson:** follow [`lessons/README.md`](lessons/README.md). It's one JSON file, `pnpm test` checks it, and a lesson mod reviews the pull request.
- **Code changes:** open an issue first for anything large, then a pull request using the [template](.github/pull_request_template.md).

**Before you open a pull request**

```bash
pnpm typecheck && pnpm test && pnpm build
```

**Conventions**

- TypeScript strict, no `any`. kebab-case file names, named exports.
- Validate external data with Zod at every boundary; treat model output as untrusted.
- Tests sit next to the code (`foo.ts` + `foo.test.ts`) and never call real AI: inject fakes.
- All AI goes through Firebase AI Logic (`firebase/ai`); no other AI SDKs.
- No secrets in the repo, and never store images or voice recordings.
- Keep the UI family-friendly and consistent with the tokens in [`src/ui/styles.css`](src/ui/styles.css).

By contributing you agree that your contribution is licensed under the [AGPL-3.0](LICENSE).

## Privacy

- Typed replies are graded on your device when Gemini Nano is available.
- Personal details are removed from lesson requests before any model sees them.
- Voice replies are opt-in, labelled as cloud, sent to the model call only, and never stored or logged.
- Progress stays in your browser. The weekly leaderboard is opt-in and stores only a first name and days practised.
- No analytics or tracking. Guests are anonymous; Google sign-in stores only your uid and display name in Firebase Auth.

## Credits

- 3D props: [KayKit Restaurant Bits](https://kaylousberg.itch.io/restaurant-bits) by [Kay Lousberg](https://kaylousberg.com) (CC0). License file in `public/assets/kaykit-restaurant/`.
- Fonts: [Fredoka](https://fonts.google.com/specimen/Fredoka) and [Nunito](https://fonts.google.com/specimen/Nunito) (SIL Open Font License), via Google Fonts.
- Built with [Firebase](https://firebase.google.com), [three.js](https://threejs.org), [React](https://react.dev), [Vite](https://vite.dev) and [Zod](https://zod.dev).

## License

SceneSpeak's code is licensed under the [GNU Affero General Public License v3.0](LICENSE). You may use, study, change and share it, but if you distribute it or run a modified version as a service, you must release your source code under the same license.

The SceneSpeak name and logo are not covered by this license. 3D models, fonts and other assets keep their own licenses (see [Credits](#credits)).
