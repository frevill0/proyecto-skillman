export type Role = 'admin' | 'client_user';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  client_id: string | null;
  active: boolean;
};

export type Client = {
  id: string;
  name: string;
};

export type Section = {
  id: string;
  client_id: string;
  number: number;
  name: string;
  visible: boolean;
  sort_order: number;
  documents: { count: number }[];
};

export type DocumentRow = {
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
};

export type ActivityEntry = {
  id: number;
  action: 'open' | 'download';
  at: string;
  profiles: { full_name: string | null; email: string | null } | null;
  documents: { name: string } | null;
};
