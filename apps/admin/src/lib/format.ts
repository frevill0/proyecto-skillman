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

/** Fecha de hoy en Ecuador, "AAAA-MM-DD" (la misma que usa el servidor para vencer el acceso). */
export function todayEcuador() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());
}

/** Suma meses a una fecha "AAAA-MM-DD" (fin de mes si el día no existe). */
export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const last = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  const date = new Date(Date.UTC(y, m - 1 + months, Math.min(d, last)));
  return date.toISOString().slice(0, 10);
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/** Estado del vencimiento para mostrarlo con color. */
export function accessStatus(accessUntil: string | null): { label: string; kind: '' | 'warn' | 'danger' | 'off' } {
  if (!accessUntil) return { label: 'Sin vencimiento', kind: 'off' };
  const days = daysBetween(todayEcuador(), accessUntil);
  if (days < 0) return { label: `Vencido el ${formatDate(accessUntil)}`, kind: 'danger' };
  if (days === 0) return { label: 'Vence hoy', kind: 'warn' };
  if (days <= 15) return { label: `Vence en ${plural(days, 'día', 'días')}`, kind: 'warn' };
  return { label: `Hasta el ${formatDate(accessUntil)}`, kind: '' };
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
