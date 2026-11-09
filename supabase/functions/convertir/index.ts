// Convierte un Word, Excel o PowerPoint a PDF con el servicio de conversión (Gotenberg con LibreOffice).
// Recibe el archivo en multipart (campo "file") y devuelve el PDF. Solo para administradores.
// La marca de agua la pone el panel después, igual que con los PDF originales.
//
// Secretos necesarios (supabase secrets set ...):
//   GOTENBERG_URL       p. ej. https://portal-pdp-conversion-xxxx.run.app
//   GOTENBERG_USER      usuario de autenticación básica del servicio
//   GOTENBERG_PASSWORD  contraseña de autenticación básica del servicio

import { corsHeaders, json, requireAdmin, serviceClient } from '../_shared/admin.ts';

const OFFICE = /\.(docx?|xlsx?|pptx?)$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const admin = await requireAdmin(req, serviceClient());
  if (admin instanceof Response) return admin;

  // Leer el cuerpo antes de cualquier respuesta: si no, la conexión se cuelga hasta el límite de 150 s.
  const form = await req.formData().catch(() => null);

  const url = Deno.env.get('GOTENBERG_URL');
  if (!url) return json({ error: 'El servicio de conversión aún no está configurado.' }, 503);

  const file = form?.get('file');
  if (!(file instanceof File) || !OFFICE.test(file.name)) {
    return json({ error: 'Envía un archivo de Word, Excel o PowerPoint en el campo "file".' }, 400);
  }

  const body = new FormData();
  body.append('files', file, file.name);
  const auth = btoa(`${Deno.env.get('GOTENBERG_USER') ?? ''}:${Deno.env.get('GOTENBERG_PASSWORD') ?? ''}`);
  const res = await fetch(`${url.replace(/\/$/, '')}/forms/libreoffice/convert`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}` },
    body,
  }).catch((e: Error) => e);

  if (res instanceof Error) return json({ error: `No pude conectar con el servicio de conversión: ${res.message}` }, 502);
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    return json({ error: `La conversión falló (${res.status}): ${detail}` }, 502);
  }

  return new Response(res.body, {
    headers: { ...corsHeaders, 'Content-Type': 'application/pdf' },
  });
});
