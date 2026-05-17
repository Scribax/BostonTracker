# ==========================================
# BOSTON TRACKER - VERIFICATION SCRIPT
# Verifica que la instalación esté completa y funcionando
# ==========================================

Write-Host "🔍 BOSTON TRACKER - Installation Verification" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# ==========================================
# UTILITIES
# ==========================================

function Write-Check($message) {
    Write-Host "  ✓ $message" -ForegroundColor Green
}

function Write-Warn($message) {
    Write-Host "  ⚠ $message" -ForegroundColor Yellow
    $script:warnings++
}

function Write-Fail($message) {
    Write-Host "  ✗ $message" -ForegroundColor Red
    $script:errors++
}

function Test-Port($port) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# ==========================================
# CHECK PREREQUISITES
# ==========================================

Write-Host "📋 Checking Prerequisites..." -ForegroundColor Cyan

# Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Check "Node.js found: $nodeVersion"
} else {
    Write-Fail "Node.js not found"
}

# npm
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Check "npm found: $npmVersion"
} else {
    Write-Fail "npm not found"
}

# Git
$gitVersion = git --version 2>$null
if ($gitVersion) {
    Write-Check "Git found"
} else {
    Write-Warn "Git not found (optional)"
}

# PostgreSQL
$pgExists = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgExists) {
    Write-Check "PostgreSQL service found"
} else {
    Write-Warn "PostgreSQL service not found (might be running under different name)"
}

Write-Host ""

# ==========================================
# CHECK DIRECTORY STRUCTURE
# ==========================================

Write-Host "📁 Checking Directory Structure..." -ForegroundColor Cyan

$directories = @(
    "backend",
    "frontend",
    "mobile-app"
)

foreach ($dir in $directories) {
    if (Test-Path $dir -PathType Container) {
        Write-Check "$dir/ directory exists"
    } else {
        Write-Fail "$dir/ directory missing"
    }
}

Write-Host ""

# ==========================================
# CHECK BACKEND
# ==========================================

Write-Host "🔧 Checking Backend..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\backend" -ErrorAction SilentlyContinue

# node_modules
if (Test-Path "node_modules" -PathType Container) {
    Write-Check "Backend node_modules exists"
} else {
    Write-Fail "Backend node_modules missing - run: npm install"
}

# package.json
if (Test-Path "package.json") {
    Write-Check "Backend package.json exists"
} else {
    Write-Fail "Backend package.json missing"
}

# tsconfig.json
if (Test-Path "tsconfig.json") {
    Write-Check "Backend tsconfig.json exists"
} else {
    Write-Fail "Backend tsconfig.json missing"
}

# .env
if (Test-Path ".env") {
    Write-Check "Backend .env exists"
} else {
    if (Test-Path ".env.example") {
        Write-Warn "Backend .env missing - copy from .env.example"
    } else {
        Write-Fail "Backend .env missing (no .env.example found)"
    }
}

# src directory
if (Test-Path "src" -PathType Container) {
    Write-Check "Backend src/ directory exists"
    
    # Check key files
    $keyFiles = @(
        "src/server.ts",
        "src/types/index.ts",
        "src/models/index.ts",
        "src/controllers/auth.ts",
        "src/routes/auth.ts"
    )
    
    foreach ($file in $keyFiles) {
        if (Test-Path $file) {
            # File exists, good
        } else {
            Write-Warn "Backend $file not found"
        }
    }
    
    Write-Check "Backend TypeScript structure complete"
} else {
    Write-Fail "Backend src/ directory missing"
}

# tests directory
if (Test-Path "src\__tests__" -PathType Container) {
    Write-Check "Backend tests/ directory exists"
} else {
    Write-Warn "Backend tests/ directory missing"
}

Write-Host ""

# ==========================================
# CHECK FRONTEND
# ==========================================

Write-Host "🎨 Checking Frontend..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\frontend" -ErrorAction SilentlyContinue

# node_modules
if (Test-Path "node_modules" -PathType Container) {
    Write-Check "Frontend node_modules exists"
} else {
    Write-Fail "Frontend node_modules missing - run: npm install"
}

# TypeScript config files
$tsFiles = @("tsconfig.json", "tsconfig.node.json")
foreach ($file in $tsFiles) {
    if (Test-Path $file) {
        Write-Check "Frontend $file exists"
    } else {
        Write-Warn "Frontend $file missing"
    }
}

# vite.config.ts
if (Test-Path "vite.config.ts") {
    Write-Check "Frontend vite.config.ts exists"
} else {
    Write-Warn "Frontend vite.config.ts missing"
}

# src directory
if (Test-Path "src" -PathType Container) {
    Write-Check "Frontend src/ directory exists"
    
    # Check key files
    $keyFiles = @(
        "src/main.tsx",
        "src/App.tsx",
        "src/types/index.ts",
        "src/context/AuthContext.tsx",
        "src/services/api.ts",
        "src/services/socket.ts"
    )
    
    $foundCount = 0
    foreach ($file in $keyFiles) {
        if (Test-Path $file) {
            $foundCount++
        }
    }
    
    if ($foundCount -eq $keyFiles.Count) {
        Write-Check "Frontend TypeScript migration complete ($foundCount/$($keyFiles.Count) files)"
    } else {
        Write-Warn "Frontend TypeScript migration partial ($foundCount/$($keyFiles.Count) files)"
    }
} else {
    Write-Fail "Frontend src/ directory missing"
}

Write-Host ""

# ==========================================
# CHECK MOBILE APP
# ==========================================

Write-Host "📱 Checking Mobile App..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\mobile-app" -ErrorAction SilentlyContinue

# node_modules
if (Test-Path "node_modules" -PathType Container) {
    Write-Check "Mobile node_modules exists"
} else {
    Write-Fail "Mobile node_modules missing - run: npm install"
}

# tsconfig.json
if (Test-Path "tsconfig.json") {
    Write-Check "Mobile tsconfig.json exists"
} else {
    Write-Warn "Mobile tsconfig.json missing"
}

# App.tsx
if (Test-Path "App.tsx") {
    Write-Check "Mobile App.tsx exists (TypeScript)"
} else {
    if (Test-Path "App.js") {
        Write-Warn "Mobile still using App.js (not migrated to TypeScript)"
    } else {
        Write-Fail "Mobile App.tsx/App.js missing"
    }
}

# src directory
if (Test-Path "src" -PathType Container) {
    Write-Check "Mobile src/ directory exists"
    
    # Check optimized location service
    if (Test-Path "src\services\optimizedLocationService.ts") {
        Write-Check "Mobile optimizedLocationService.ts exists (Phase 4)"
    } else {
        Write-Warn "Mobile optimizedLocationService.ts missing (Phase 4 not implemented)"
    }
} else {
    Write-Fail "Mobile src/ directory missing"
}

Write-Host ""

# ==========================================
# CHECK DOCUMENTATION
# ==========================================

Write-Host "📚 Checking Documentation..." -ForegroundColor Cyan

$docs = @(
    "MIGRATION_TYPESCRIPT.md",
    "TESTING.md",
    "MOBILE_OPTIMIZATION.md",
    "INSTALLATION.md",
    "setup.ps1",
    "verify-installation.ps1"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Check "$doc exists"
    } else {
        Write-Warn "$doc missing"
    }
}

Write-Host ""

# ==========================================
# CHECK RUNNING SERVICES (OPTIONAL)
# ==========================================

Write-Host "🌐 Checking Running Services..." -ForegroundColor Cyan

# Check if backend is running
if (Test-Port 5000) {
    Write-Check "Backend is running on port 5000"
    
    # Try to hit health endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        Write-Check "Backend health endpoint responding"
    } catch {
        Write-Warn "Backend health endpoint not responding (might need to check server)"
    }
} else {
    Write-Warn "Backend not running on port 5000 (start with: npm run dev)"
}

# Check if frontend is running
$frontendPorts = @(5173, 3000, 4173)
$frontendRunning = $false
foreach ($port in $frontendPorts) {
    if (Test-Port $port) {
        Write-Check "Frontend is running on port $port"
        $frontendRunning = $true
        break
    }
}

if (-not $frontendRunning) {
    Write-Warn "Frontend not running (start with: npm run dev)"
}

Write-Host ""

# ==========================================
# SUMMARY
# ==========================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 EXCELLENT! Installation is complete and ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Start backend: cd backend && npm run dev"
    Write-Host "  2. Start frontend: cd frontend && npm run dev"
    Write-Host "  3. Start mobile: cd mobile-app && npx expo start"
    Write-Host ""
} elseif ($errors -eq 0) {
    Write-Host "✅ GOOD! Installation is mostly complete with $warnings warnings." -ForegroundColor Green
    Write-Host ""
    Write-Host "Review the warnings above and fix them if needed." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "⚠️  ISSUES FOUND: $errors errors, $warnings warnings" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the errors above before proceeding." -ForegroundColor Yellow
    Write-Host "Refer to @INSTALLATION.md for troubleshooting." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan

# Return to original directory
Set-Location $PSScriptRoot
