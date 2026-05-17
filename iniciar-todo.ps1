# ==========================================
# BOSTON TRACKER - Iniciar Todo
# ==========================================

$PROJECT_DIR = "C:\Users\franc\OneDrive\Escritorio\Proyectos de Software\BostonTracker-main"

Clear-Host
Write-Host "BOSTON TRACKER - Iniciando servicios..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Verificar carpetas
if (-not (Test-Path "$PROJECT_DIR\backend")) {
    Write-Host "ERROR: No se encuentra la carpeta backend" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

if (-not (Test-Path "$PROJECT_DIR\frontend")) {
    Write-Host "ERROR: No se encuentra la carpeta frontend" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

if (-not (Test-Path "$PROJECT_DIR\mobile-app")) {
    Write-Host "ERROR: No se encuentra la carpeta mobile-app" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "Carpetas verificadas - OK" -ForegroundColor Green
Write-Host ""

Write-Host "Abriendo 3 terminales..." -ForegroundColor Cyan
Write-Host ""

# Terminal 1: Backend
$cmd1 = "cd `"$PROJECT_DIR\backend`"; npm run dev; Read-Host 'Presiona Enter para cerrar'"
Start-Process powershell -ArgumentList "-NoExit", "-Title", "BACKEND", "-Command", $cmd1
Write-Host "  [OK] Backend iniciando..." -ForegroundColor Green
Start-Sleep -Seconds 2

# Terminal 2: Frontend
$cmd2 = "cd `"$PROJECT_DIR\frontend`"; npm run dev; Read-Host 'Presiona Enter para cerrar'"
Start-Process powershell -ArgumentList "-NoExit", "-Title", "FRONTEND", "-Command", $cmd2
Write-Host "  [OK] Frontend iniciando..." -ForegroundColor Blue
Start-Sleep -Seconds 2

# Terminal 3: Mobile
$cmd3 = "cd `"$PROJECT_DIR\mobile-app`"; npx expo start; Read-Host 'Presiona Enter para cerrar'"
Start-Process powershell -ArgumentList "-NoExit", "-Title", "MOBILE", "-Command", $cmd3
Write-Host "  [OK] Mobile iniciando..." -ForegroundColor Yellow

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "3 terminales abiertas!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen:" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Mobile:    Escanear QR con Expo Go" -ForegroundColor White
Write-Host ""
Write-Host "Login de prueba:" -ForegroundColor Cyan
Write-Host "  Admin: admin@bostonburgers.com / password123" -ForegroundColor Gray
Write-Host "  Delivery: DEL001 / delivery123" -ForegroundColor Gray
Write-Host ""
Write-Host "Espera 10-20 segundos a que todo cargue..." -ForegroundColor Yellow
Write-Host ""

Read-Host "Presiona Enter para cerrar esta ventana"
