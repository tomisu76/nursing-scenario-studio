import type { StudioScenario } from '../types';
import { supabase } from '../lib/supabase';

export const scenarioService = {
  listPublished: async () => (await supabase!.from('studio_scenarios').select('*').eq('is_published', true).order('updated_at', { ascending: false })).data as StudioScenario[] || [],
  listMine: async (ownerId: string) => (await supabase!.from('studio_scenarios').select('*').eq('owner_id', ownerId).order('updated_at', { ascending: false })).data as StudioScenario[] || [],
  create: async (owner_id: string) => (await supabase!.from('studio_scenarios').insert({ owner_id, title: 'Untitled Scenario' }).select().single()).data as StudioScenario,
  update: async (id: string, patch: Partial<StudioScenario>) => supabase!.from('studio_scenarios').update(patch).eq('id', id),
  remove: async (id: string) => supabase!.from('studio_scenarios').delete().eq('id', id),
};
