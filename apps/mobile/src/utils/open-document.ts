import { File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { BUCKET, SIGNED_URL_SECONDS, supabase } from '@/lib/supabase';
import type { DocumentRow } from '@/lib/types';

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

/** Lo que se muestra al cliente: el PDF (convertido y con marca de agua) si existe; si no, el original. */
export function servedFile(doc: DocumentRow) {
  if (doc.storage_path_pdf) return { path: doc.storage_path_pdf, ext: 'pdf' };
  return { path: doc.storage_path_original, ext: doc.original_ext };
}

export async function signedUrl(doc: DocumentRow) {
  const { path } = servedFile(doc);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

export async function logAccess(doc: DocumentRow, action: 'open' | 'download') {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  // Si el registro falla no se bloquea al usuario.
  await supabase.from('access_log').insert({ user_id: data.user.id, document_id: doc.id, action });
}

/** Descarga a la caché del celular con un nombre legible. */
async function downloadToCache(doc: DocumentRow) {
  const { ext } = servedFile(doc);
  const url = await signedUrl(doc);
  const safeName = doc.name.replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
  const target = new File(Paths.cache, `${safeName}.${ext}`);
  const file = await File.downloadFileAsync(url, target, { idempotent: true });
  return { file, mime: MIME[ext] ?? 'application/octet-stream' };
}

/** Abre el documento en el visor del celular. */
export async function viewDocument(doc: DocumentRow) {
  await logAccess(doc, 'open');
  if (Platform.OS === 'android') {
    const { file, mime } = await downloadToCache(doc);
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: file.contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: mime,
      });
    } catch {
      // Sin una app para ese tipo de archivo: ofrecer compartir/abrir con.
      await Sharing.shareAsync(file.uri, { mimeType: mime });
    }
    return;
  }
  await WebBrowser.openBrowserAsync(await signedUrl(doc));
}

/** Descarga: abre el menú del sistema para guardar o compartir el archivo. */
export async function downloadDocument(doc: DocumentRow) {
  await logAccess(doc, 'download');
  if (Platform.OS === 'web') {
    await WebBrowser.openBrowserAsync(await signedUrl(doc));
    return;
  }
  const { file, mime } = await downloadToCache(doc);
  await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: doc.name });
}
