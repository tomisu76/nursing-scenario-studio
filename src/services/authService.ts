import { supabase } from '../lib/supabase';

export const authService = {
  signIn: async (email: string, password: string) => supabase?.auth.signInWithPassword({ email, password }),
  signOut: async () => supabase?.auth.signOut(),
  getUser: async () => (await supabase?.auth.getUser())?.data.user,
};
