import { createClient } from '@supabase/supabase-js';

// La clave publicable es pública por diseño (los permisos los pone RLS). La secreta nunca va aquí.
export const SUPABASE_URL = 'https://cqpaufrgffznxlsrlcoh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_FSolOcUNTCoAp0XXSOdL1g_ofndZdng';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export const BUCKET = 'documentos';
export const SIGNED_URL_SECONDS = 300;

/** Llama a una función del servidor con la sesión actual. Lanza un Error con el mensaje del servidor. */
export async function callFunction(name: string, body: BodyInit, contentType?: string): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('La sesión expiró. Vuelve a iniciar sesión.');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_PUBLISHABLE_KEY,
      ...(contentType ? { 'Content-Type': contentType } : {}),
    },
    body,
  }).catch(() => {
    throw new Error('No pude conectar con el servidor. Revisa tu conexión.');
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    if (res.status === 404) throw new Error('La función del servidor aún no está publicada.');
    throw new Error(payload?.error ?? `Error del servidor (${res.status}).`);
  }
  return res;
}
