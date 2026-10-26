const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2026-07-08" → "8 jul 2026" */
export function formatDate(iso: string | null) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** 1536 → "2 KB", 3400000 → "3,2 MB" */
export function formatSize(bytes: number) {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "2026-10-26T14:05:00Z" → "26 oct, 09:05" en hora local */
export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}

export function sectionNumber(n: number) {
  return String(n).padStart(2, '0');
}

export function documentCount(n: number) {
  if (!n) return 'Sin documentos aún';
  return n === 1 ? '1 documento' : `${n} documentos`;
}

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const OFFICE_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

const TYPE_LABEL: Record<string, string> = {
  pdf: 'PDF',
  doc: 'DOC',
  docx: 'DOC',
  xls: 'XLS',
  xlsx: 'XLS',
  ppt: 'PPT',
  pptx: 'PPT',
  csv: 'CSV',
  txt: 'TXT',
};

export function typeLabel(ext: string) {
  if (IMAGE_EXTENSIONS.includes(ext)) return 'IMG';
  return TYPE_LABEL[ext] ?? (ext.slice(0, 3).toUpperCase() || 'ARC');
}
