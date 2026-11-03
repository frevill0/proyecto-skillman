-- Marca de agua por usuario.
-- Los clientes ya no leen archivos del bucket directamente: la función abrir-documento comprueba
-- que el documento sea visible para ellos (RLS de documents), le estampa su correo y entrega
-- un enlace firmado a una copia temporal. Así nadie obtiene una copia sin su marca.

drop policy "archivos: leer si el documento es visible" on storage.objects;

create policy "archivos: solo admin lee" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos' and public.is_admin());
