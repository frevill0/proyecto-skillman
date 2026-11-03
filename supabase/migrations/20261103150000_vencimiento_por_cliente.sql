-- Vencimiento de la suscripción por cliente.
-- clients.access_until: último día con acceso (incluido), en hora de Ecuador. Null = sin vencimiento.
-- Al vencer, my_client_id() deja de devolver el cliente y RLS oculta todo a sus usuarios.

alter table public.clients add column access_until date;

create or replace function public.my_client_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.client_id
  from public.profiles p
  join public.clients c on c.id = p.client_id
  where p.id = (select auth.uid())
    and p.role = 'client_user'
    and p.active
    and (c.access_until is null or c.access_until >= (now() at time zone 'America/Guayaquil')::date);
$$;

-- Estado del acceso del usuario actual, para que la app explique por qué no ve nada.
-- Devuelve solo datos del propio usuario: el nombre de su cliente y su fecha de vencimiento.
create function public.my_access()
returns table (client_name text, access_until date, expired boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.name,
    c.access_until,
    c.access_until is not null and c.access_until < (now() at time zone 'America/Guayaquil')::date
  from public.profiles p
  join public.clients c on c.id = p.client_id
  where p.id = (select auth.uid());
$$;

revoke execute on function public.my_access() from anon;
