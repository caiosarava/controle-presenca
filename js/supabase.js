import { CONFIG } from './config.js';

const supabaseUrl = CONFIG.supabaseUrl;
const supabaseKey = CONFIG.supabaseKey;

// Configure persistence based on rememberMe preference
const rememberMe = localStorage.getItem('rememberMe') !== 'false';
const storage = rememberMe ? localStorage : sessionStorage;

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export { supabase };
