import { CONFIG } from './config.js';

const supabaseUrl = CONFIG.supabaseUrl;
const supabaseKey = CONFIG.supabaseKey;

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

export { supabase };
