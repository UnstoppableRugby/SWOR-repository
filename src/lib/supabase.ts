import { createClient } from '@supabase/supabase-js';

// Read database credentials from environment variables (set via .env or hosting provider)
// Fallbacks are provided for local development convenience but should be overridden in production
const supabaseUrl = import.meta.env.VITE_database_URL
  || 'https://lbweciluypxgmqcckfhu.databasepad.com';

const supabaseKey = import.meta.env.VITE_database_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImE5MjlmZGIzLTg5YmYtNDFlNS1iNGIxLWIwMmMwYmZkZDc3NiJ9.eyJwcm9qZWN0SWQiOiJsYndlY2lsdXlweGdtcWNja2ZodSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5NzE2NjkzLCJleHAiOjIwODUwNzY2OTMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.Hz8CWkSEVa0jkT7AhydWBvt04ZUdGBgEBrA7niFaqp4';

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
