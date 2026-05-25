import { CONFIG } from './config.js';

const supabaseUrl = CONFIG.supabaseUrl;
const supabaseKey = CONFIG.supabaseKey;

// Dynamic storage wrapper to handle persistence preference correctly
const dynamicStorage = {
  getItem: (key) => {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  },
  setItem: (key, value) => {
    const rememberMe = localStorage.getItem('rememberMe') !== 'false';
    if (rememberMe) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: dynamicStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export { supabase };
