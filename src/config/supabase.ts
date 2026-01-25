// Supabase Configuration for Haven
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://argeddeskonatzovyzil.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZ2VkZGVza29uYXR6b3Z5emlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mzc1NzIsImV4cCI6MjA4NDExMzU3Mn0.sTHJI8nZvD1_uZZOQ6WSaCNRdERk3lMaa76O0roJgI0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
