# Hackathon plan: Meta Global AI Developer Hackathon

**Deadline:** Nov 4, 2026, 9:00 PM ET. Judging runs Nov 4–8, and finals are on Nov 9.
**Theme:** Push the Frontier, accelerating a scientific experiment.
**Judged on:** creativity, technical ambition and whether it works (indie track), or technical execution and whether it holds up in production (startup track).

Tick each box when the item is done and merged. Work through the phases in order. Within a phase, items are listed by priority.

---

## Phase 1: Make it work end to end on Meta (Days 1–2: Oct 26–27)

These are blockers. Without them the demo breaks, or the project still depends on another provider.

### 1.1 Remove Amazon Nova from the mobile app
- [x] Add a `POST /api/transcribe` endpoint that uses Meta speech-to-text (`muse-voice-transcribe-1.0`, `POST https://api.meta.ai/v1/asr/transcribe`).
  - The endpoint only accepts mono 16-bit PCM WAV at 16 or 24 kHz, up to 32 MB and 10 minutes. The app records m4a by default, so either record WAV in the app or convert on the server.
  - Done: the server converts any upload with ffmpeg. The headers now read "Lab AI".
- [x] Replace `transcribeWithNova()` in `apps/mobile/screens/analyze-screen.tsx` with a call to the new endpoint.
- [x] Delete `EXPO_PUBLIC_NOVA_API_KEY` from the app and `.env.example`. Every `EXPO_PUBLIC_*` value is bundled into the app, so AI keys must never be set there.

### 1.2 Rebrand away from "Nova"
- [x] Replace the "Nova AI" headers in `app/(tabs)/index.tsx` and `screens/analyze-screen.tsx`.
- [x] Update the iOS microphone permission text in `app.json`. It currently says "Nova Lab needs microphone access…".
- [ ] Decide on the product name and use it in the app name, the README and the demo.

### 1.3 Fix database migrations
- [x] Create a migration for `ChatSession`, `ChatSessionMessage` and `Uploads`. They are in `schema.prisma` but missing from `prisma/migrations`, so a fresh database crashes chat and uploads.
- [x] Confirm that `prisma migrate deploy` on an empty database matches the schema.
  - Done in `20261026120000_sync_schema`. The schema had also drifted beyond those three tables: `User.password`, `department`, `instituition`, the `STUDENT` role and `_ProtocolTags`.
  - **Existing databases that were built with `prisma db push`:** mark both migrations as already applied instead of running them:
    `bunx prisma migrate resolve --applied 20250223061300_init` and `bunx prisma migrate resolve --applied 20261026120000_sync_schema`

### 1.4 Configure the mobile app per environment
- [x] Read `BASE_URL` and `WS_URL` in `apps/mobile/env.ts` from `EXPO_PUBLIC_API_BASE_URL` instead of the hard-coded ngrok URL.
- [ ] Set the production URL per EAS profile in `eas.json` `env`.

### 1.5 Deploy the API somewhere that supports WebSockets
- [ ] Choose a host: Fly.io, Railway or Render. AWS Lambda (the current `deploy` script) can't hold WebSocket connections, and live guidance needs them.
- [x] Add a Dockerfile for `apps/api`. Build it from the repo root with `docker build -f apps/api/Dockerfile .`. It installs ffmpeg and runs migrations on start, and has been tested against an empty database.
- [ ] Set up hosted Postgres and run the migrations.
- [ ] Set the environment variables `DATABASE_URL`, `JWT_SECRET`, `MODEL_API_KEY`, `ELEVENLABS_API_KEY`, and the storage variables.
  - `JWT_SECRET` is **required** in production. Without it, the code falls back to a hard-coded default secret.
  - Use `STORAGE_DRIVER=aws` with an S3 bucket. Container disks are temporary, so the default local storage loses uploads on every redeploy.
- [ ] Smoke test: health check, login, chat, gel analysis and a live guidance session from a phone.

### 1.6 Verify against the real Meta API
- [ ] Set `MODEL_API_KEY` and test chat, troubleshooting, protocol optimization, image analysis and live guidance.
- [ ] Check that Meta accepts the `json_schema` structured output used for analysis.

### 1.7 Security and housekeeping
- [ ] **Revoke the Amazon Nova API key.** `apps/mobile/.env` with `EXPO_PUBLIC_NOVA_API_KEY` was committed to the `lab-assistant-app` repo, and every installed build also contains it. Delete the variable from your local `apps/mobile/.env`.
- [ ] **Revoke the ElevenLabs API key.** It was hard-coded and pushed to `master`. Put the new key in `ELEVENLABS_API_KEY`.
- [x] Commit the EAS setup (`eas.json`, scripts, `app.json` project ID, Bun 1.4.4 pin).
- [ ] Merge `feat/meta-ai-adapters` into `master`.

---

## Phase 2: Show off Meta's models (Days 3–6: Oct 28–31)

This phase is where the "technical ambition" score comes from. It turns a chat app into one that produces measurable lab results.

### 2.1 SAM 3.1 for quantitative image analysis (highest impact)
- [ ] **Gel electrophoresis:** segment the lanes and bands, then measure band position and intensity, and estimate molecular weight against the ladder.
- [ ] **Microscopy:** segment cells to report cell count, confluence % and morphology flags.
- [ ] Combine the SAM output (masks and boxes) with Muse Spark's interpretation, so the result shows numbers plus an explanation.
- [ ] Show the masks overlaid on the image in the app. `@meta-sam/react` and `@meta-sam/parser` can render them.

### 2.2 Hands-free voice during live guidance
- [ ] Stream microphone audio from the app as 16 kHz PCM over the existing experiment WebSocket. This needs a native audio-streaming module, because `expo-audio` records to files.
- [ ] Add a speech-to-text adapter in the API that uses Meta's realtime ASR (`wss://api.meta.ai/v1/asr/realtime`). It should be pluggable, like the other AI providers.
- [ ] Send each final transcript to the model together with the latest camera frame, so the user can ask questions out loud.
- [ ] Simpler fallback if time is short: push-to-talk that records a WAV clip and sends it to `POST /api/transcribe`.

### 2.3 Video understanding
- [ ] Let the user record an experiment step, then have Muse Spark review it for deviations from the protocol.

### 2.4 Better reasoning for hard tasks
- [ ] Try Muse Wonder (`META_TEXT_MODEL=muse-wonder-1.0`) for protocol optimization and troubleshooting, and compare the output with Muse Spark.

---

## Phase 3: Submission package (Days 7–8: Nov 1–2)

- [ ] **Read the official rules** and list the required deliverables here.
- [ ] **README** at the repo root covering:
  - the problem
  - a demo GIF
  - the architecture diagram
  - which Meta models are used and where
  - how to run the project
  - a link to `apps/api/AI_PROVIDERS.md`
- [ ] **Clean up the docs.** Move or delete the roughly 40 `*_SUMMARY.md` / `*_COMPLETE.md` files in `apps/api` and `apps/mobile`, and keep only the useful API docs under `docs/`.
- [ ] **Demo video** of 2–3 minutes: create a protocol, run live guidance, analyze a gel with SAM, then show the results and next steps. Use a real or realistic lab setting.
- [ ] **A build judges can install:** an EAS preview build or TestFlight, plus a demo account with seeded sample data (protocols, experiments, gel images).
- [ ] Submit early, by Nov 3, to leave a buffer.

---

## Phase 4: Polish (if time allows)

- [ ] **One live session per connection.** The WebSocket handler currently shares one AI session across all users.
- [ ] **Remove test screens** from the app: `api-test`, `test-experiments`, and the duplicate `experiment-guidance-production`.
- [ ] **Tests:** install `vitest` and add API tests for auth, chat, analysis, and the AI provider factory with `AI_PROVIDER=mock`.
- [ ] **Old Nova names:** change the `nova-*` default model names in `UserSettings` in `schema.prisma`, plus the matching seed data. This needs a migration.
- [ ] **Type errors:** fix the 69 existing TypeScript errors, mostly `c.req.param()` typing in the routes.
- [ ] **EAS Update:** add over-the-air updates with `expo-updates` and `eas update:configure`.

---

## Schedule

| Day | Date | Focus |
|---|---|---|
| 1–2 | Oct 26–27 | Phase 1: Meta end to end, deployment, fixes |
| 3–6 | Oct 28–31 | Phase 2: SAM 3.1, voice, video |
| 7–8 | Nov 1–2 | Phase 3: README, video, builds |
| 9 | Nov 3 | Buffer, submit early |
| 10 | Nov 4 | Deadline, 9:00 PM ET |
