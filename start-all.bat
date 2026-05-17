@echo off
chcp 65001 >nul
cls

echo 🚀 BOSTON TRACKER - Iniciando todo...
echo =================================
echo.

set "PROJECT_DIR=C:\Users\franc\OneDrive\Escritorio\Proyectos de Software\BostonTracker-main"

echo 📂 Proyecto: %PROJECT_DIR%
echo.

:: Verificar que existen las carpetas
if not exist "%PROJECT_DIR%\backend" (
    echo ❌ ERROR: No se encuentra la carpeta backend
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%\frontend" (
    echo ❌ ERROR: No se encuentra la carpeta frontend
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%\mobile-app" (
    echo ❌ ERROR: No se encuentra la carpeta mobile-app
    pause
    exit /b 1
)

echo ✅ Carpetas verificadas
echo.
echo 📝 Abriendo 3 ventanas de CMD...
echo.

:: Ventana 1: Backend
echo 🔧 Iniciando BACKEND en puerto 5000...
start "🟢 BACKEND - Boston Tracker" cmd /k "cd /d "%PROJECT_DIR%\backend" && echo Instalando dependencias... && npm install && echo. && echo 🚀 Iniciando servidor... && npm run dev"

:: Esperar unos segundos
timeout /t 3 /nobreak >nul

:: Ventana 2: Frontend  
echo 🎨 Iniciando FRONTEND...
start "🔵 FRONTEND - Boston Tracker" cmd /k "cd /d "%PROJECT_DIR%\frontend" && echo Instalando dependencias... && npm install && echo. && echo 🚀 Iniciando Vite... && npm run dev"

:: Esperar unos segundos
timeout /t 3 /nobreak >nul

:: Ventana 3: Mobile
echo 📱 Iniciando MOBILE APP (Expo)...
start "📱 MOBILE - Boston Tracker" cmd /k "cd /d "%PROJECT_DIR%\mobile-app" && echo Instalando dependencias... && npm install && echo. && echo 🚀 Iniciando Expo... && npx expo start"

echo.
echo =================================
echo ✅ 3 ventanas abiertas!
echo.
echo 📋 Resumen:
echo    • Backend:   http://localhost:5000
echo    • Frontend:  http://localhost:5173
echo    • Mobile:    Escanear QR con Expo Go
echo.
echo 🔑 Login de prueba:
echo    Admin: admin@bostonburgers.com / password123
echo    Delivery: DEL001 / delivery123
echo.
echo ⚠️  Si hay errores, revisa cada ventana.
echo.
pause
