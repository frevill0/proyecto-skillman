# Portal PDP

App para iPhone y Android donde cada cliente de un consultor de protección de datos personales (LOPDP, Ecuador) entra con su correo y ve únicamente la carpeta de documentación de su organización. El consultor administra todo desde un panel web.

> Nombre provisional. Contexto completo y decisiones en [CLAUDE.md](CLAUDE.md).

## Estructura

```
apps/
  mobile/     App del cliente (Expo / React Native, iOS y Android)
  admin/      Panel web del administrador (etapa 2)
packages/     Código compartido (tipos, cliente de Supabase)
supabase/     Migraciones, políticas RLS y funciones (etapa 1)
prototipo/    Prototipo HTML de referencia (datos de ejemplo)
```

## Requisitos

- Node.js LTS (20 o superior)
- Git
- Expo Go en el celular para probar durante el desarrollo

## Empezar

```bash
npm install
npm run mobile
```

## Importante

**No subir documentos reales de clientes a este repositorio.** El `.gitignore` bloquea archivos de Office y PDF; para pruebas usa solo datos de ejemplo en `ejemplos/`.
