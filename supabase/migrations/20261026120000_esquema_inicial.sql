-- Portal PDP · esquema inicial (etapa 1)
-- Clientes, perfiles con rol, secciones, documentos, registro de accesos y bucket privado.
-- Regla central: un client_user solo lee su propio cliente y solo secciones visibles. Solo admin escribe.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'client_user');
create type public.access_action as enum ('open', 'download');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create unique index clients_name_key on public.clients (lower(name));

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  full_name text,
  email text,
  role public.user_role not null default 'client_user',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint client_user_needs_client check (role = 'admin' or client_id is not null)
);
create index profiles_client_id_idx on public.profiles (client_id);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  number int not null,
  name text not null,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index sections_client_id_idx on public.sections (client_id, sort_order);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  -- Copia de sections.client_id para filtrar y autorizar sin joins.
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  original_ext text not null,
  storage_path_original text not null,
  storage_path_pdf text,
  size_bytes bigint not null default 0,
  doc_date date,
  subfolder_label text,
  created_at timestamptz not null default now()
);
create index documents_section_id_idx on public.documents (section_id);
create index documents_client_id_idx on public.documents (client_id);

create table public.access_log (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  document_id uuid references public.documents (id) on delete set null,
  action public.access_action not null,
  at timestamptz not null default now()
);
create index access_log_at_idx on public.access_log (at desc);

-- ---------------------------------------------------------------------------
-- Funciones de permisos (security definer para no recursar en RLS de profiles)
-- ---------------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and active
  );
$$;

create function public.my_client_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select client_id from public.profiles
  where id = (select auth.uid()) and role = 'client_user' and active;
$$;

revoke execute on function public.is_admin() from anon;
revoke execute on function public.my_client_id() from anon;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.sections enable row level security;
alter table public.documents enable row level security;
alter table public.access_log enable row level security;

-- clients
create policy "clientes: leer el propio o admin" on public.clients
  for select to authenticated
  using (public.is_admin() or id = public.my_client_id());
create policy "clientes: admin escribe" on public.clients
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profiles
create policy "perfiles: leer el propio o admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "perfiles: admin escribe" on public.profiles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- sections
create policy "secciones: cliente ve las visibles de su organización" on public.sections
  for select to authenticated
  using (public.is_admin() or (client_id = public.my_client_id() and visible));
create policy "secciones: admin escribe" on public.sections
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- documents
create policy "documentos: cliente ve los de secciones visibles" on public.documents
  for select to authenticated
  using (
    public.is_admin()
    or (
      client_id = public.my_client_id()
      and exists (
        select 1 from public.sections s
        where s.id = section_id and s.visible
      )
    )
  );
create policy "documentos: admin escribe" on public.documents
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- access_log: cada usuario registra sus propias acciones sobre documentos que puede ver
create policy "registro: insertar acciones propias" on public.access_log
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.documents d where d.id = document_id)
  );
create policy "registro: solo admin lee" on public.access_log
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: bucket privado. Ruta: <client_id>/<document_id>/<archivo>
-- Leer un objeto exige poder ver el documento que lo referencia (RLS de documents aplica).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

create policy "archivos: leer si el documento es visible" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.documents d
        where d.storage_path_pdf = storage.objects.name
           or d.storage_path_original = storage.objects.name
      )
    )
  );
create policy "archivos: admin escribe" on storage.objects
  for all to authenticated
  using (bucket_id = 'documentos' and public.is_admin())
  with check (bucket_id = 'documentos' and public.is_admin());
