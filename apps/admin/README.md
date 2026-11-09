# Panel del administrador (web)

Vite + React. Usa el mismo Supabase que la app móvil y solo admite cuentas con rol `admin`.

```powershell
npm run admin        # desde la raíz → http://localhost:5173
```

## Publicación (Netlify)

Sitio importado desde GitHub; toda la configuración está en `netlify.toml`, en la raíz del repositorio. Cada push a `main` publica una versión nueva. No necesita variables de entorno propias: el panel solo usa la clave publicable.

## Qué hace

- **Clientes:** lista, crear, renombrar y eliminar.
- **Importar carpeta:** arrastra la carpeta de un cliente («PROYECTO X»). Antes de subir muestra secciones y archivos para quitar lo que no deba ver el cliente; marca como «¿borrador?» los archivos que parecen borradores o de WhatsApp. Si el cliente ya existe, reemplaza su contenido.
- **Carpetas de un cliente:** mostrar u ocultar cada sección, crear, editar y eliminar secciones, subir o eliminar documentos, ver un documento y convertir a PDF los Office pendientes.
- **Usuarios:** crear con contraseña temporal (se muestra una vez para copiarla), restablecer la contraseña, revocar o reactivar el acceso y eliminar.
- **Actividad:** quién abrió o descargó cada documento desde la app.

## Cómo funciona por dentro

- Lecturas y escrituras van directo a Supabase con la clave publicable; los permisos los pone RLS (solo `admin` escribe).
- Crear usuarios y convertir Office necesitan la clave secreta o un servicio externo, así que pasan por funciones del servidor: `supabase/functions/usuarios` y `supabase/functions/convertir`. Publicarlas: `npm run functions:deploy`.
- Las reglas de importación y la marca de agua están en `packages/core`, compartidas con `scripts/importar-carpeta.mjs`.
- La conversión a PDF usa Gotenberg en Google Cloud Run: ver `infra/conversion/README.md`.
