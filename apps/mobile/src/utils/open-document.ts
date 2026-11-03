import { File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
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

/**
 * Pide el archivo al servidor. La función abrir-documento comprueba el permiso, estampa el correo
 * del usuario en el PDF, registra la acción y devuelve un enlace que caduca en 5 minutos.
 */
export async function requestFile(doc: DocumentRow, action: 'open' | 'download') {
  const { data, error } = await supabase.functions.invoke<{ url: string; ext: string }>('abrir-documento', {
    body: { document_id: doc.id, action },
  });
  if (error || !data) throw error ?? new Error('Sin respuesta del servidor');
  return data;
}

/** Descarga a la caché del celular con un nombre legible. */
async function downloadToCache(doc: DocumentRow, action: 'open' | 'download') {
  const { url, ext } = await requestFile(doc, action);
  const safeName = doc.name.replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
  const target = new File(Paths.cache, `${safeName}.${ext}`);
  const file = await File.downloadFileAsync(url, target, { idempotent: true });
  return { file, mime: MIME[ext] ?? 'application/octet-stream' };
}

/** Abre el documento en el visor del celular. */
export async function viewDocument(doc: DocumentRow) {
  if (Platform.OS === 'android') {
    const { file, mime } = await downloadToCache(doc, 'open');
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
  const { url } = await requestFile(doc, 'open');
  await WebBrowser.openBrowserAsync(url);
}

/** Descarga: abre el menú del sistema para guardar o compartir el archivo. */
export async function downloadDocument(doc: DocumentRow) {
  if (Platform.OS === 'web') {
    const { url } = await requestFile(doc, 'download');
    await WebBrowser.openBrowserAsync(url);
    return;
  }
  const { file, mime } = await downloadToCache(doc, 'download');
  await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: doc.name });
}
