// Operaciones del administrador sobre Supabase. RLS permite todo esto solo a perfiles admin.

import { CONTENT_TYPES, OFFICE_EXTENSIONS, pretty, splitExtension, stamp } from '@portal-pdp/core';

import { BUCKET, callFunction, SIGNED_URL_SECONDS, supabase } from './supabase';
import type { DocumentRow, Role } from './types';

function check(error: { message: string } | null, what: string) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------
export async function createClient(name: string) {
  const { data, error } = await supabase.from('clients').insert({ name: name.trim() }).select('id').single();
  if (error?.code === '23505') throw new Error('Ya existe un cliente con ese nombre.');
  check(error, 'No pude crear el cliente');
  return data!.id as string;
}

export async function renameClient(id: string, name: string) {
  const { error } = await supabase.from('clients').update({ name: name.trim() }).eq('id', id);
  if (error?.code === '23505') throw new Error('Ya existe un cliente con ese nombre.');
  check(error, 'No pude renombrar el cliente');
}

/** Último día con acceso para los usuarios del cliente; null quita el vencimiento. */
export async function setAccessUntil(id: string, date: string | null) {
  const { error } = await supabase.from('clients').update({ access_until: date }).eq('id', id);
  check(error, 'No pude guardar el vencimiento');
}

/** Borra el cliente con todas sus secciones, documentos y archivos. Exige que ya no tenga usuarios. */
export async function deleteClient(id: string) {
  const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('client_id', id);
  if (count) throw new Error('Este cliente todavía tiene usuarios. Elimínalos primero desde la pestaña Usuarios.');
  await removeFolder(id);
  const { error } = await supabase.from('clients').delete().eq('id', id);
  check(error, 'No pude eliminar el cliente');
}

/** Vacía un cliente: borra sus archivos y secciones (los documentos caen en cascada). */
export async function clearClient(id: string) {
  await removeFolder(id);
  const { error } = await supabase.from('sections').delete().eq('client_id', id);
  check(error, 'No pude borrar las secciones anteriores');
}

/** Borra recursivamente todos los objetos bajo un prefijo del bucket. */
async function removeFolder(prefix: string) {
  const { data: items, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  check(error, 'No pude listar los archivos');
  const files: string[] = [];
  for (const item of items ?? []) {
    const path = `${prefix}/${item.name}`;
    if (item.id === null) await removeFolder(path);
    else files.push(path);
  }
  if (files.length) {
    const { error: rmError } = await supabase.storage.from(BUCKET).remove(files);
    check(rmError, 'No pude borrar los archivos');
  }
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------
export async function setSectionVisible(id: string, visible: boolean) {
  const { error } = await supabase.from('sections').update({ visible }).eq('id', id);
  check(error, 'No pude cambiar la visibilidad');
}

export async function setAllSectionsVisible(clientId: string, visible: boolean) {
  const { error } = await supabase.from('sections').update({ visible }).eq('client_id', clientId);
  check(error, 'No pude cambiar la visibilidad');
}

export async function createSection(clientId: string, number: number, name: string) {
  const { error } = await supabase
    .from('sections')
    .insert({ client_id: clientId, number, name: name.trim(), sort_order: number });
  check(error, 'No pude crear la sección');
}

export async function updateSection(id: string, number: number, name: string) {
  const { error } = await supabase.from('sections').update({ number, name: name.trim(), sort_order: number }).eq('id', id);
  check(error, 'No pude guardar la sección');
}

export async function deleteSection(id: string, documents: DocumentRow[]) {
  await removeFiles(documents);
  const { error } = await supabase.from('sections').delete().eq('id', id);
  check(error, 'No pude eliminar la sección');
}

// ---------------------------------------------------------------------------
// Documentos
// ---------------------------------------------------------------------------
async function removeFiles(documents: DocumentRow[]) {
  const paths = documents.flatMap((d) => [d.storage_path_original, d.storage_path_pdf].filter(Boolean) as string[]);
  for (let i = 0; i < paths.length; i += 500) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 500));
    check(error, 'No pude borrar los archivos');
  }
}

export async function deleteDocument(doc: DocumentRow) {
  await removeFiles([doc]);
  const { error } = await supabase.from('documents').delete().eq('id', doc.id);
  check(error, 'No pude eliminar el documento');
}

export async function openDocument(doc: DocumentRow) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path_pdf ?? doc.storage_path_original, SIGNED_URL_SECONDS);
  check(error, 'No pude abrir el documento');
  window.open(data!.signedUrl, '_blank', 'noopener');
}

async function upload(path: string, body: Blob | ArrayBuffer | Uint8Array, contentType: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType, upsert: true });
  check(error, `No pude subir ${path.split('/').pop()}`);
}

/** Convierte un Office a PDF en el servidor. */
async function convertOffice(file: Blob, fileName: string): Promise<ArrayBuffer> {
  const form = new FormData();
  form.append('file', file, fileName);
  const res = await callFunction('convertir', form);
  return res.arrayBuffer();
}

export interface StoreInput {
  clientId: string;
  clientName: string;
  sectionId: string;
  file: File;
  subfolder?: string | null;
  /** Fecha de publicación a conservar (reimportación de un documento que ya existía). */
  createdAt?: string;
}

export interface StoreResult {
  /** Mensaje si el documento quedó sin PDF (se puede reintentar luego). */
  warning?: string;
}

/**
 * Sube un archivo como documento: guarda el original, genera el PDF con marca de agua
 * (directo si ya es PDF, convertido si es Office) y registra la fila.
 */
export async function storeDocument({
  clientId,
  clientName,
  sectionId,
  file,
  subfolder,
  createdAt,
}: StoreInput): Promise<StoreResult> {
  const { base, ext } = splitExtension(file.name);
  const id = crypto.randomUUID();
  const prefix = `${clientId}/${id}`;
  const originalPath = `${prefix}/original${ext ? '.' + ext : ''}`;
  await upload(originalPath, file, CONTENT_TYPES[ext] ?? 'application/octet-stream');

  let pdfPath: string | null = null;
  let warning: string | undefined;
  try {
    let pdf: ArrayBuffer | null = null;
    if (ext === 'pdf') pdf = await file.arrayBuffer();
    else if (OFFICE_EXTENSIONS.includes(ext)) pdf = await convertOffice(file, file.name);
    if (pdf) {
      pdfPath = `${prefix}/documento.pdf`;
      await upload(pdfPath, await stamp(pdf, clientName), 'application/pdf');
    }
  } catch (e) {
    pdfPath = null;
    warning = `quedó sin PDF (${(e as Error).message})`;
  }

  const { error } = await supabase.from('documents').insert({
    id,
    section_id: sectionId,
    client_id: clientId,
    name: pretty(base),
    original_ext: ext,
    storage_path_original: originalPath,
    storage_path_pdf: pdfPath,
    size_bytes: file.size,
    doc_date: new Date(file.lastModified || Date.now()).toISOString().slice(0, 10),
    subfolder_label: subfolder ?? null,
    ...(createdAt ? { created_at: createdAt } : {}),
  });
  check(error, `No pude registrar ${file.name}`);
  return { warning };
}

/** Genera el PDF de un Office que quedó pendiente. */
export async function convertDocument(doc: DocumentRow, clientName: string) {
  const { data, error } = await supabase.storage.from(BUCKET).download(doc.storage_path_original);
  check(error, 'No pude descargar el original');
  const pdf = await convertOffice(data!, `${doc.name}.${doc.original_ext}`);
  const pdfPath = `${doc.client_id}/${doc.id}/documento.pdf`;
  await upload(pdfPath, await stamp(pdf, clientName), 'application/pdf');
  const { error: updError } = await supabase.from('documents').update({ storage_path_pdf: pdfPath }).eq('id', doc.id);
  check(updError, 'No pude guardar el PDF');
}

/** Ejecuta tareas con un máximo de `limit` a la vez. */
export async function pool<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await task(items[next++]);
  });
  await Promise.all(workers);
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------
async function usersFunction<T>(body: object): Promise<T> {
  const res = await callFunction('usuarios', JSON.stringify(body), 'application/json');
  return res.json();
}

export const createUser = (input: { email: string; full_name: string; role: Role; client_id: string | null }) =>
  usersFunction<{ user_id: string; password: string }>({ action: 'crear', ...input });

export const resetPassword = (userId: string) =>
  usersFunction<{ password: string }>({ action: 'restablecer', user_id: userId });

export const deleteUser = (userId: string) => usersFunction<{ ok: true }>({ action: 'eliminar', user_id: userId });

export async function setUserActive(id: string, active: boolean) {
  const { error } = await supabase.from('profiles').update({ active }).eq('id', id);
  check(error, 'No pude cambiar el acceso');
}
