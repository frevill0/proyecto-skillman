-- Archivar clientes: los oculta de las listas del panel y de la vista de administrador en la app
-- (clientes, usuarios y actividad). No borra nada ni cambia el acceso de sus usuarios;
-- para cortar el acceso está el vencimiento (access_until) o revocar usuarios.

alter table public.clients add column archived boolean not null default false;
