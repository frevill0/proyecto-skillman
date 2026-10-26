# Portal PDP · app móvil

App del cliente hecha con Expo (SDK 58) y Expo Router. Por ahora es una **demostración con datos de ejemplo**: no hay servidor ni documentos reales.

## Probar en el celular

```bash
npm install          # desde la raíz del repo
cd apps/mobile
npx expo start       # escanea el QR con Expo Go
```

## Generar el APK (Android)

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

Al terminar, EAS entrega un enlace para descargar e instalar el `.apk`.

## Estructura

- `src/app/` rutas (cada archivo es una pantalla): `login`, `(tabs)/` con Inicio, Buscar y Perfil, `seccion/[id]`, `documento/[sec]/[doc]` y `admin` (vista de demostración del consultor).
- `src/data/demo.ts` carpeta de ejemplo con las 21 secciones.
- `src/state/demo-store.tsx` estado en memoria (sesión, visibilidad de secciones, actividad). Se reemplaza por Supabase en la etapa 1.
