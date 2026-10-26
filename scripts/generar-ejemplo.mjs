// Genera una carpeta de cliente de ejemplo (sin datos reales) con la estructura de 21 secciones.
// Uso: npm run ejemplo
// Resultado: ejemplos/PROYECTO DEMO PDP/ (ignorada por Git)

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const ROOT = join(import.meta.dirname, '..', 'ejemplos', 'PROYECTO DEMO PDP');

const STRUCTURE = [
  ['01 GLOSARIO Y CATEGORIAS', ['Glosario PDP', 'Catalogo de categorias de datos']],
  ['02 AREAS, CONTEXTOS Y AMBITOS', ['Contextos, ambitos y areas', 'Ecosistema PDP autoridad, RTD y DTD']],
  ['03 MAPEO DE PATD Y PANSI', ['Mapeo PATD', 'Mapeo EET y PANSI']],
  ['04 COMUNICADOS Y EJERCICIO DE DERECHOS', ['Anuncio de inicio a encargados', 'Formulario de derechos ARCO']],
  ['05 CONTRATOS Y CLAUSULAS', ['Contrato de encargo', 'Clausulas entre responsable y titular']],
  ['06 RAT, FINALIDAD, LICITUD Y MTGE', ['RAT Cajero financiero', 'RAT Asesor de credito']],
  ['07 MADUREZ ORGANIZACIONAL Y ESTADO DE LA TECNICA', ['Inventario de activos']],
  ['08 EVALUACION DE RIESGOS', ['Matriz de derechos y libertades']],
  ['09 POLITICA GENERAL PDP', ['Politica general PDP', 'Subpoliticas PDP']],
  ['10 PLAN PDP Y DECLARACION DE APLICABILIDAD', ['Plan PDP 2026']],
  ['11 RUTINAS PDP Y ESTACIONES AUTOGESTIONADAS', ['Rutinas PDP y metricas']],
  ['12 PROCEDIMIENTOS DOCUMENTADOS', ['Procedimiento ARCO', 'Protocolo de crisis', 'Revocatoria del consentimiento']],
  ['13 PROGRAMA DE CONSCIENCIA', ['Programa de consciencia', 'Examen 1']],
  ['14 PROGRAMA DE COMPETENCIAS', ['Curso base LOPDP modulo 1']],
  ['15 PROGRAMA DE AUDITORIAS', []],
  ['16 PROGRAMA DE SIMULACROS', []],
  ['17 GESTION DE TERCERAS PARTES', []],
  ['18 EVALUACIONES TECNICO-JURIDICAS', ['EIPD Salud ocupacional informe']],
  ['19 TABLERO DE MANDO', ['Tablero de nivel de seguridad']],
  ['20 OBLIGACIONES DEL ART. 47 LOPDP', ['La ruta 47 en PDP']],
  ['21 MANUAL DE USUARIO', ['Manual de usuario del modelo PDP']],
];

rmSync(ROOT, { recursive: true, force: true });
mkdirSync(ROOT, { recursive: true });

let count = 0;
for (const [folder, docs] of STRUCTURE) {
  const dir = join(ROOT, folder);
  mkdirSync(dir, { recursive: true });
  for (const title of docs) {
    writeFileSync(join(dir, `${title.toUpperCase()}.pdf`), await samplePdf(title, folder));
    count++;
  }
}
// Una subcarpeta interna (se aplana como etiqueta) y un archivo en la raíz.
const nested = join(ROOT, '12 PROCEDIMIENTOS DOCUMENTADOS', 'ANEXOS 2026');
mkdirSync(nested, { recursive: true });
writeFileSync(join(nested, 'Anexo de formatos.pdf'), await samplePdf('Anexo de formatos', '12 Procedimientos documentados'));
writeFileSync(join(ROOT, 'Indice de la carpeta.pdf'), await samplePdf('Indice de la carpeta', 'Documentos generales'));
count += 2;

console.log(`Carpeta de ejemplo creada: ${ROOT}`);
console.log(`${STRUCTURE.length} secciones, ${count} documentos PDF de prueba (sin datos reales).`);

async function samplePdf(title, section) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const green = rgb(0.055, 0.353, 0.31);
  const grey = rgb(0.35, 0.42, 0.4);

  for (let n = 1; n <= 2; n++) {
    const page = pdf.addPage([595, 842]);
    page.drawRectangle({ x: 0, y: 792, width: 595, height: 50, color: green });
    page.drawText('DEMO PDP  ·  DOCUMENTO DE EJEMPLO', { x: 40, y: 810, size: 12, font: bold, color: rgb(1, 1, 1) });
    page.drawText(section, { x: 40, y: 740, size: 11, font, color: grey });
    page.drawText(title, { x: 40, y: 712, size: 20, font: bold, color: green });
    const lines = [
      'Este archivo es un documento de prueba generado automaticamente.',
      'No contiene datos personales ni informacion real de ningun cliente.',
      'Sirve para demostrar como se ve la documentacion PDP dentro de la app.',
    ];
    lines.forEach((line, i) => page.drawText(line, { x: 40, y: 670 - i * 20, size: 12, font }));
    for (let i = 0; i < 18; i++) {
      const w = 300 + ((title.length * (i + 3) * 37) % 215);
      page.drawRectangle({ x: 40, y: 580 - i * 26, width: w, height: 8, color: rgb(0.84, 0.87, 0.86) });
    }
    page.drawText(`Pagina ${n} de 2`, { x: 40, y: 40, size: 10, font, color: grey });
  }
  return pdf.save();
}
