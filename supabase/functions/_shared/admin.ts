// Utilidades comunes de las funciones: CORS, respuestas JSON y comprobar que quien llama es administrador.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Cliente con la clave secreta: salta RLS. Solo se usa dentro de las funciones. */
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Valida el token de la petición y exige un perfil admin activo.
 * Devuelve el id del administrador, o una respuesta de error lista para devolver.
 */
export async function requireAdmin(req: Request, supabase: SupabaseClient): Promise<string | Response> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Falta iniciar sesión.' }, 401);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return json({ error: 'La sesión no es válida.' }, 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profile?.role !== 'admin' || !profile.active) {
    return json({ error: 'Solo un administrador puede hacer esto.' }, 403);
  }
  return data.user.id;
}
