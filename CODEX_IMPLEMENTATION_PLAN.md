# Nursing Scenario Studio — Codex Implementation Plan

Repository: `tomisu76/nursing-scenario-studio`

## Goal

Build a fresh clean React + TypeScript + Vite app for nursing English / OSCE scenario playback and editing.

Core product:

Teacher logs in, creates a scenario, adds ordered slides, uploads or later generates audio, publishes the scenario, and students can play the published scenario slide by slide or as a full audio sequence.

Do not copy the old app structure. This is a new clean app.

## Existing Supabase Project

Use the existing Supabase project:

```text
project name: obe osce
project_id: aortrdzugehnaxvqcxpa
region: ap-northeast-1
```

Do not create a new Supabase project.

Use prefixed new tables:

- `studio_scenarios`
- `studio_slides`
- `studio_audio_assets`
- `studio_voice_profiles`
- `studio_audio_generation_jobs`

Use Supabase Storage bucket:

```text
scenario-audio
```

Do not delete or overwrite existing storage objects.

## Tech Stack

- React
- TypeScript
- Vite
- Supabase JS client
- Simple clean CSS or Tailwind

Required commands:

```bash
npm install
npm run dev
npm run build
```

Environment variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never use service role key in frontend. Never commit `.env`. Create `.env.example`.

## Required Screens

1. Home Dashboard
   - title: Nursing Scenario Studio
   - Student Player button
   - Teacher Editor button
   - Supabase env warning if variables are missing

2. Student Scenario List
   - no login
   - load only published scenarios
   - show title, description, level, language
   - open scenario

3. Scenario Player
   - one slide at a time
   - show slide number, title, student_text, patient_text
   - do not show teacher_note in student mode
   - buttons: Previous, Next, Play Audio, Play Full Scenario, Stop, Back
   - never open editor popups from player
   - missing audio shows warning, no crash

4. Teacher Login
   - Supabase Auth email/password
   - show current teacher email
   - sign out button

5. Teacher Dashboard
   - login required
   - show own scenarios
   - create, edit, preview, publish/unpublish, delete

6. Scenario Editor
   - edit title, description, level, language, is_published
   - add/delete/reorder slides
   - edit slide title, student_text, patient_text, teacher_note, audio_text
   - upload/replace audio
   - audio status badge

7. Teacher Preview Player
   - can preview unpublished scenarios
   - shows teacher_note and audio debug/status

## ID Strategy

Never use filenames as primary IDs.

Use UUIDs:

```text
scenario.id = UUID
slide.id = UUID
audio_asset.id = UUID
```

Human labels only:

```text
slide_number = order only
slide_key = slide-001, slide-002
original_filename = uploaded filename
display_filename = slide-001.wav
```

Storage path:

```text
{owner_id}/{scenario_id}/slides/{slide_id}/audio/{audio_asset_id}.{ext}
```

Player must resolve audio through:

```text
slide.current_audio_asset_id -> studio_audio_assets.storage_path -> signed URL
```

Player must never guess `/slide-001.wav`.

Reordering slides must update `slide_number` and `slide_key` only. It must not rename storage files or change slide IDs.

Replacing audio creates a new `studio_audio_assets` row and updates `current_audio_asset_id`.

## Audio Generation Architecture

Actual Kokoro/TTS generation is not required in v1, but the data model must be ready.

Separate:

- screen text: `student_text`, `patient_text`, `teacher_note`
- speech text: `audio_text`
- audio asset: `studio_audio_assets`
- voice settings: `studio_voice_profiles`
- generation job: `studio_audio_generation_jobs`
- change detection: `audio_text_hash`

Slide audio statuses:

```text
missing
ready
changed
queued
generating
failed
```

Hash logic:

```text
sha256(normalized_audio_text + provider + model + voice_id + speed + language)
```

If the same hash already exists for an audio asset, do not regenerate unnecessarily.

Editor buttons to prepare:

- Generate audio for this slide
- Generate all missing audio
- Regenerate changed audio
- Force regenerate all audio

These buttons may only create `studio_audio_generation_jobs` in v1. Do not implement actual TTS worker yet.

## Database Migration

Create migration files under `supabase/migrations/`:

- `001_studio_schema.sql`
- `002_studio_rls.sql`
- `003_storage_policies.sql`
- `004_seed_data.sql`

### Core schema

```sql
create extension if not exists "pgcrypto";

create table if not exists public.studio_scenarios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  level text,
  language text default 'en-th',
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.studio_voice_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  role text,
  language text default 'en',
  provider text default 'kokoro',
  model text,
  voice_id text,
  speed numeric default 1.0,
  pitch numeric default 1.0,
  sample_rate integer default 24000,
  created_at timestamptz default now()
);

create table if not exists public.studio_slides (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.studio_scenarios(id) on delete cascade,
  slide_number integer not null,
  slide_key text,
  title text,
  student_text text,
  patient_text text,
  teacher_note text,
  audio_text text,
  audio_text_hash text,
  audio_status text default 'missing',
  audio_voice_profile_id uuid references public.studio_voice_profiles(id) on delete set null,
  current_audio_asset_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (scenario_id, slide_number)
);

create table if not exists public.studio_audio_assets (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.studio_scenarios(id) on delete cascade,
  slide_id uuid not null references public.studio_slides(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  bucket text not null default 'scenario-audio',
  storage_path text not null,
  original_filename text,
  display_filename text,
  mime_type text,
  file_size integer,
  duration_seconds numeric,
  version integer default 1,
  is_current boolean default true,
  text_hash text,
  provider text,
  model text,
  voice_profile_id uuid references public.studio_voice_profiles(id) on delete set null,
  generated_by_job_id uuid,
  created_at timestamptz default now()
);

alter table public.studio_slides
add constraint studio_slides_current_audio_asset_fk
foreign key (current_audio_asset_id)
references public.studio_audio_assets(id)
on delete set null;

create table if not exists public.studio_audio_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.studio_scenarios(id) on delete cascade,
  slide_id uuid not null references public.studio_slides(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  input_text text not null,
  normalized_text text not null,
  text_hash text not null,
  provider text default 'kokoro',
  model text,
  voice_profile_id uuid references public.studio_voice_profiles(id) on delete set null,
  language text default 'en',
  speed numeric default 1.0,
  status text default 'queued',
  attempts integer default 0,
  error_message text,
  output_audio_asset_id uuid references public.studio_audio_assets(id) on delete set null,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);
```

Add RLS policies:

- public can read published scenarios
- public can read slides/audio assets only for published scenarios
- authenticated owner can manage own scenarios, slides, audio assets, voice profiles, and generation jobs

Add storage policies:

- authenticated users can upload/read/update/delete audio only in their own folder where first path segment equals `auth.uid()`

## Frontend Structure

```text
src/
  main.tsx
  App.tsx
  types.ts
  lib/supabase.ts
  lib/hash.ts
  lib/audioText.ts
  services/authService.ts
  services/scenarioService.ts
  services/slideService.ts
  services/audioService.ts
  services/voiceService.ts
  components/Layout.tsx
  components/HomeDashboard.tsx
  components/StudentScenarioList.tsx
  components/ScenarioPlayer.tsx
  components/TeacherLogin.tsx
  components/TeacherDashboard.tsx
  components/ScenarioEditor.tsx
  components/SlideEditor.tsx
  components/AudioUploader.tsx
  components/AudioStatusBadge.tsx
  styles/app.css
```

## Playback Rules

- Use HTMLAudioElement
- no autoplay on page load
- play only after user click
- one shared audio controller
- stop current audio before starting another
- Play Full Scenario plays in slide_number order
- Stop interrupts sequence
- skip missing audio with warning

## Sample Scenarios

Create sample/seed data for:

1. Greeting and Self Introduction
2. Vital Signs
3. Pain Assessment
4. Shortness of Breath
5. SBAR Handover

Each with 3-5 slides. Audio can be null initially.

## README Must Include

- project purpose
- tech stack
- Supabase project used
- environment variables
- how to run migrations manually
- how to create/check `scenario-audio` bucket
- how to create first teacher account
- how to run dev/build
- ID strategy
- audio storage strategy
- future audio generation architecture
- v1 limitations

## Implementation Order

1. Create Vite React TypeScript app
2. Add Supabase client and env warning
3. Add migrations and README
4. Add auth
5. Add scenario CRUD
6. Add slide CRUD and reorder
7. Add audio upload and audio asset model
8. Add player single/full playback
9. Add generation job queue logic only
10. Polish UI
11. Run build and fix errors

## Definition of Done

Complete only when:

- `npm install` works
- `npm run dev` works
- `npm run build` passes
- teacher can log in
- teacher can create scenario
- teacher can add/edit/reorder slides
- teacher can upload/replace audio
- teacher can publish scenario
- student can see published scenario
- student can play one slide audio
- student can play full scenario
- stop works
- reorder does not break audio
- player never guesses audio path from slide number
- no editor popup appears in player mode
- README and migrations are included

## Final Report Required

At the end, report:

1. Summary of implemented features
2. Files created/modified
3. Supabase setup steps
4. Assumptions
5. Limitations
6. Exact local commands
7. Result of `npm run build`
