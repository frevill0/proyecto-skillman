// Importación de la carpeta de un cliente desde el navegador. Mismas reglas que scripts/importar-carpeta.mjs:
// - Cada subcarpeta de primer nivel es una sección; los archivos sueltos van a "00 Documentos generales".
// - Subcarpetas más profundas se aplanan y quedan como etiqueta del documento.
// - Se ignoran ~$*, .DS_Store, Thumbs.db, desktop.ini.

import { clientNameFromFolder, isIgnored, OFFICE_EXTENSIONS, parseSectionFolder, pretty, splitExtension } from '@portal-pdp/core';

import { clearClient, createClient, pool, storeDocument } from './api';
import { supabase } from './supabase';

export interface PickedFile {
  /** Ruta relativa con la carpeta raíz incluida: "PROYECTO X/01 GLOSARIO/archivo.docx". */
  path: string;
  file: File;
}

export interface PlanFile {
  key: string;
  file: File;
  name: string;
  ext: string;
  subfolder: string | null;
  /** Parece borrador o archivo de WhatsApp: se desmarca por defecto. */
  suspicious: boolean;
  include: boolean;
}

export interface PlanSection {
  key: string;
  number: number;
  name: string;
  include: boolean;
  files: PlanFile[];
}

export interface Plan {
  root: string;
  clientName: string;
  sections: PlanSection[];
}

const SUSPICIOUS = /borrador|draft|copia de|^doc-\d{8}-wa\d+|whatsapp/i;

export function buildPlan(picked: PickedFile[]): Plan | null {
  const items = picked.filter((p) => p.path.includes('/'));
  if (!items.length) return null;
  const root = items[0].path.split('/')[0];
  const sections = new Map<string, PlanSection>();

  for (const { path, file } of items) {
    const parts = path.split('/').slice(1);
    if (!parts.length || parts.some(isIgnored)) continue;
    const fileName = parts.at(-1)!;
    const sectionKey = parts.length === 1 ? '' : parts[0];

    if (!sections.has(sectionKey)) {
      const parsed = sectionKey ? parseSectionFolder(sectionKey) : { number: 0, name: 'Documentos generales' };
      sections.set(sectionKey, {
        key: sectionKey,
        number: parsed.number ?? 0,
        name: parsed.name,
        include: true,
        files: [],
      });
    }

    const { base, ext } = splitExtension(fileName);
    const folders = parts.slice(1, -1);
    const suspicious = SUSPICIOUS.test(fileName) || folders.some((f) => SUSPICIOUS.test(f));
    sections.get(sectionKey)!.files.push({
      key: path,
      file,
      name: pretty(base),
      ext,
      subfolder: folders.length ? folders.map(pretty).join(' / ') : null,
      suspicious,
      include: !suspicious,
    });
  }

  const ordered = [...sections.values()].sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, 'es'));
  for (const s of ordered) s.files.sort((a, b) => (a.subfolder ?? '').localeCompare(b.subfolder ?? '', 'es') || a.name.localeCompare(b.name, 'es'));
  return { root, clientName: clientNameFromFolder(root), sections: ordered };
}

/** Archivos que se van a subir, por sección incluida. */
export function selectedFiles(plan: Plan) {
  return plan.sections.filter((s) => s.include).flatMap((s) => s.files.filter((f) => f.include));
}

export const isOffice = (f: PlanFile) => OFFICE_EXTENSIONS.includes(f.ext);

/** Cliente existente con nombre igual o parecido (se reemplazará su contenido). */
export function findSimilarClient<T extends { name: string }>(clients: T[], name: string): T | undefined {
  const key = name.trim().toLowerCase();
  if (!key) return undefined;
  return clients.find((c) => {
    const other = c.name.toLowerCase();
    return other === key || other.includes(key) || key.includes(other);
  });
}

export interface ImportProgress {
  done: number;
  total: number;
  current: string;
  warnings: string[];
}

export interface ImportOptions {
  plan: Plan;
  existingClientId: string | null;
  hidden: boolean;
  onProgress: (p: ImportProgress) => void;
}

/** Crea o reemplaza el cliente y sube todo. Devuelve el id del cliente. */
export async function runImport({ plan, existingClientId, hidden, onProgress }: ImportOptions): Promise<string> {
  const clientName = plan.clientName.trim();
  const total = selectedFiles(plan).length;
  const progress: ImportProgress = { done: 0, total, current: 'Preparando el cliente…', warnings: [] };
  onProgress({ ...progress });

  let clientId: string;
  if (existingClientId) {
    clientId = existingClientId;
    progress.current = 'Borrando el contenido anterior…';
    onProgress({ ...progress });
    await clearClient(clientId);
    const { error } = await supabase.from('clients').update({ name: clientName }).eq('id', clientId);
    if (error) throw new Error(`No pude renombrar el cliente: ${error.message}`);
  } else {
    clientId = await createClient(clientName);
  }

  const sections = plan.sections.filter((s) => s.include);
  for (const [index, section] of sections.entries()) {
    const { data, error } = await supabase
      .from('sections')
      .insert({ client_id: clientId, number: section.number, name: section.name, sort_order: index, visible: !hidden })
      .select('id')
      .single();
    if (error) throw new Error(`No pude crear la sección «${section.name}»: ${error.message}`);

    await pool(
      section.files.filter((f) => f.include),
      3,
      async (f) => {
        progress.current = `${section.name} · ${f.file.name}`;
        onProgress({ ...progress, warnings: [...progress.warnings] });
        try {
          const { warning } = await storeDocument({
            clientId,
            clientName,
            sectionId: data.id,
            file: f.file,
            subfolder: f.subfolder,
          });
          if (warning) progress.warnings.push(`${f.file.name}: ${warning}`);
        } catch (e) {
          progress.warnings.push(`${f.file.name}: ${(e as Error).message}`);
        }
        progress.done++;
        onProgress({ ...progress, warnings: [...progress.warnings] });
      },
    );
  }

  progress.current = 'Listo';
  onProgress({ ...progress, warnings: [...progress.warnings] });
  return clientId;
}

// ---------------------------------------------------------------------------
// Leer carpetas soltadas (arrastrar y soltar)
// ---------------------------------------------------------------------------
type Entry = FileSystemEntry;

function readEntry(entry: Entry, path: string, out: PickedFile[]): Promise<void> {
  return new Promise((resolve) => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file(
        (file) => {
          out.push({ path: path + entry.name, file });
          resolve();
        },
        () => resolve(),
      );
      return;
    }
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const all: Entry[] = [];
    const loop = () =>
      reader.readEntries(
        (batch) => {
          if (batch.length) {
            all.push(...batch);
            loop();
          } else {
            Promise.all(all.map((e) => readEntry(e, `${path}${entry.name}/`, out))).then(() => resolve());
          }
        },
        () => resolve(),
      );
    loop();
  });
}

/** Devuelve los archivos de una carpeta soltada, o null si lo soltado no es una carpeta. */
export async function filesFromDrop(items: DataTransferItemList): Promise<PickedFile[] | null> {
  const entry = items[0]?.webkitGetAsEntry?.();
  if (!entry?.isDirectory) return null;
  const out: PickedFile[] = [];
  await readEntry(entry, '', out);
  return out;
}

export function filesFromInput(list: FileList): PickedFile[] {
  return Array.from(list).map((file) => ({ path: file.webkitRelativePath, file }));
}
