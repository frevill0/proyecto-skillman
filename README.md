# Portal PDP

App para iPhone y Android donde cada cliente de un consultor de protección de datos personales (LOPDP, Ecuador) entra con su correo y ve únicamente la carpeta de documentación de su organización. El consultor administra todo desde un panel web.

> Nombre provisional. Contexto completo y decisiones en [CLAUDE.md](CLAUDE.md).

## Estructura

```
apps/
  mobile/     App del cliente (Expo / React Native, iOS y Android)
  admin/      Panel web del administrador (Vite + React)
packages/
  core/       Reglas de importación de carpetas y marca de agua (scripts y panel)
supabase/     Migraciones, políticas RLS y funciones del servidor (usuarios, convertir)
infra/
  conversion/ Servicio Office → PDF (Gotenberg en Google Cloud Run)
scripts/      Importar carpetas y crear usuarios desde la terminal
prototipo/    Prototipo HTML de referencia (datos de ejemplo)
```

## Requisitos

- Node.js LTS (20 o superior)
- Git
- Expo Go en el celular para probar durante el desarrollo

## Empezar

```bash
npm install
npm run mobile             # app del cliente
npm run admin              # panel web → http://localhost:5173
npm run functions:deploy   # publicar las funciones del servidor en Supabase
```

## Importante

**No subir documentos reales de clientes a este repositorio.** El `.gitignore` bloquea archivos de Office y PDF; para pruebas usa solo datos de ejemplo en `ejemplos/`.
