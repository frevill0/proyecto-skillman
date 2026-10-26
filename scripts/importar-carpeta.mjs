// Importa la carpeta de un cliente a Supabase.
// Uso: npm run importar -- "C:\ruta\PROYECTO CLIENTE" [--excluir "texto"]... [--simular]
//
// --excluir  omite archivos y carpetas cuya ruta contenga ese texto (se puede repetir).
// --simular  muestra qué se subiría, sin tocar Supabase.
//
// - Crea el cliente (o reemplaza el contenido de uno con nombre parecido).
// - Cada subcarpeta de primer nivel es una sección; los archivos sueltos van a "00 Documentos generales".
// - Subcarpetas más profundas se aplanan y quedan como etiqueta del documento.
// - Word/Excel/PowerPoint se convierten a PDF si LibreOffice está instalado.
// - A los PDF se les estampa "Confidencial · <cliente>" en cada página.

import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import {
  clientNameFromFolder,
  CONTENT_TYPES,
  isIgnored,
  OFFICE_EXTENSIONS,
  parseSectionFolder,
  pretty,
  splitExtension,
} from './lib/reglas.mjs';
import { adminClient, BUCKET } from './lib/supabase-admin.mjs';

const args = process.argv.slice(2);
const root = args[0];
const dryRun = args.includes('--simular');
const excludes = args.flatMap((a, i) => (a === '--excluir' && args[i + 1] ? [args[i + 1].toLowerCase()] : []));
if (!root || !existsSync(root) || !statSync(root).isDirectory()) {
  console.error('Uso: npm run importar -- "C:\\ruta\\PROYECTO CLIENTE" [--excluir "texto"] [--simular]');
  process.exit(1);
}

const isExcluded = (relParts) => {
  const rel = relParts.join('/').toLowerCase();
  return excludes.some((x) => rel.includes(x));
};

const supabase = dryRun ? null : adminClient();
const clientName = clientNameFromFolder(basename(root));
const soffice = findLibreOffice();
const tmp = mkdtempSync(join(tmpdir(), 'portal-pdp-'));

// ---------------------------------------------------------------------------
// 1. Leer la carpeta
// ---------------------------------------------------------------------------
function listFiles(dir, rel = []) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (isIgnored(entry.name) || isExcluded([...rel, entry.name])) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, [...rel, entry.name]));
    else if (entry.isFile()) out.push({ full, rel: [...rel, entry.name] });
  }
  return out;
}

const sections = new Map(); // nombre de carpeta → { number, name, files: [] }
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isDirectory() && !isIgnored(entry.name) && !isExcluded([entry.name])) {
    sections.set(entry.name, { ...parseSectionFolder(entry.name), files: [] });
  }
}
for (const file of listFiles(root)) {
  if (file.rel.length === 1) {
    if (!sections.has('')) sections.set('', { number: 0, name: 'Documentos generales', files: [] });
    sections.get('').files.push({ ...file, subfolder: null });
  } else {
    const subfolder = file.rel.length > 2 ? file.rel.slice(1, -1).map(pretty).join(' / ') : null;
    sections.get(file.rel[0]).files.push({ ...file, subfolder });
  }
}

const ordered = [...sections.values()].sort(
  (a, b) => (a.number ?? 9999) - (b.number ?? 9999) || a.name.localeCompare(b.name, 'es'),
);
const totalFiles = ordered.reduce((n, s) => n + s.files.length, 0);
const officeFiles = ordered.flatMap((s) => s.files).filter((f) => OFFICE_EXTENSIONS.includes(splitExtension(f.rel.at(-1)).ext));

console.log(`\nCliente: ${clientName}`);
console.log(`${ordered.length} secciones, ${totalFiles} archivos (${officeFiles.length} de Office).`);
if (excludes.length) console.log(`Excluidos: ${excludes.join(', ')}`);
if (officeFiles.length && !soffice) {
  console.log('⚠ LibreOffice no está instalado: los archivos de Office se suben sin convertir a PDF.');
}

if (dryRun) {
  for (const s of ordered) {
    console.log(`\n${String(s.number ?? '?').padStart(2, '0')} ${s.name}  (${s.files.length})`);
    for (const f of s.files) {
      console.log(`   · ${pretty(splitExtension(f.rel.at(-1)).base)}${f.subfolder ? `  [${f.subfolder}]` : ''}`);
    }
  }
  console.log('\nSimulación: no se subió nada.\n');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 2. Crear o reemplazar el cliente
// ---------------------------------------------------------------------------
const clientId = await upsertClient(clientName);

// ---------------------------------------------------------------------------
// 3. Secciones y documentos
// ---------------------------------------------------------------------------
let done = 0;
for (const [index, section] of ordered.entries()) {
  const { data: sectionRow, error } = await supabase
    .from('sections')
    .insert({
      client_id: clientId,
      number: section.number ?? 0,
      name: section.name,
      sort_order: index,
    })
    .select('id')
    .single();
  if (error) fail('No pude crear la sección', section.name, error);

  for (const file of section.files) {
    done++;
    const fileName = file.rel.at(-1);
    const { base, ext } = splitExtension(fileName);
    const docId = randomUUID();
    const prefix = `${clientId}/${docId}`;
    const stat = statSync(file.full);
    process.stdout.write(`[${done}/${totalFiles}] ${section.name} · ${fileName} `);

    const originalPath = `${prefix}/original${ext ? '.' + ext : ''}`;
    await upload(originalPath, readFileSync(file.full), CONTENT_TYPES[ext] ?? 'application/octet-stream');

    let pdfBytes = null;
    if (ext === 'pdf') pdfBytes = readFileSync(file.full);
    else if (OFFICE_EXTENSIONS.includes(ext) && soffice) pdfBytes = convertToPdf(file.full);

    let pdfPath = null;
    if (pdfBytes) {
      pdfPath = `${prefix}/documento.pdf`;
      await upload(pdfPath, await stamp(pdfBytes, clientName), 'application/pdf');
    }

    const { error: docError } = await supabase.from('documents').insert({
      id: docId,
      section_id: sectionRow.id,
      client_id: clientId,
      name: pretty(base),
      original_ext: ext,
      storage_path_original: originalPath,
      storage_path_pdf: pdfPath,
      size_bytes: stat.size,
      doc_date: stat.mtime.toISOString().slice(0, 10),
      subfolder_label: file.subfolder,
    });
    if (docError) fail('No pude registrar el documento', fileName, docError);
    console.log(pdfPath && ext !== 'pdf' ? '✓ (convertido a PDF)' : '✓');
  }
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\nListo: «${clientName}» con ${ordered.length} secciones y ${totalFiles} documentos.\n`);

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
async function upsertClient(name) {
  const { data: clients, error } = await supabase.from('clients').select('id, name');
  if (error) fail('No pude leer los clientes', '', error);
  const key = name.toLowerCase();
  const existing = clients.find((c) => {
    const other = c.name.toLowerCase();
    return other === key || other.includes(key) || key.includes(other);
  });

  if (!existing) {
    const { data, error: insertError } = await supabase.from('clients').insert({ name }).select('id').single();
    if (insertError) fail('No pude crear el cliente', name, insertError);
    console.log('Cliente nuevo creado.\n');
    return data.id;
  }

  console.log(`Ya existe «${existing.name}»: se reemplaza su contenido.\n`);
  await removeFolder(existing.id);
  const { error: delError } = await supabase.from('sections').delete().eq('client_id', existing.id);
  if (delError) fail('No pude borrar las secciones anteriores', existing.name, delError);
  return existing.id;
}

/** Borra recursivamente todos los objetos bajo un prefijo del bucket. */
async function removeFolder(prefix) {
  const { data: items, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) fail('No pude listar archivos anteriores', prefix, error);
  const files = [];
  for (const item of items) {
    const path = `${prefix}/${item.name}`;
    if (item.id === null) await removeFolder(path); // es carpeta
    else files.push(path);
  }
  if (files.length) {
    const { error: rmError } = await supabase.storage.from(BUCKET).remove(files);
    if (rmError) fail('No pude borrar archivos anteriores', prefix, rmError);
  }
}

async function upload(path, bytes, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: true });
  if (error) fail('No pude subir', path, error);
}

function findLibreOffice() {
  const candidates = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    '/usr/bin/soffice',
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function convertToPdf(file) {
  try {
    execFileSync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', tmp, file], { stdio: 'ignore' });
    const out = join(tmp, `${splitExtension(basename(file)).base}.pdf`);
    const bytes = readFileSync(out);
    rmSync(out);
    return bytes;
  } catch {
    process.stdout.write('(no se pudo convertir) ');
    return null;
  }
}

/** Marca de agua diagonal en cada página. Si el PDF está protegido, se sube tal cual. */
async function stamp(bytes, client) {
  try {
    const pdf = await PDFDocument.load(bytes);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    let text = `Confidencial · ${client}`;
    try {
      font.encodeText(text);
    } catch {
      text = 'Confidencial';
    }
    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize();
      const size = Math.min(width, height) / 14;
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: width / 2 - (textWidth / 2) * Math.cos(Math.PI / 6),
        y: height / 2 - (textWidth / 2) * Math.sin(Math.PI / 6),
        size,
        font,
        color: rgb(0.45, 0.45, 0.45),
        opacity: 0.18,
        rotate: degrees(30),
      });
    }
    return await pdf.save();
  } catch {
    return bytes;
  }
}

function fail(message, detail, error) {
  console.error(`\n✗ ${message}${detail ? ` (${detail})` : ''}: ${error?.message ?? error}`);
  rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
}
