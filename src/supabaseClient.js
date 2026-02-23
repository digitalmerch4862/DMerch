import { createClient } from "@supabase/supabase-js";

// --- REPLACE THESE WITH YOUR ACTUAL PROJECT CREDENTIALS ---
const SUPABASE_URL = "https://jfdvbyoyvqriqhqtmyjo.supabase.co";
const SUPABASE_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHZieW95dnFyaXFocXRteWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTMxOTQsImV4cCI6MjA4NTY2OTE5NH0.t5-BcJx0BYAQcBBIclqTsXvoUAWUzA-rPCtEnWSiuuM";
// ---------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

export const signInWithGoogle = () => {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
};
