// Genera una carpeta de cliente de ejemplo (sin datos reales) con la estructura de 21 secciones.
// Los documentos imitan el formato de los entregables reales (políticas, RAT, matrices, planes…)
// para una empresa ficticia, "Empresa Demo S.A.". Todo el contenido es inventado.
// Uso: npm run ejemplo
// Resultado: ejemplos/PROYECTO DEMO PDP/ (ignorada por Git)

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const ROOT = join(import.meta.dirname, '..', 'ejemplos', 'PROYECTO DEMO PDP');
const ORG = 'Empresa Demo S.A.';

const GREEN = rgb(0.055, 0.353, 0.31);
const GREEN_SOFT = rgb(0.863, 0.922, 0.906);
const INK = rgb(0.07, 0.125, 0.114);
const GREY = rgb(0.35, 0.42, 0.4);
const LINE = rgb(0.84, 0.87, 0.86);
const LEVEL = { Bajo: rgb(0.78, 0.9, 0.8), Medio: rgb(0.98, 0.9, 0.7), Alto: rgb(0.97, 0.78, 0.74) };

// ---------------------------------------------------------------------------
// Contenido
// ---------------------------------------------------------------------------
const P = (heading, ...paragraphs) => ({ heading, paragraphs });

const RAT_ROWS = [
  ['Gestión de nómina', 'Pago de remuneraciones y obligaciones laborales', 'Obligación legal', 'Identificación, financieros', '7 años'],
  ['Atención al cliente', 'Responder consultas y reclamos', 'Ejecución de contrato', 'Contacto, historial', '3 años'],
  ['Videovigilancia', 'Seguridad de instalaciones', 'Interés legítimo', 'Imagen', '30 días'],
  ['Selección de personal', 'Evaluar candidatos', 'Consentimiento', 'Hoja de vida, referencias', '1 año'],
  ['Marketing', 'Envío de promociones', 'Consentimiento', 'Contacto, preferencias', 'Hasta revocar'],
];

const DOCS = {
  'Glosario PDP': {
    kind: 'glossary',
    items: [
      ['Dato personal', 'Información que identifica o hace identificable a una persona natural.'],
      ['Titular', 'Persona natural cuyos datos son objeto de tratamiento.'],
      ['Responsable del tratamiento', 'Quien decide sobre la finalidad y los medios del tratamiento.'],
      ['Encargado del tratamiento', 'Quien trata datos por cuenta del responsable.'],
      ['DPD', 'Delegado de Protección de Datos designado por la organización.'],
      ['Derechos ARCO', 'Acceso, rectificación, cancelación y oposición, más portabilidad y otros derechos de la LOPDP.'],
      ['Datos sensibles', 'Salud, biometría, origen étnico, creencias y otros datos de especial protección.'],
      ['Transferencia internacional', 'Comunicación de datos a un tercero ubicado fuera del Ecuador.'],
      ['Brecha de seguridad', 'Incidente que compromete la confidencialidad, integridad o disponibilidad de datos.'],
    ],
  },
  'Catalogo de categorias de datos': {
    kind: 'table',
    columns: ['Categoría', 'Ejemplos', 'Sensibilidad'],
    widths: [150, 250, 115],
    rows: [
      ['Identificación', 'Nombres, cédula, firma', 'Media'],
      ['Contacto', 'Correo, teléfono, dirección', 'Baja'],
      ['Financieros', 'Cuentas bancarias, ingresos', 'Alta'],
      ['Laborales', 'Cargo, evaluaciones, nómina', 'Media'],
      ['Salud', 'Certificados médicos, discapacidad', 'Alta'],
      ['Imagen', 'Fotografías, videovigilancia', 'Media'],
    ],
  },
  'Politica general PDP': {
    kind: 'policy',
    sections: [
      P('1. Objeto', `${ORG} establece esta política para garantizar el tratamiento lícito, leal y transparente de los datos personales de clientes, colaboradores y proveedores, conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP).`),
      P('2. Alcance', 'Aplica a todos los procesos, áreas, sistemas y terceros que traten datos personales por cuenta de la organización, en cualquier soporte físico o digital.'),
      P('3. Principios', 'Juridicidad, lealtad, transparencia, finalidad, pertinencia y minimización, proporcionalidad, confidencialidad, calidad y exactitud, conservación limitada, seguridad y responsabilidad proactiva.'),
      P('4. Roles y responsabilidades', 'La Gerencia General aprueba esta política y asigna recursos. El DPD supervisa su cumplimiento. Cada jefe de área es responsable de los tratamientos de su proceso.'),
      P('5. Derechos de los titulares', 'Los titulares pueden ejercer sus derechos a través del formulario ARCO o del correo designado. La organización responde dentro de los plazos legales.'),
      P('6. Vigencia y revisión', 'Esta política rige desde su aprobación y se revisa al menos una vez al año o cuando cambie la normativa aplicable.'),
    ],
  },
  'Subpoliticas PDP': {
    kind: 'policy',
    sections: [
      P('Subpolítica de escritorio limpio', 'Los documentos con datos personales no deben quedar a la vista al terminar la jornada.'),
      P('Subpolítica de contraseñas', 'Las contraseñas son personales, de al menos 12 caracteres y se cambian ante cualquier sospecha de exposición.'),
      P('Subpolítica de uso de correo', 'No se envían bases de datos por correo personal ni mensajería no autorizada.'),
      P('Subpolítica de dispositivos', 'Los equipos portátiles deben tener cifrado de disco y bloqueo automático.'),
    ],
  },
  'RAT Cajero financiero': { kind: 'rat', rows: RAT_ROWS.slice(0, 3) },
  'RAT Asesor de credito': { kind: 'rat', rows: RAT_ROWS.slice(1) },
  'Matriz de derechos y libertades': {
    kind: 'risk',
    rows: [
      ['Acceso no autorizado a nómina', 'Media', 'Alto', 'Alto', 'Control de accesos por rol'],
      ['Pérdida de laptop con bases de clientes', 'Baja', 'Alto', 'Medio', 'Cifrado de disco'],
      ['Envío de datos a destinatario equivocado', 'Media', 'Medio', 'Medio', 'Doble verificación'],
      ['Retención excesiva de hojas de vida', 'Alta', 'Bajo', 'Medio', 'Depuración semestral'],
      ['Videovigilancia sin aviso', 'Baja', 'Medio', 'Bajo', 'Letreros informativos'],
      ['Proveedor sin contrato de encargo', 'Media', 'Alto', 'Alto', 'Firma de cláusulas'],
    ],
  },
  'Plan PDP 2026': {
    kind: 'plan',
    rows: [
      ['Aprobación de la política general', 'Ene', 'Cumplido'],
      ['Levantamiento del RAT', 'Feb–Mar', 'Cumplido'],
      ['Evaluación de riesgos', 'Abr', 'Cumplido'],
      ['Contratos con encargados', 'May–Jun', 'En curso'],
      ['Programa de consciencia', 'Jul', 'En curso'],
      ['Primer simulacro de brecha', 'Sep', 'Pendiente'],
      ['Auditoría interna', 'Nov', 'Pendiente'],
    ],
  },
  'Procedimiento ARCO': {
    kind: 'steps',
    intro: 'Define cómo se reciben y atienden las solicitudes de los titulares.',
    steps: [
      'Recibir la solicitud por el formulario o el correo designado.',
      'Verificar la identidad del titular dentro de 2 días hábiles.',
      'Registrar la solicitud en la bitácora de derechos.',
      'Trasladar al área responsable del tratamiento.',
      'Preparar la respuesta con apoyo del DPD.',
      'Responder al titular dentro del plazo legal.',
      'Archivar la evidencia de la respuesta.',
    ],
  },
  'Protocolo de crisis': {
    kind: 'steps',
    intro: 'Pasos ante una brecha de seguridad de datos personales.',
    steps: [
      'Contener el incidente y preservar evidencias.',
      'Notificar al DPD y a la Gerencia de inmediato.',
      'Evaluar el riesgo para los titulares.',
      'Notificar a la autoridad dentro del plazo legal.',
      'Comunicar a los titulares afectados cuando corresponda.',
      'Documentar lecciones aprendidas.',
    ],
  },
  'Formulario de derechos ARCO': {
    kind: 'form',
    fields: ['Nombres y apellidos', 'Número de cédula', 'Correo electrónico', 'Derecho que desea ejercer', 'Descripción de la solicitud', 'Fecha', 'Firma'],
  },
  'Tablero de nivel de seguridad': {
    kind: 'dashboard',
    kpis: [
      ['82 %', 'colaboradores capacitados'],
      ['14', 'tratamientos registrados'],
      ['3', 'riesgos altos abiertos'],
      ['0', 'brechas en el año'],
    ],
    bars: [
      ['Gobierno', 90],
      ['RAT', 85],
      ['Riesgos', 70],
      ['Contratos', 55],
      ['Consciencia', 80],
      ['Auditoría', 30],
    ],
  },
};

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

// ---------------------------------------------------------------------------
// Generación
// ---------------------------------------------------------------------------
async function main() {
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
  writeFileSync(join(nested, 'Anexo de formatos.pdf'), await samplePdf('Anexo de formatos', '12 PROCEDIMIENTOS DOCUMENTADOS'));
  writeFileSync(join(ROOT, 'Indice de la carpeta.pdf'), await samplePdf('Indice de la carpeta', 'DOCUMENTOS GENERALES'));
  count += 2;

  console.log(`Carpeta de ejemplo creada: ${ROOT}`);
  console.log(`${STRUCTURE.length} secciones, ${count} documentos PDF de prueba (sin datos reales).`);
}

async function samplePdf(title, folder) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const section = folder.replace(/^\d+\s*/, '');
  const spec = DOCS[title] ?? genericSpec(title, section);
  const doc = new Writer(pdf, font, bold, title, section);
  render(doc, spec);
  doc.finish();
  return pdf.save();
}

/** Documento genérico con estructura de entregable, para los que no tienen contenido propio. */
function genericSpec(title, section) {
  return {
    kind: 'policy',
    sections: [
      P('1. Propósito', `Este documento forma parte del modelo de protección de datos de ${ORG} y desarrolla el componente «${title}» de la sección ${section.toLowerCase()}.`),
      P('2. Alcance', 'Aplica a los procesos y áreas que tratan datos personales, así como a los encargados que actúan por cuenta de la organización.'),
      P('3. Desarrollo', 'Se describen las actividades, responsables, evidencias y frecuencia de revisión necesarias para demostrar cumplimiento ante la Superintendencia de Protección de Datos Personales.'),
      P('4. Evidencias', 'Actas de aprobación, registros de capacitación, matrices actualizadas y reportes del tablero de mando.'),
      P('5. Control de cambios', 'Versión 1.0 · Elaborado por: Consultoría PDP · Aprobado por: Gerencia General.'),
    ],
  };
}

function render(doc, spec) {
  switch (spec.kind) {
    case 'glossary':
      for (const [term, def] of spec.items) {
        doc.ensure(40);
        doc.text(term, { bold: true, color: GREEN, size: 12 });
        doc.paragraph(def);
        doc.space(6);
      }
      break;
    case 'policy':
      for (const s of spec.sections) {
        doc.ensure(60);
        doc.text(s.heading, { bold: true, color: GREEN, size: 13 });
        doc.space(4);
        for (const p of s.paragraphs) doc.paragraph(p);
        doc.space(10);
      }
      break;
    case 'table':
      doc.table(spec.columns, spec.widths, spec.rows);
      break;
    case 'rat':
      doc.paragraph('Registro de actividades de tratamiento: finalidad, base de licitud, categorías de datos y plazo de conservación.');
      doc.space(8);
      doc.table(['Actividad', 'Finalidad', 'Base de licitud', 'Datos', 'Plazo'], [95, 140, 95, 115, 70], spec.rows, { size: 8.5 });
      break;
    case 'risk':
      doc.paragraph('Evaluación del riesgo para los derechos y libertades de los titulares. Nivel = probabilidad × impacto.');
      doc.space(8);
      doc.table(['Riesgo', 'Probabilidad', 'Impacto', 'Nivel', 'Medida'], [165, 70, 60, 55, 165], spec.rows, {
        size: 8.5,
        cellColor: (row, col) => (col >= 1 && col <= 3 ? LEVEL[row[col]] : undefined),
      });
      break;
    case 'plan':
      doc.paragraph(`Cronograma de implementación del modelo PDP de ${ORG} para el año 2026.`);
      doc.space(8);
      doc.table(['Actividad', 'Mes', 'Estado'], [300, 100, 115], spec.rows, {
        cellColor: (row, col) =>
          col === 2 ? { Cumplido: LEVEL.Bajo, 'En curso': LEVEL.Medio, Pendiente: LINE }[row[2]] : undefined,
      });
      break;
    case 'steps':
      doc.paragraph(spec.intro);
      doc.space(8);
      spec.steps.forEach((step, i) => {
        doc.ensure(30);
        doc.badge(String(i + 1));
        doc.paragraph(step, { indent: 30 });
        doc.space(6);
      });
      break;
    case 'form':
      doc.paragraph('Complete los datos y entregue el formulario en recepción o envíelo al correo del DPD.');
      doc.space(14);
      for (const field of spec.fields) doc.field(field);
      break;
    case 'dashboard':
      doc.kpis(spec.kpis);
      doc.space(16);
      doc.text('Avance por componente', { bold: true, color: GREEN, size: 13 });
      doc.space(8);
      doc.bars(spec.bars);
      break;
  }
}

/** Escritura con salto de página, encabezado y pie. */
class Writer {
  constructor(pdf, font, bold, title, section) {
    Object.assign(this, { pdf, font, bold, title, section, pages: [] });
    this.newPage();
    this.text(section, { size: 10, color: GREY });
    this.space(6);
    for (const line of this.wrap(title, 20, this.bold, 515)) this.text(line, { bold: true, size: 20, color: INK, lead: 24 });
    this.text(`${ORG} · Versión 1.0 · 2026`, { size: 10, color: GREY });
    this.page.drawLine({ start: { x: 40, y: this.y - 8 }, end: { x: 555, y: this.y - 8 }, color: LINE, thickness: 1 });
    this.space(24);
  }

  newPage() {
    this.page = this.pdf.addPage([595, 842]);
    this.pages.push(this.page);
    this.page.drawRectangle({ x: 0, y: 802, width: 595, height: 40, color: GREEN });
    this.page.drawText('DEMO PDP  ·  DOCUMENTO DE EJEMPLO', { x: 40, y: 817, size: 10, font: this.bold, color: rgb(1, 1, 1) });
    this.y = 770;
  }

  ensure(h) {
    if (this.y - h < 70) this.newPage();
  }

  space(h) {
    this.y -= h;
  }

  wrap(text, size, font = this.font, width = 515) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }

  text(t, { bold = false, size = 11, color = INK, lead, x = 40 } = {}) {
    this.ensure(size + 6);
    this.page.drawText(t, { x, y: this.y - size, size, font: bold ? this.bold : this.font, color });
    this.y -= lead ?? size + 6;
  }

  paragraph(t, { indent = 0, size = 11 } = {}) {
    for (const line of this.wrap(t, size, this.font, 515 - indent)) this.text(line, { size, x: 40 + indent, lead: 16 });
  }

  badge(label) {
    this.page.drawCircle({ x: 51, y: this.y - 6, size: 10, color: GREEN_SOFT });
    this.page.drawText(label, { x: 48, y: this.y - 10, size: 10, font: this.bold, color: GREEN });
  }

  table(columns, widths, rows, { size = 9.5, cellColor } = {}) {
    const pad = 5;
    const drawRow = (cells, header, row) => {
      const wrapped = cells.map((c, i) => this.wrap(String(c), size, header ? this.bold : this.font, widths[i] - pad * 2));
      const h = Math.max(...wrapped.map((l) => l.length)) * (size + 3) + pad * 2;
      if (this.y - h < 70) {
        this.newPage();
        if (!header) drawRow(columns, true);
      }
      let x = 40;
      wrapped.forEach((lines, i) => {
        const fill = header ? GREEN : cellColor?.(row, i);
        if (fill) this.page.drawRectangle({ x, y: this.y - h, width: widths[i], height: h, color: fill });
        this.page.drawRectangle({ x, y: this.y - h, width: widths[i], height: h, borderColor: LINE, borderWidth: 0.6 });
        lines.forEach((l, j) =>
          this.page.drawText(l, {
            x: x + pad,
            y: this.y - pad - size - j * (size + 3),
            size,
            font: header ? this.bold : this.font,
            color: header ? rgb(1, 1, 1) : INK,
          }),
        );
        x += widths[i];
      });
      this.y -= h;
    };
    drawRow(columns, true);
    for (const r of rows) drawRow(r, false, r);
    this.space(12);
  }

  field(label) {
    this.ensure(44);
    this.text(label, { size: 9, color: GREY });
    this.page.drawRectangle({ x: 40, y: this.y - 22, width: 515, height: 24, borderColor: LINE, borderWidth: 0.8 });
    this.space(36);
  }

  kpis(items) {
    const w = 120;
    items.forEach(([value, label], i) => {
      const x = 40 + i * (w + 11.6);
      this.page.drawRectangle({ x, y: this.y - 70, width: w, height: 70, color: GREEN_SOFT });
      this.page.drawText(value, { x: x + 10, y: this.y - 34, size: 22, font: this.bold, color: GREEN });
      this.wrap(label, 8.5, this.font, w - 20).forEach((l, j) =>
        this.page.drawText(l, { x: x + 10, y: this.y - 50 - j * 10, size: 8.5, font: this.font, color: GREY }),
      );
    });
    this.y -= 70;
  }

  bars(items) {
    for (const [label, pct] of items) {
      this.ensure(24);
      this.page.drawText(label, { x: 40, y: this.y - 12, size: 10, font: this.font, color: INK });
      this.page.drawRectangle({ x: 140, y: this.y - 14, width: 360, height: 12, color: LINE });
      this.page.drawRectangle({ x: 140, y: this.y - 14, width: 3.6 * pct, height: 12, color: GREEN });
      this.page.drawText(`${pct} %`, { x: 508, y: this.y - 12, size: 10, font: this.bold, color: GREEN });
      this.space(22);
    }
  }

  finish() {
    this.pages.forEach((page, i) => {
      page.drawText(`${ORG} · Documento de ejemplo sin datos reales`, { x: 40, y: 40, size: 8, font: this.font, color: GREY });
      page.drawText(`Página ${i + 1} de ${this.pages.length}`, { x: 500, y: 40, size: 8, font: this.font, color: GREY });
    });
  }
}

await main();