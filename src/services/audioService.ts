import { supabase } from '../lib/supabase';
import { normalizeAudioText } from '../lib/audioText';
import { sha256 } from '../lib/hash';
import type { StudioSlide } from '../types';

export type QueueMode = 'single' | 'missing' | 'changed' | 'all';

export async function uploadSlideAudio(ownerId: string, scenarioId: string, slideId: string, file: File) {
  const ext = file.name.split('.').pop() || 'wav';
  const assetId = crypto.randomUUID();
  const path = `${ownerId}/${scenarioId}/slides/${slideId}/audio/${assetId}.${ext}`;
  await supabase!.storage.from('scenario-audio').upload(path, file, { upsert: false });
  const { data } = await supabase!
    .from('studio_audio_assets')
    .insert({
      id: assetId,
      owner_id: ownerId,
      scenario_id: scenarioId,
      slide_id: slideId,
      storage_path: path,
      original_filename: file.name,
      display_filename: file.name,
      mime_type: file.type,
    })
    .select()
    .single();
  await supabase!
    .from('studio_slides')
    .update({ current_audio_asset_id: assetId, audio_status: 'ready' })
    .eq('id', slideId);
  return data;
}

export async function computeAudioHash(audioText: string) {
  const normalized = normalizeAudioText(audioText);
  const textHash = await sha256(`${normalized}|kokoro|||1.0|en`);
  return { normalized, textHash };
}

export async function queueGenerationJob(scenarioId: string, slideId: string, audioText: string) {
  const { normalized, textHash } = await computeAudioHash(audioText);
  return supabase!.from('studio_audio_generation_jobs').insert({
    scenario_id: scenarioId,
    slide_id: slideId,
    input_text: audioText,
    normalized_text: normalized,
    text_hash: textHash,
    status: 'queued',
  });
}

export async function queueGenerationForSlides(scenarioId: string, slides: StudioSlide[], mode: QueueMode) {
  for (const slide of slides) {
    const hasAudio = Boolean(slide.current_audio_asset_id);
    const shouldQueue =
      mode === 'all' ||
      (mode === 'missing' && !hasAudio) ||
      (mode === 'changed' && slide.audio_status === 'changed') ||
      mode === 'single';

    if (!shouldQueue) continue;

    const audioText = slide.audio_text?.trim() || `${slide.student_text ?? ''} ${slide.patient_text ?? ''}`.trim();
    if (!audioText) continue;

    await queueGenerationJob(scenarioId, slide.id, audioText);
    await supabase!.from('studio_slides').update({ audio_status: 'queued' }).eq('id', slide.id);
  }
}

export async function signedAudioUrl(storagePath: string) {
  const { data, error } = await supabase!.storage.from('scenario-audio').createSignedUrl(storagePath, 60 * 10);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Failed to create signed URL');
  return data.signedUrl;
}
