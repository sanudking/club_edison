import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://rcninxlruppkjanxayud.supabase.co';
const fallbackAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbmlueGxydXBwa2phbnhheXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMzI1NTAsImV4cCI6MjA4NjcwODU1MH0.jzwCmCGKddgQEiR2Q7kpkQKS38gCoe9zlCiuS37A8jQ';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
