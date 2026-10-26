# Portal PDP: app para que los clientes vean su carpeta de protección de datos

Contexto del proyecto, traspasado desde una conversación previa. Idioma de trabajo: español.

## Qué es
App para iPhone y Android donde cada cliente de un consultor de protección de datos personales (LOPDP, Ecuador) entra con su correo y ve únicamente la carpeta de documentación de su organización. El consultor (el papá de Freddy, quien le hereda el proyecto) administra todo desde un panel web.

- **Quién construye:** Freddy Villavicencio (perfil TI: soporte, redes, infraestructura, programación).
- **Quién compra:** el consultor, a quien Freddy se lo va a vender.
- **Nombre:** provisional, "Portal PDP". Falta definir nombre y logo.

## Repositorio
Monorepo con npm workspaces, en https://github.com/frevill0/proyecto-skillman (rama `main`).
- `apps/mobile/` app del cliente (Expo).
- `apps/admin/` panel web del administrador.
- `packages/` código compartido (tipos, cliente de Supabase).
- `supabase/` migraciones, RLS y funciones.
- `prototipo/portal-pdp.html` prototipo de referencia.

## Alcance del MVP (decidido)
- Clientes: **solo ver y descargar** (sin subir archivos).
- Menos de 20 clientes; **solo el consultor sube documentos**.
- Distribución **privada / no listada** (TestFlight en iPhone; prueba cerrada en Android).
- Presupuesto mínimo: capas gratuitas al inicio.

## Stack propuesto
- **App móvil:** Expo (React Native), un solo código para iOS y Android.
- **Backend:** Supabase (Auth, Postgres con Row Level Security, Storage).
- **Panel web del administrador:** página web sencilla (puede ser Next.js o Vite + React) con el mismo Supabase.
- **Conversión a PDF:** al subir, los Word, Excel y PowerPoint se convierten a PDF en el servidor (por ejemplo LibreOffice en una función o worker) para verlos bien en el celular.
- **Visor:** PDF e imágenes dentro de la app, con marca de agua del correo del usuario.

## Modelo de datos (borrador)
- `clients(id, name, created_at)`
- `profiles(id → auth.users, client_id, full_name, role: 'admin' | 'client_user', active)`
- `sections(id, client_id, number, name, visible, sort_order)`
- `documents(id, section_id, name, original_ext, storage_path_original, storage_path_pdf, size_bytes, doc_date, subfolder_label)`
- `access_log(id, user_id, document_id, action: 'open' | 'download', at)`

Permisos (RLS): un `client_user` solo lee filas de su `client_id`, solo secciones con `visible = true`. Solo `admin` escribe. Los archivos se sirven con **URLs firmadas de corta duración**.

## Importación de carpeta (regla que ya funciona en el prototipo)
Al subir una carpeta de cliente, tipo `PROYECTO ECUAFUTURO/`:
1. Nombre del cliente: carpeta raíz sin el prefijo "PROYECTO", pasado de mayúsculas a texto normal. Si ya existe un cliente con nombre parecido, se reemplaza su contenido.
2. Cada **subcarpeta de primer nivel** es una sección. Su prefijo numérico (`01`, `6`, `10`) da el número y el orden; el resto es el nombre.
3. Los archivos de la raíz van a la sección `00 Documentos generales`.
4. Subcarpetas más profundas se aplanan dentro de la sección y se guardan como etiqueta del documento (`subfolder_label`).
5. Se ignoran `~$*`, `.DS_Store`, `Thumbs.db`, `desktop.ini`.
6. Se conservan siglas en mayúsculas: PDP, PATD, PANSI, RAT, MTGE, LOPDP, SPDP, EIPD, ATD, RTD, DTD, EET, GRC, COAC, ARCO.

## Estructura de la carpeta de un cliente (21 secciones)
01 Glosario y categorías · 02 Áreas, contextos y ámbitos · 03 Mapeo de PATD y PANSI · 04 Comunicados y ejercicio de derechos · 05 Contratos y cláusulas · 06 RAT, finalidad, licitud y MTGE · 07 Madurez organizacional y estado de la técnica · 08 Evaluación de riesgos · 09 Política general PDP · 10 Plan PDP y declaración de aplicabilidad · 11 Rutinas PDP y estaciones autogestionadas · 12 Procedimientos documentados · 13 Programa de consciencia · 14 Programa de competencias · 15 Programa de auditorías · 16 Programa de simulacros · 17 Gestión de terceras partes · 18 Evaluaciones técnico-jurídicas · 19 Tablero de mando · 20 Obligaciones del art. 47 LOPDP · 21 Manual de usuario.

Algunas secciones (15, 16, 17) pueden estar vacías: la app debe mostrar "Sin documentos aún".

## Prototipo existente
`prototipo/portal-pdp.html` es una sola página HTML con tres vistas: Vista del cliente (celular simulado), Panel del administrador (secciones con interruptor de visibilidad, usuarios, actividad, importación de carpeta real desde el navegador) y Propuesta comercial. Usa datos de ejemplo y no guarda nada. Sirve como referencia de pantallas, textos y comportamiento; el diseño usa verde bosque, fuentes Sora, IBM Plex Sans y IBM Plex Mono, con modo claro y oscuro.

## Seguridad y cumplimiento (requisitos)
- Un cliente nunca ve datos de otro (aplicado en servidor con RLS, no solo en la pantalla).
- Marca de agua con el correo del usuario y enlaces firmados que caducan en minutos.
- Registro de aperturas y descargas.
- Los documentos contienen información sensible de clientes: **no subir documentos reales a Git ni a repositorios**. Usar datos de ejemplo en desarrollo. El `.gitignore` bloquea Office/PDF salvo en `ejemplos/`.
- Revisar con el consultor dónde se alojan los datos según la LOPDP (transferencias internacionales). Parte del material de la carpeta es interno de su metodología y no debe llegar a los clientes por defecto.

## Distribución y costos de referencia (verificar al comprar)
- Apple Developer: 99 USD/año. Google Play: 25 USD, único pago.
- iPhone: TestFlight (versiones de 90 días). Android: prueba cerrada por lista de correos; una cuenta personal nueva exige 12 testers durante 14 días antes de publicar.
- Supabase gratis para pruebas (1 GB de archivos, se pausa tras una semana sin uso); con clientes reales, plan Pro cercano a 25 USD/mes.

## Etapas (estimadas)
1. **Base (1 semana):** proyecto Supabase, tablas, RLS, usuarios y roles.
2. **Panel del administrador (1 semana):** login, crear clientes, importar carpeta, conversión a PDF, invitar y revocar usuarios, visibilidad por sección, registro de actividad.
3. **App del cliente (2 semanas):** login, lista de secciones con búsqueda, lista de documentos, visor PDF/imagen con marca de agua, descarga.
4. **Pruebas y publicación (1 semana):** piloto con un cliente real, TestFlight y prueba cerrada en Android.

Después: avisos de documentos nuevos, alertas de vencimientos, tablero de avance, subida de archivos por el cliente.

## Pendientes por decidir con el consultor
- Nombre y logo de la plataforma.
- Qué secciones ve cada tipo de cliente.
- Cliente piloto.
- Cuentas de las tiendas a nombre propio o de su empresa.
- Valor del desarrollo (no definido).

## Próximo paso inmediato
Versión móvil del prototipo para una demostración: pantalla completa en celular, barra inferior (Inicio, Buscar, Perfil), interruptor discreto para pasar a la vista de administrador, carpeta de ejemplo precargada y opción "Agregar a pantalla de inicio". Luego, etapa 1.
