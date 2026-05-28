export type View = 'home' | 'student-list' | 'player' | 'teacher-login' | 'teacher-dashboard' | 'editor' | 'teacher-preview';

export type StudioScenario = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  level: string | null;
  language: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type StudioSlide = {
  id: string;
  scenario_id: string;
  slide_number: number;
  slide_key: string | null;
  title: string | null;
  student_text: string | null;
  patient_text: string | null;
  teacher_note: string | null;
  audio_text: string | null;
  audio_text_hash: string | null;
  audio_status: 'missing'|'ready'|'changed'|'queued'|'generating'|'failed';
  audio_voice_profile_id: string | null;
  current_audio_asset_id: string | null;
};

export type StudioAudioAsset = {
  id: string;
  slide_id: string;
  scenario_id: string;
  owner_id: string;
  bucket: string;
  storage_path: string;
  display_filename: string | null;
  original_filename: string | null;
  mime_type: string | null;
};
