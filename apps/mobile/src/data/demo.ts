/**
 * Datos de ejemplo para la demostración (mismos que el prototipo HTML).
 * No contienen información real de clientes.
 */

export type DocType = 'pdf' | 'xlsx' | 'docx' | 'pptx' | 'jpg';

export type DemoDocument = {
  name: string;
  type: DocType;
  size: string;
  date: string;
  isNew?: boolean;
};

export type Section = {
  id: string;
  name: string;
  visible: boolean;
  documents: DemoDocument[];
};

export type DemoUser = {
  name: string;
  firstName: string;
  email: string;
  role: string;
};

export type LogEntry = {
  at: string;
  text: string;
};

export const ORGANIZATION = 'COAC Ecuafuturo';

export const DEMO_USER: DemoUser = {
  name: 'María Pérez',
  firstName: 'María',
  email: 'm.perez@cliente-ejemplo.ec',
  role: 'Oficial de datos',
};

export const DEMO_PASSWORD = 'ejemplo123';

export const TYPE_LABEL: Record<DocType, string> = {
  pdf: 'PDF',
  xlsx: 'XLS',
  docx: 'DOC',
  pptx: 'PPT',
  jpg: 'IMG',
};

export const OFFICE_TYPES: DocType[] = ['docx', 'xlsx', 'pptx'];

function doc(name: string, type: DocType, size: string, date = '8 jul 2026'): DemoDocument {
  return { name, type, size, date };
}

function section(id: string, name: string, documents: DemoDocument[] = []): Section {
  return { id, name, visible: true, documents };
}

export function buildSections(): Section[] {
  return [
    section('01', 'Glosario y categorías', [
      doc('Glosario PDP 2021', 'pdf', '0,3 MB', '12 jul 2026'),
      doc('Catálogo de categorías de datos', 'jpg', '0,3 MB', '12 jul 2026'),
      doc('Catálogo de titulares', 'jpg', '0,2 MB', '12 jul 2026'),
      doc('Catálogo de encargados', 'jpg', '0,3 MB', '12 jul 2026'),
      doc('Ley Orgánica de Protección de Datos Personales', 'pdf', '7,7 MB', '12 jul 2026'),
    ]),
    section('02', 'Áreas, contextos y ámbitos', [
      doc('Contextos, ámbitos y áreas', 'pdf', '3,3 MB'),
      doc('Ecosistema PDP: autoridad, RTD y DTD', 'pdf', '0,4 MB'),
      doc('Visión y GRC', 'pdf', '1,9 MB'),
    ]),
    section('03', 'Mapeo de PATD y PANSI', [
      doc('PATD + RAT-MTGE', 'xlsx', '0,3 MB'),
      doc('Mapeo EET + PANSI', 'xlsx', '2,7 MB'),
    ]),
    section('04', 'Comunicados y ejercicio de derechos', [
      doc('Anuncio de inicio a encargados de tratamiento', 'docx', '20 KB'),
      doc('Anuncio de inicio a socios', 'docx', '23 KB'),
    ]),
    section('05', 'Contratos y cláusulas', [
      doc('Anexo de tratamiento de datos personales', 'docx', '31 KB'),
      doc('Anexo PDP y confidencialidad de empleados', 'docx', '23 KB'),
      doc('Contrato de encargo', 'docx', '21 KB'),
      doc('Cláusulas entre responsable y titular', 'docx', '28 KB'),
    ]),
    section('06', 'RAT, finalidad, licitud y MTGE', [
      doc('RAT Cajero financiero', 'xlsx', '67 KB', '30 jun 2026'),
      doc('RAT Asesor de crédito', 'xlsx', '70 KB', '30 jun 2026'),
      doc('PATD + RAT-MTGE con listas organizadas', 'xlsx', '0,3 MB', '30 jun 2026'),
    ]),
    section('07', 'Madurez organizacional y estado de la técnica', [
      doc('Inventario de activos', 'xlsx', '0,3 MB', '30 jun 2026'),
      doc('Evaluación EET + PANSI', 'xlsx', '2,7 MB', '30 jun 2026'),
    ]),
    section('08', 'Evaluación de riesgos', [
      doc('Matriz de derechos y libertades: reembolso médico', 'xlsx', '0,4 MB', '23 jun 2026'),
      doc('Criterios de ponderación de impacto', 'jpg', '1,0 MB', '23 jun 2026'),
      doc('Comparativo enfoque europeo vs. LOPDP', 'jpg', '0,3 MB', '23 jun 2026'),
    ]),
    section('09', 'Política general PDP', [doc('Subpolíticas PDP', 'docx', '0,2 MB')]),
    section('10', 'Plan PDP y declaración de aplicabilidad', [
      doc('EIPD Salud ocupacional', 'xlsx', '0,3 MB', '19 jun 2026'),
      doc('EIPD Cámaras de videovigilancia', 'xlsx', '0,3 MB', '3 jun 2026'),
    ]),
    section('11', 'Rutinas PDP y estaciones autogestionadas', [
      doc('Rutinas PDP y gestión de métricas', 'jpg', '0,2 MB'),
    ]),
    section('12', 'Procedimientos documentados', [
      doc('Procedimiento ARCO', 'docx', '32 KB', '27 oct 2025'),
      doc('Protocolo de crisis y resiliencia', 'docx', '31 KB', '27 oct 2025'),
      doc('Revocatoria del consentimiento', 'docx', '25 KB', '27 oct 2025'),
      doc('Trámites administrativos', 'docx', '31 KB', '27 oct 2025'),
      doc('Documento 14: procedimientos documentados', 'docx', '69 KB', '8 nov 2023'),
    ]),
    section('13', 'Programa de consciencia', [
      doc('Programa de profesionalización del PANSI', 'pdf', '144 KB', '3 feb 2026'),
      doc('Examen 1', 'pdf', '129 KB', '6 feb 2026'),
      doc('La tríada PDP ecuatoriana', 'pptx', '6,3 MB', '13 feb 2026'),
    ]),
    section('14', 'Programa de competencias', [
      doc('Programa de profesionalización del PANSI', 'pdf', '144 KB', '3 feb 2026'),
      doc('Examen 2', 'docx', '48 KB', '12 feb 2026'),
      doc('Curso base LOPDP, módulo 1', 'pdf', '5,5 MB', '13 feb 2026'),
    ]),
    section('15', 'Programa de auditorías'),
    section('16', 'Programa de simulacros'),
    section('17', 'Gestión de terceras partes'),
    section('18', 'Evaluaciones técnico-jurídicas', [
      doc('EIPD Salud ocupacional: informe', 'docx', '5,9 MB', '19 may 2026'),
      doc('EIPD Cámaras: informe', 'docx', '4,0 MB', '19 may 2026'),
    ]),
    section('19', 'Tablero de mando', [doc('Hoshin: nivel de seguridad', 'xlsx', '56 KB', '14 dic 2025')]),
    section('20', 'Obligaciones del art. 47 LOPDP', [
      doc('La ruta 47 en PDP', 'pdf', '1,9 MB', '27 abr 2026'),
      doc('Documentación útil ante el auditor', 'xlsx', '15 KB', '13 jun 2025'),
    ]),
    section('21', 'Manual de usuario', [
      doc('Modelo de gestión PDP: manual de usuario', 'docx', '1,0 MB'),
    ]),
  ];
}

export const INITIAL_LOG: LogEntry[] = [
  { at: '09:12', text: 'María Pérez abrió «Procedimiento ARCO»' },
  { at: '09:10', text: 'María Pérez inició sesión' },
  { at: 'Ayer', text: 'Documentos del cliente actualizados por el administrador' },
];
