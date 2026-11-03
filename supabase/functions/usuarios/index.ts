// Altas, contraseñas y bajas de usuarios desde el panel. Solo para administradores.
// Crear usuarios necesita la clave secreta, por eso vive aquí y no en el navegador.
//
// POST { action: 'crear', email, full_name, role, client_id }  → { user_id, password }
// POST { action: 'restablecer', user_id }                       → { password }
// POST { action: 'eliminar', user_id }                          → { ok: true }
//
// Activar o revocar el acceso no pasa por aquí: el panel cambia profiles.active (RLS lo permite al admin).

import { corsHeaders, json, requireAdmin, serviceClient } from '../_shared/admin.ts';

type Body =
  | { action: 'crear'; email: string; full_name?: string; role: 'admin' | 'client_user'; client_id?: string | null }
  | { action: 'restablecer'; user_id: string }
  | { action: 'eliminar'; user_id: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const supabase = serviceClient();
  const adminId = await requireAdmin(req, supabase);
  if (adminId instanceof Response) return adminId;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return json({ error: 'Petición inválida.' }, 400);

  if (body.action === 'crear') {
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'El correo no es válido.' }, 400);
    if (body.role !== 'admin' && !body.client_id) return json({ error: 'Elige el cliente del usuario.' }, 400);
    const fullName = body.full_name?.trim() || email.split('@')[0];

    const password = temporaryPassword();
    let userId = await findUserId(supabase, email);
    if (userId) {
      const { error } = await supabase.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 400);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error) return json({ error: error.message }, 400);
      userId = data.user.id;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName,
      role: body.role,
      client_id: body.role === 'admin' ? null : body.client_id,
      active: true,
    });
    if (error) return json({ error: error.message }, 400);
    return json({ user_id: userId, password });
  }

  if (body.action === 'restablecer') {
    const password = temporaryPassword();
    const { error } = await supabase.auth.admin.updateUserById(body.user_id, { password });
    if (error) return json({ error: error.message }, 400);
    return json({ password });
  }

  if (body.action === 'eliminar') {
    if (body.user_id === adminId) return json({ error: 'No puedes eliminar tu propia cuenta.' }, 400);
    const { error } = await supabase.auth.admin.deleteUser(body.user_id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: 'Acción desconocida.' }, 400);
});

async function findUserId(supabase: ReturnType<typeof serviceClient>, email: string) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 200) return null;
  }
}

/** 12 caracteres sin símbolos ambiguos (0/O, 1/l). */
function temporaryPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const random = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(random, (n) => chars[n % chars.length]).join('');
}
