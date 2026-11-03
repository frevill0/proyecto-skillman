// Reglas de importación de carpetas (las mismas del prototipo; ver CLAUDE.md).

export const ACRONYMS = [
  'PDP', 'PATD', 'PANSI', 'RAT', 'MTGE', 'LOPDP', 'SPDP', 'EIPD', 'ATD', 'RTD', 'DTD', 'EET', 'GRC',
  'COAC', 'ARCO', 'GDPR', 'CCPA', 'RGPD', 'LOPD', 'RLOPDP', 'DPD', 'SEPS', 'SG', 'TI', 'TIC',
];

const IGNORED = /^(~\$|\.ds_store$|thumbs\.db$|desktop\.ini$)/i;

export function isIgnored(fileName) {
  return IGNORED.test(fileName);
}

/**
 * Pasa TEXTO EN MAYÚSCULAS a texto normal conservando siglas.
 * Si el texto ya está escrito en minúsculas (menos del 70 % de letras en mayúscula), lo deja igual.
 */
export function pretty(text) {
  const letters = text.match(/\p{L}/gu) ?? [];
  const upper = letters.filter((ch) => ch !== ch.toLowerCase()).length;
  if (!letters.length || upper / letters.length < 0.7) return text;
  const lower = text.toLowerCase();
  const sentence = lower.charAt(0).toUpperCase() + lower.slice(1);
  return sentence.replace(/[^\s\-–()/,.:]+/g, (w) =>
    ACRONYMS.includes(w.toUpperCase()) ? w.toUpperCase() : w,
  );
}

/** Nombre del cliente a partir de la carpeta raíz: quita el prefijo "PROYECTO". */
export function clientNameFromFolder(folderName) {
  return pretty(folderName.replace(/^proyecto\s+/i, '').trim());
}

/** "06 RAT, FINALIDAD" → { number: 6, name: "RAT, finalidad" } */
export function parseSectionFolder(folderName) {
  const m = folderName.match(/^(\d+)[\s.\-_]+(.*)$/);
  if (!m) return { number: null, name: pretty(folderName) };
  return { number: parseInt(m[1], 10), name: pretty(m[2]) };
}

export function splitExtension(fileName) {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return { base: fileName, ext: '' };
  return { base: fileName.slice(0, dot), ext: fileName.slice(dot + 1).toLowerCase() };
}

export const OFFICE_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

export const CONTENT_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  txt: 'text/plain',
  csv: 'text/csv',
};
