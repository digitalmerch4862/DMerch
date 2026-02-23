import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://jfdvbyoyvqriqhqtmyjo.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHZieW95dnFyaXFocXRteWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTMxOTQsImV4cCI6MjA4NTY2OTE5NH0.t5-BcJx0BYAQcBBIclqTsXvoUAWUzA-rPCtEnWSiuuM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
