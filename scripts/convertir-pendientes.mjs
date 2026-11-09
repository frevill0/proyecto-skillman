// Convierte a PDF, con el LibreOffice de este equipo, los Office de un cliente que quedaron sin PDF.
// Uso: npm run convertir -- --cliente "Nombre exacto" [--simular]
//
// - Solo agrega el PDF con marca de agua "Confidencial · <cliente>". No toca el original ni los permisos.
// - Cada archivo se copia a una carpeta temporal propia, que se borra al terminar con él.
// - Si un archivo falla, queda como estaba y se puede reintentar.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { OFFICE_EXTENSIONS, stamp } from '@portal-pdp/core';

import { findLibreOffice } from './lib/libreoffice.mjs';
import { adminClient, BUCKET } from './lib/supabase-admin.mjs';

const args = process.argv.slice(2);
const flag = args.indexOf('--cliente');
const clientName = flag >= 0 ? args[flag + 1] : undefined;
const dryRun = args.includes('--simular');
if (!clientName) {
  console.error('Uso: npm run convertir -- --cliente "Nombre exacto" [--simular]');
  process.exit(1);
}

const soffice = findLibreOffice();
if (!soffice) {
  console.error('LibreOffice no está instalado en este equipo.');
  process.exit(1);
}

const supabase = adminClient();

// Nombre exacto, para no convertir por error los documentos de otro cliente.
const { data: client, error: clientError } = await supabase
  .from('clients')
  .select('id, name')
  .ilike('name', clientName.replace(/[%_\\]/g, (c) => `\\${c}`))
  .maybeSingle();
if (clientError || !client) {
  console.error(`No existe un cliente llamado «${clientName}».`);
  process.exit(1);
}

const { data: pending, error } = await supabase
  .from('documents')
  .select('id, client_id, name, original_ext, storage_path_original')
  .eq('client_id', client.id)
  .is('storage_path_pdf', null)
  .in('original_ext', OFFICE_EXTENSIONS)
  .order('name');
if (error) {
  console.error(`No pude leer los documentos: ${error.message}`);
  process.exit(1);
}

console.log(`\n${client.name}: ${pending.length} documentos de Office sin PDF.`);
if (dryRun) {
  for (const d of pending) console.log(`   · [${d.original_ext}] ${d.name}`);
  console.log('\nSimulación: no se convirtió nada.\n');
  process.exit(0);
}

let converted = 0;
const failures = [];
for (const [index, doc] of pending.entries()) {
  process.stdout.write(`[${index + 1}/${pending.length}] ${doc.name} `);
  try {
    await convert(doc);
    converted++;
    console.log('✓');
  } catch (e) {
    failures.push(doc.name);
    console.log(`✗ ${e.message}`);
  }
}

console.log(`\nListo: ${converted} convertidos, ${failures.length} con error.`);
for (const name of failures) console.log(`   ✗ ${name}`);
process.exit(failures.length ? 1 : 0);

async function convert(doc) {
  const dir = mkdtempSync(join(tmpdir(), 'portal-pdp-'));
  try {
    const { data, error: downloadError } = await supabase.storage.from(BUCKET).download(doc.storage_path_original);
    if (downloadError) throw new Error(`no pude descargar el original: ${downloadError.message}`);

    // Nombre fijo: el nombre real del documento nunca llega a la línea de comandos.
    const input = join(dir, `original.${doc.original_ext}`);
    writeFileSync(input, Buffer.from(await data.arrayBuffer()));
    // Perfil de LibreOffice propio y desechable, sin configuración ni macros de este equipo.
    execFileSync(
      soffice,
      [`-env:UserInstallation=${pathToFileURL(join(dir, 'perfil')).href}`, '--headless', '--convert-to', 'pdf', '--outdir', dir, input],
      { stdio: 'ignore', timeout: 180_000 },
    );

    const pdf = readFileSync(join(dir, 'original.pdf'));
    if (pdf.subarray(0, 4).toString() !== '%PDF') throw new Error('el resultado no es un PDF válido');

    const path = `${doc.client_id}/${doc.id}/documento.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, await stamp(pdf, client.name), { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`no pude subir el PDF: ${uploadError.message}`);

    const { error: updateError } = await supabase.from('documents').update({ storage_path_pdf: path }).eq('id', doc.id);
    if (updateError) throw new Error(`no pude registrar el PDF: ${updateError.message}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
