import { existsSync } from 'node:fs';

export function findLibreOffice() {
  const candidates = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    '/usr/bin/soffice',
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}
