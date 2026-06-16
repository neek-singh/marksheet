import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jbbcpzkymgfuxkfgnbfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYmNwemt5bWdmdXhrZmduYmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Nzk2MDgsImV4cCI6MjA5MTM1NTYwOH0.61m09vQiE6x_9vUSemXqthKIimP-t_5R5zq94mFLje4';

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
