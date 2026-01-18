
import { createClient } from '@supabase/supabase-js';

// Credenciales proporcionadas por el usuario
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bsicoqackurqvoyzrcjb.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzaWNvcWFja3VycXZveXpyY2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTM4MjEsImV4cCI6MjA4MzgyOTgyMX0.dU6gj8dOR3qpDm4fALngj8gS_4EFikjXAwM2jiuRCbI';

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ ATENCIÓN: No se encontraron las credenciales de Supabase. Usando valores predeterminados o vacíos.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
