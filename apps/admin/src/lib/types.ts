export type Role = 'admin' | 'client_user';
type Count = { count: number }[];

export interface Client {
  id: string;
  name: string;
  created_at: string;
  /** Último día con acceso (incluido). Null = sin vencimiento. */
  access_until: string | null;
  /** Oculto de las listas del panel (no cambia el acceso de sus usuarios). */
  archived: boolean;
}

export interface ClientSummary extends Client {
  sections: Count;
  documents: Count;
  profiles: Count;
}

export interface Section {
  id: string;
  client_id: string;
  number: number;
  name: string;
  visible: boolean;
  sort_order: number;
}

export interface DocumentRow {
  id: string;
  section_id: string;
  client_id: string;
  name: string;
  original_ext: string;
  storage_path_original: string;
  storage_path_pdf: string | null;
  size_bytes: number;
  doc_date: string | null;
  subfolder_label: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  client_id: string | null;
  full_name: string | null;
  email: string | null;
  role: Role;
  active: boolean;
  created_at: string;
  clients: { name: string; archived: boolean } | null;
}

export interface ActivityEntry {
  id: number;
  action: 'open' | 'download';
  at: string;
  profiles: { full_name: string | null; email: string | null } | null;
  documents: { name: string; clients: { name: string; archived: boolean } | null } | null;
}
