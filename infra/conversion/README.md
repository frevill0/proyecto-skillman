# Servicio de conversión Office → PDF

El panel web no puede convertir Word, Excel y PowerPoint por sí solo. Por eso cada archivo de Office pasa por este camino:

```
Panel (navegador) ──► función "convertir" de Supabase ──► Gotenberg (LibreOffice) en Google Cloud Run
                      (exige sesión de administrador)      (protegido con usuario y contraseña)
```

La función devuelve el PDF y el panel le pone la marca de agua «Confidencial · cliente» antes de subirlo, igual que con los PDF originales.

- **Costo:** Cloud Run se apaga cuando no se usa y la capa gratuita cubre de sobra este volumen (unas 50 horas de conversión al mes). Google pide una tarjeta para activar la facturación, pero no cobra mientras no se pase de la capa gratuita.
- **Datos:** los documentos pasan por Google Cloud (región `us-east1`, Estados Unidos) solo durante la conversión; no se guardan allí. Hay que incluirlo en la revisión de transferencias internacionales con el consultor (LOPDP).

## Instalación (una sola vez)

1. Crea una cuenta en https://console.cloud.google.com, crea un proyecto (por ejemplo `portal-pdp`) y activa la facturación.
2. Instala la herramienta de Google Cloud:
   ```powershell
   winget install --exact Google.CloudSDK
   ```
   Cierra y vuelve a abrir la terminal.
3. Inicia sesión y elige el proyecto:
   ```powershell
   gcloud auth login
   gcloud config set project portal-pdp
   ```
4. Despliega el servicio y conéctalo con Supabase:
   ```powershell
   powershell -ExecutionPolicy Bypass -File infra\conversion\desplegar.ps1
   ```

Después de esto, la importación desde el panel convierte los Office automáticamente. Los documentos que se subieron antes, sin PDF, se convierten con el botón **Convertir pendientes a PDF** en la ficha del cliente.

## Mientras no esté instalado

El panel funciona igual: sube los Office como originales y los marca como «Sin PDF». En el celular se abren con la app de Word o Excel del teléfono. El script `npm run importar` sigue convirtiendo con el LibreOffice de tu PC.
