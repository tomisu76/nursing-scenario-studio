import type { StudioSlide } from '../types';
import { supabase } from '../lib/supabase';
export const slideService = {
  listByScenario: async (scenarioId: string) => (await supabase!.from('studio_slides').select('*').eq('scenario_id', scenarioId).order('slide_number')).data as StudioSlide[] || [],
  create: async (scenario_id: string, slide_number: number) => (await supabase!.from('studio_slides').insert({ scenario_id, slide_number, slide_key: `slide-${String(slide_number).padStart(3,'0')}` }).select().single()).data as StudioSlide,
  update: async (id: string, patch: Partial<StudioSlide>) => supabase!.from('studio_slides').update(patch).eq('id', id),
  remove: async (id: string) => supabase!.from('studio_slides').delete().eq('id', id),
};
