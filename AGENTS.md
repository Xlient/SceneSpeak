# AGENTS.md

> **Draft.** Starting rules for AI coding agents in this repo. Edit freely.

## Project

SceneSpeak: 5-minute language lessons in low-poly 3D scenes. Gemini Nano grades replies on-device; cloud Gemini writes scenarios and handles open dialogue.

## Hard rules

- **AI goes through Firebase AI Logic only** (`firebase/ai`): Gemini in the cloud, Gemini Nano on-device via hybrid inference. No other AI SDKs or direct API calls.
- **The user owns `src/ai/` (Firebase inference code), `src/routing/`, the scoring logic, and `evals/` (evals and harnesses).** Guide there with concepts and small pseudocode, and review the user's work, but don't implement unless the user asks for code.
- **Never commit or push.** The user commits.
- **No secrets in the repo.** Real config lives only in `.env.local`. Never read or write it.
- **No new dependencies without asking.** Pin exact versions.
- **Docs go in `documents/`** (git-ignored), except `README.md`. Never commit planning or notes docs.
- **Never persist images or voice** (no storage, no logs, no uploads beyond the model call).

## Look and feel

- Cute chibi characters, low-poly scenes, family friendly.
- UI matches KayKit's style: soft pastels, chunky rounded shapes, thick outlines, toy-like 3D buttons, rounded type. Keep new UI consistent with `src/ui/styles.css` tokens.

## Hackathon constraints (#BuildHybridAI, due Nov 30, 2026 2 PM PT)

- Every AI call goes through Firebase AI Logic hybrid inference: on-device first, cloud fallback.
- App Check is required (debug tokens accepted).
- The repo must import **and call** `firebase/ai` at runtime, not just mention it in docs.
- The repo needs an open source license file (Apache-2.0 preferred).
- The README must state the value proposition and give complete setup steps.
- The app must be free to use. All materials in English.

## Code

- TypeScript strict. No `any`.
- Validate with Zod at every boundary: model output, env, network, storage. Treat model output as untrusted: parse, clamp, drop unknown enum values.
- Small pure functions with tests. Vitest tests sit next to the code (`foo.ts` + `foo.test.ts`).
- No real AI calls in tests. Inject fakes.
- Every AI call should get a timeout and an `AbortSignal` (point this out when reviewing).
- Comments: keep them minimal and tight. Short, not wordy, and only when the logic isn't obvious (the why, not the what).
- kebab-case file names, named exports only.
- Accessibility basics: semantic HTML, labelled controls, visible focus, `aria-live` for status, keyboard-usable.

## Before you finish

Run `pnpm typecheck`, `pnpm test` and `pnpm build`.

## Style of answers

Keep answers short.
