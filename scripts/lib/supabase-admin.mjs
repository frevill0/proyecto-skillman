import { createClient } from '@supabase/supabase-js';

/** Cliente con la clave secreta (service role). Solo para scripts locales del administrador. */
export function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY en el archivo .env de la raíz del repo.');
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const BUCKET = 'documentos';
