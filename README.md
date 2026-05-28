# Nursing Scenario Studio

Fresh Vite + React + TypeScript app for nursing/OSCE scenario authoring and playback.

## Supabase project
- project_id: `aortrdzugehnaxvqcxpa`

## Env
Copy `.env.example` to `.env` and set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Run
```bash
npm install
npm run dev
npm run build
```

## Apply migrations (exact order)
In Supabase SQL Editor, run each file completely in this exact order:
1. `supabase/migrations/001_studio_schema.sql`
2. `supabase/migrations/002_studio_rls.sql`
3. `supabase/migrations/003_storage_policies.sql`
4. `supabase/migrations/004_seed_data.sql`

## Storage bucket
Create/check bucket `scenario-audio` (private).

## First teacher account
Use Supabase Auth email/password signup in Supabase Auth UI, then login from Teacher Login screen.

## How to test Play Full Scenario
1. Login as teacher.
2. Create or open a scenario with multiple slides.
3. Upload audio to at least two slides.
4. Publish scenario.
5. Open Student Player, open the scenario.
6. Click **Play Full Scenario** and confirm audio plays in slide order.
7. Confirm slides with no audio are skipped and show a warning.
8. Click **Stop** during playback and confirm sequence halts.

## ID strategy
UUID IDs for scenarios/slides/audio assets. `slide_number`/`slide_key` are ordering labels only.

## Audio storage strategy
Storage path format:
`{owner_id}/{scenario_id}/slides/{slide_id}/audio/{audio_asset_id}.{ext}`
Resolved by `slide.current_audio_asset_id -> studio_audio_assets.storage_path`.

## Future audio generation architecture
v1 only queues `studio_audio_generation_jobs`; runtime TTS/STT/Kokoro worker is not implemented yet.

## v1 limitations
- No AI/STT/TTS runtime generation worker.
- Minimal UI polish.
- No advanced validation/error surfacing.

## E2E smoke tests
```bash
npm run test:e2e
npm run test:e2e:ui
```
