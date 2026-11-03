-- Documentos nuevos: la app marca lo que el usuario todavía no abrió.
-- Para eso cada usuario necesita leer sus propias filas del registro (antes solo el admin lo leía).

create policy "registro: cada usuario lee lo suyo" on public.access_log
  for select to authenticated
  using (user_id = (select auth.uid()));
