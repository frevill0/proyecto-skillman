# Despliega el servicio de conversión Office → PDF (Gotenberg con LibreOffice) en Google Cloud Run
# y guarda su dirección y credenciales como secretos de la función "convertir" de Supabase.
#
# Requisitos: gcloud instalado y con sesión (gcloud auth login), proyecto elegido
# (gcloud config set project <id>) y facturación activa (no cobra dentro de la capa gratuita).
#
# Uso, desde la raíz del repositorio:
#   powershell -ExecutionPolicy Bypass -File infra\conversion\desplegar.ps1 [-Region us-east1]

param([string]$Region = 'us-east1')

$ErrorActionPreference = 'Stop'
$service = 'portal-pdp-conversion'
$user = 'portalpdp'

# Contraseña aleatoria de 32 caracteres para la autenticación básica del servicio.
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$password = ([Convert]::ToBase64String($bytes) -replace '[+/=]', '').Substring(0, 32)

Write-Host "Activando Cloud Run..."
gcloud services enable run.googleapis.com
if ($LASTEXITCODE) { throw 'No pude activar Cloud Run. ¿Tiene facturación el proyecto?' }

Write-Host "Desplegando $service en $Region (tarda 1-3 minutos)..."
gcloud run deploy $service `
  --image=docker.io/gotenberg/gotenberg:8-libreoffice-cloudrun `
  --region=$Region `
  --allow-unauthenticated `
  --memory=2Gi --cpu=1 `
  --concurrency=1 --min-instances=0 --max-instances=2 `
  --timeout=300 `
  --set-env-vars="API_ENABLE_BASIC_AUTH=true,GOTENBERG_API_BASIC_AUTH_USERNAME=$user,GOTENBERG_API_BASIC_AUTH_PASSWORD=$password,API_TIMEOUT=240s"
if ($LASTEXITCODE) { throw 'Falló el despliegue en Cloud Run.' }

$url = gcloud run services describe $service --region=$Region --format='value(status.url)'
Write-Host "Servicio listo en $url"

Write-Host "Guardando los secretos en Supabase..."
$env:Path = "C:\Program Files\nodejs;$env:Path"
npx supabase secrets set "GOTENBERG_URL=$url" "GOTENBERG_USER=$user" "GOTENBERG_PASSWORD=$password"
if ($LASTEXITCODE) { throw 'No pude guardar los secretos en Supabase.' }

Write-Host ""
Write-Host "Listo. El panel ya convierte Word, Excel y PowerPoint a PDF."
