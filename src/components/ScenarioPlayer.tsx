import type { StudioAudioAsset, StudioSlide } from '../types';

export function ScenarioPlayer({
  slides,
  assets,
  index,
  setIndex,
  showTeacher = false,
  warning,
  error,
  onPlaySlide,
  onPlayFull,
  onStop,
  onBack,
}: {
  slides: StudioSlide[];
  assets: Record<string, StudioAudioAsset>;
  index: number;
  setIndex: (n: number) => void;
  showTeacher?: boolean;
  warning?: string;
  error?: string;
  onPlaySlide: () => void;
  onPlayFull: () => void;
  onStop: () => void;
  onBack: () => void;
}) {
  if (!slides.length) {
    return (
      <div>
        <button onClick={onBack}>Back</button>
        <p>No slides in this scenario yet.</p>
      </div>
    );
  }

  const s = slides[index];
  const audio = s.current_audio_asset_id ? assets[s.current_audio_asset_id] : null;

  return (
    <div>
      <button onClick={onBack}>Back</button>
      <h3>
        {index + 1}/{slides.length} {s?.title || 'Untitled Slide'}
      </h3>
      <p>{s?.student_text}</p>
      <p>{s?.patient_text}</p>
      {showTeacher && <p>{s?.teacher_note}</p>}
      <p>{audio ? `Audio asset: ${audio.id}` : 'Missing audio'}</p>
      {warning && <p className='warn'>{warning}</p>}
      {error && <p className='warn'>{error}</p>}
      <button onClick={() => setIndex(Math.max(0, index - 1))}>Previous</button>
      <button onClick={() => setIndex(Math.min(slides.length - 1, index + 1))}>Next</button>
      <button onClick={onPlaySlide}>Play Audio</button>
      <button onClick={onPlayFull}>Play Full Scenario</button>
      <button onClick={onStop}>Stop</button>
    </div>
  );
}
