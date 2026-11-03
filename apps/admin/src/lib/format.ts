import { OFFICE_EXTENSIONS } from '@portal-pdp/core';

import type { DocumentRow } from './types';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatDate(iso: string | null) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${time}`;
}

export function formatSize(bytes: number) {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export const sectionNumber = (n: number) => String(n).padStart(2, '0');

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Un Office que todavía no tiene su PDF (la conversión falló o el servicio no estaba listo). */
export const needsPdf = (d: Pick<DocumentRow, 'original_ext' | 'storage_path_pdf'>) =>
  !d.storage_path_pdf && OFFICE_EXTENSIONS.includes(d.original_ext);

export const initials = (text: string) =>
  text
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
