
// Initialize Supabase Client
const SUPABASE_URL = 'https://rvtbvsnmeruuknqvywai.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pusmPwKL5Op72LYxHfWaSA_-OZms4PB';

let supabaseClient;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase Initialized');
} else {
    console.error('Supabase SDK not loaded!');
}
