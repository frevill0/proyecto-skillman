// Entrega un documento a la app con la marca de agua de quien lo consulta.
//
// POST { document_id, action: 'open' | 'download' }  →  { url, ext }
//
// - Comprueba con el token del usuario (RLS) que puede ver el documento.
// - Si tiene PDF, le estampa "correo · fecha" en cada página, lo deja en una copia temporal
//   y devuelve un enlace firmado de 5 minutos. Las copias temporales se borran a los 10 minutos.
// - Imágenes y Office sin PDF se entregan tal cual (la app superpone la marca en las imágenes).
// - Registra la apertura o descarga en access_log (no para administradores).
//
// Los clientes ya no pueden firmar archivos del bucket por su cuenta: este es el único camino.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { degrees, PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';

import { corsHeaders, json, serviceClient } from '../_shared/admin.ts';

const BUCKET = 'documentos';
const SIGNED_URL_SECONDS = 300;
const TEMP_MAX_AGE_MS = 10 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Falta iniciar sesión.' }, 401);

  const service = serviceClient();
  const { data: auth, error: authError } = await service.auth.getUser(token);
  if (authError || !auth.user) return json({ error: 'La sesión no es válida.' }, 401);
  const user = auth.user;

  const body = await req.json().catch(() => null);
  const documentId = body?.document_id as string | undefined;
  const action = body?.action === 'download' ? 'download' : 'open';
  if (!documentId) return json({ error: 'Falta el documento.' }, 400);

  // Leer con el token del usuario: si RLS no le deja ver el documento, no existe para él.
  const asUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: doc } = await asUser
    .from('documents')
    .select('id, original_ext, storage_path_original, storage_path_pdf')
    .eq('id', documentId)
    .maybeSingle();
  if (!doc) return json({ error: 'Este documento no está disponible.' }, 404);

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).maybeSingle();

  let path = doc.storage_path_original as string;
  let ext = doc.original_ext as string;

  if (doc.storage_path_pdf) {
    const { data: file, error } = await service.storage.from(BUCKET).download(doc.storage_path_pdf);
    if (error || !file) return json({ error: 'No pude leer el documento.' }, 500);

    const stamped = await stampUser(new Uint8Array(await file.arrayBuffer()), user.email ?? user.id);
    if (!stamped) return json({ error: 'No pude preparar el documento.' }, 500);

    await removeOldCopies(service, user.id);
    path = `temporal/${user.id}/${Date.now()}-${crypto.randomUUID()}.pdf`;
    ext = 'pdf';
    const { error: upError } = await service.storage
      .from(BUCKET)
      .upload(path, stamped, { contentType: 'application/pdf' });
    if (upError) return json({ error: 'No pude preparar el documento.' }, 500);
  }

  const { data: signed, error: signError } = await service.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (signError || !signed) return json({ error: 'No pude generar el enlace.' }, 500);

  if (profile?.role !== 'admin') {
    await service.from('access_log').insert({ user_id: user.id, document_id: doc.id, action });
  }

  return json({ url: signed.signedUrl, ext });
});

/** Pie "Consultado por … · fecha" y el correo en diagonal, en cada página. Null si el PDF no se puede abrir. */
async function stampUser(bytes: Uint8Array, email: string): Promise<Uint8Array | null> {
  try {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const when = new Date().toLocaleString('es-EC', {
      timeZone: 'America/Guayaquil',
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const safe = (text: string) => {
      try {
        font.encodeText(text);
        return text;
      } catch {
        return text.replace(/[^\x20-\x7E]/g, '?');
      }
    };
    const footer = safe(`Consultado por ${email} · ${when}`);
    const diagonal = safe(email);

    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize();
      const small = Math.max(6, Math.min(width, height) / 80);
      page.drawText(footer, { x: 24, y: 14, size: small, font, color: rgb(0.35, 0.35, 0.35), opacity: 0.7 });

      const size = Math.min(width, height) / 26;
      const textWidth = font.widthOfTextAtSize(diagonal, size);
      for (const fy of [0.22, 0.78]) {
        page.drawText(diagonal, {
          x: width / 2 - (textWidth / 2) * Math.cos(Math.PI / 6),
          y: height * fy - (textWidth / 2) * Math.sin(Math.PI / 6),
          size,
          font,
          color: rgb(0.45, 0.45, 0.45),
          opacity: 0.16,
          rotate: degrees(30),
        });
      }
    }
    return await pdf.save({ useObjectStreams: false });
  } catch {
    return null;
  }
}

/** Borra las copias temporales de este usuario con más de 10 minutos. */
async function removeOldCopies(service: ReturnType<typeof serviceClient>, userId: string) {
  const prefix = `temporal/${userId}`;
  const { data } = await service.storage.from(BUCKET).list(prefix, { limit: 1000 });
  const cutoff = Date.now() - TEMP_MAX_AGE_MS;
  const old = (data ?? [])
    .filter((f) => Number(f.name.split('-')[0]) < cutoff)
    .map((f) => `${prefix}/${f.name}`);
  if (old.length) await service.storage.from(BUCKET).remove(old);
}
