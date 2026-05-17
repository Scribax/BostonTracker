# ==========================================
# BOSTON TRACKER - Start All Services
# ==========================================

$baseDir = "C:\Users\franc\OneDrive\Escritorio\Proyectos de Software\BostonTracker-main"

Write-Host "============================================" -ForegroundColor Green
Write-Host "BOSTON TRACKER - Starting Services" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Function to start a service in new window
function Start-ServiceWindow($name, $path, $command) {
    $fullPath = Join-Path $baseDir $path
    $windowTitle = "BOSTON - $name"
    
    # Create command that will run and wait
    $scriptBlock = "Set-Location '$fullPath'; Write-Host 'Starting $name...' -ForegroundColor Green; $command; Read-Host 'Press Enter to close'"
    
    # Start new PowerShell window
    Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", $scriptBlock
    
    Write-Host "Started $name" -ForegroundColor Cyan
    Start-Sleep -Seconds 2
}

# Check folders exist
if (!(Test-Path (Join-Path $baseDir "backend"))) {
    Write-Host "ERROR: backend folder not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (!(Test-Path (Join-Path $baseDir "frontend"))) {
    Write-Host "ERROR: frontend folder not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (!(Test-Path (Join-Path $baseDir "mobile-app"))) {
    Write-Host "ERROR: mobile-app folder not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "All folders found - OK" -ForegroundColor Green
Write-Host ""

# Start Backend
Start-ServiceWindow "BACKEND (Port 5000)" "backend" "npm run dev"

# Start Frontend  
Start-ServiceWindow "FRONTEND (Port 5173)" "frontend" "npm run dev"

# Start Mobile
Start-ServiceWindow "MOBILE (Expo)" "mobile-app" "npx expo start"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "All services started!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Mobile:   Scan QR with Expo Go" -ForegroundColor White
Write-Host ""
Write-Host "Test Accounts:" -ForegroundColor Yellow
Write-Host "  Admin: admin@bostonburgers.com / password123" -ForegroundColor Gray
Write-Host "  Delivery: DEL001 / delivery123" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to close this window"
