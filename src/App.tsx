import { useEffect, useMemo, useRef, useState } from 'react';
import { HomeDashboard } from './components/HomeDashboard';
import { Layout } from './components/Layout';
import { ScenarioEditor } from './components/ScenarioEditor';
import { ScenarioPlayer } from './components/ScenarioPlayer';
import { StudentScenarioList } from './components/StudentScenarioList';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherLogin } from './components/TeacherLogin';
import { hasSupabaseEnv, supabase } from './lib/supabase';
import { queueGenerationForSlides, signedAudioUrl, uploadSlideAudio } from './services/audioService';
import { scenarioService } from './services/scenarioService';
import { slideService } from './services/slideService';
import type { StudioAudioAsset, StudioScenario, StudioSlide, View } from './types';
import './styles/app.css';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [user, setUser] = useState<any>(null);
  const [scenarios, setScenarios] = useState<StudioScenario[]>([]);
  const [selected, setSelected] = useState<StudioScenario | null>(null);
  const [slides, setSlides] = useState<StudioSlide[]>([]);
  const [assets, setAssets] = useState<Record<string, StudioAudioAsset>>({});
  const [index, setIndex] = useState(0);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const audioRef = useRef(new Audio());
  const stopRef = useRef(false);

  const selectedSlides = useMemo(() => [...slides].sort((a, b) => a.slide_number - b.slide_number), [slides]);

  async function refreshSlidesAndStatuses(scenarioId: string) {
    const sl = await slideService.listByScenario(scenarioId);
    setSlides(sl.map((s) => ({ ...s, audio_status: !s.current_audio_asset_id ? 'missing' : s.audio_status })));
  }

  async function loadPublished() { if (!supabase) return; setScenarios(await scenarioService.listPublished()); }
  async function loadMine(u = user) { if (!supabase || !u) return; setScenarios(await scenarioService.listMine(u.id)); }

  async function openScenario(s: StudioScenario, playerView: View = 'player') {
    setSelected(s);
    await refreshSlidesAndStatuses(s.id);
    const { data } = await supabase!.from('studio_audio_assets').select('*').eq('scenario_id', s.id).eq('is_current', true);
    const map: Record<string, StudioAudioAsset> = {};
    (data || []).forEach((a: any) => (map[a.id] = a));
    setAssets(map);
    setView(playerView);
    setIndex(0);
    setWarning('');
    setError('');
  }

  async function playAssetBySlide(slide: StudioSlide) {
    setWarning(''); setError('');
    const assetId = slide.current_audio_asset_id;
    if (!assetId || !assets[assetId]) {
      setWarning('Missing audio');
      return false;
    }
    try {
      const signed = await signedAudioUrl(assets[assetId].storage_path);
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = signed;
      await audioRef.current.play();
      return true;
    } catch (e: any) {
      setError(`Signed URL error: ${e.message || 'Unknown error'}`);
      return false;
    }
  }

  async function playCurrent() { await playAssetBySlide(selectedSlides[index]); }

  async function playFull() {
    stopRef.current = false;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    for (let i = 0; i < selectedSlides.length; i++) {
      if (stopRef.current) break;
      setIndex(i);
      const slide = selectedSlides[i];
      const ok = await playAssetBySlide(slide);
      if (!ok) continue;
      await new Promise<void>((resolve) => {
        const done = () => { audioRef.current.removeEventListener('ended', done); resolve(); };
        audioRef.current.addEventListener('ended', done);
      });
    }
  }

  function stopAudio() {
    stopRef.current = true;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  useEffect(() => { supabase?.auth.getUser().then(({ data }) => setUser(data.user)); }, []);

  return <Layout>{view === 'home' && <HomeDashboard missingEnv={!hasSupabaseEnv} onStudent={() => { loadPublished(); setView('student-list'); }} onTeacher={() => setView('teacher-login')} />}
    {view === 'student-list' && <StudentScenarioList scenarios={scenarios} onBack={() => setView('home')} onOpen={(s) => openScenario(s, 'player')} />}
    {(view === 'player' || view === 'teacher-preview') && selected && <ScenarioPlayer slides={selectedSlides} assets={assets} index={index} setIndex={setIndex} showTeacher={view === 'teacher-preview'} warning={warning} error={error} onPlaySlide={playCurrent} onPlayFull={playFull} onStop={stopAudio} onBack={() => { stopAudio(); setView(view === 'teacher-preview' ? 'teacher-dashboard' : 'student-list'); }} />}
    {view === 'teacher-login' && <TeacherLogin onBack={() => setView('home')} onLogin={async (e, p) => { await supabase?.auth.signInWithPassword({ email: e, password: p }); const { data } = await supabase?.auth.getUser()!; setUser(data.user); await loadMine(data.user); setView('teacher-dashboard'); }} />}
    {view === 'teacher-dashboard' && !user && <TeacherLogin onBack={() => setView('home')} onLogin={async (e, p) => { await supabase?.auth.signInWithPassword({ email: e, password: p }); const { data } = await supabase?.auth.getUser()!; setUser(data.user); await loadMine(data.user); setView('teacher-dashboard'); }} />}
    {view === 'teacher-dashboard' && user && <TeacherDashboard email={user.email} scenarios={scenarios} onBack={() => setView('home')} onLogout={async () => { await supabase?.auth.signOut(); setUser(null); setView('home'); }} onCreate={async () => { await scenarioService.create(user.id); await loadMine(); }} onEdit={async (s) => { setSelected(s); await refreshSlidesAndStatuses(s.id); setView('editor'); }} onPreview={(s) => openScenario(s, 'teacher-preview')} onDelete={async (s) => { await scenarioService.remove(s.id); await loadMine(); }} onToggle={async (s) => { await scenarioService.update(s.id, { is_published: !s.is_published }); await loadMine(); }} />}
    {view === 'editor' && selected && user && <ScenarioEditor scenario={selected} slides={selectedSlides} onBack={() => setView('teacher-dashboard')} onPatchScenario={async (p) => { setSelected({ ...selected, ...p }); await scenarioService.update(selected.id, p); }} onAddSlide={async () => { await slideService.create(selected.id, slides.length + 1); await refreshSlidesAndStatuses(selected.id); }} onMove={async (s, d) => { const i = selectedSlides.findIndex((x) => x.id === s.id); const j = i + d; if (j < 0 || j >= selectedSlides.length) return; const arr = [...selectedSlides]; [arr[i], arr[j]] = [arr[j], arr[i]]; for (let k = 0; k < arr.length; k++) await slideService.update(arr[k].id, { slide_number: k + 1, slide_key: `slide-${String(k + 1).padStart(3, '0')}` }); await refreshSlidesAndStatuses(selected.id); }} onPatchSlide={async (id, p) => { const current = selectedSlides.find((s) => s.id === id); const nextPatch: Partial<StudioSlide> = { ...p }; if (typeof p.audio_text === 'string' && current) { if (!current.current_audio_asset_id) nextPatch.audio_status = 'missing'; else nextPatch.audio_status = 'changed'; } await slideService.update(id, nextPatch); await refreshSlidesAndStatuses(selected.id); }} onDeleteSlide={async (id) => { await slideService.remove(id); const after = await slideService.listByScenario(selected.id); for (let k = 0; k < after.length; k++) await slideService.update(after[k].id, { slide_number: k + 1, slide_key: `slide-${String(k + 1).padStart(3, '0')}` }); await refreshSlidesAndStatuses(selected.id); }} onUpload={async (slide, f) => { const a = await uploadSlideAudio(user.id, selected.id, slide.id, f); setAssets({ ...assets, [a.id]: a as any }); await refreshSlidesAndStatuses(selected.id); }} onQueue={async (slide) => { await queueGenerationForSlides(selected.id, [slide], 'single'); await refreshSlidesAndStatuses(selected.id); }} onGenerateMissing={async () => { await queueGenerationForSlides(selected.id, selectedSlides, 'missing'); await refreshSlidesAndStatuses(selected.id); }} onRegenerateChanged={async () => { await queueGenerationForSlides(selected.id, selectedSlides, 'changed'); await refreshSlidesAndStatuses(selected.id); }} onForceRegenerate={async () => { await queueGenerationForSlides(selected.id, selectedSlides, 'all'); await refreshSlidesAndStatuses(selected.id); }} />}
  </Layout>;
}
