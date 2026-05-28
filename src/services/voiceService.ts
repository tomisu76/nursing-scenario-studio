import { supabase } from '../lib/supabase';
export const voiceService = { listMine: async (ownerId:string)=> (await supabase!.from('studio_voice_profiles').select('*').eq('owner_id', ownerId)).data || [] };
