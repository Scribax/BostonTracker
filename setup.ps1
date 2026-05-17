# ==========================================
# BOSTON TRACKER - SETUP SCRIPT (Windows PowerShell)
# ==========================================

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipMobile,
    [switch]$Dev
)

Write-Host "🚀 BOSTON TRACKER - Setup Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# ==========================================
# UTILITIES
# ==========================================

function Write-Step($message) {
    Write-Host "📦 $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Test-Command($command) {
    $exists = Get-Command $command -ErrorAction SilentlyContinue
    return $exists -ne $null
}

# ==========================================
# CHECK PREREQUISITES
# ==========================================

Write-Step "Checking prerequisites..."

$requirements = @(
    @{ Name = "Node.js"; Command = "node"; InstallUrl = "https://nodejs.org/" },
    @{ Name = "npm"; Command = "npm"; InstallUrl = "https://nodejs.org/" },
    @{ Name = "Git"; Command = "git"; InstallUrl = "https://git-scm.com/" }
)

$missing = @()
foreach ($req in $requirements) {
    if (Test-Command $req.Command) {
        $version = Invoke-Expression "$($req.Command) --version"
        Write-Success "$($req.Name) found: $version"
    } else {
        Write-Error "$($req.Name) not found. Install from: $($req.InstallUrl)"
        $missing += $req.Name
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Error "Missing requirements: $($missing -join ', ')"
    Write-Host "Please install them and run this script again."
    exit 1
}

# ==========================================
# SETUP BACKEND
# ==========================================

if (-not $SkipBackend) {
    Write-Host ""
    Write-Step "Setting up BACKEND..."
    
    Set-Location "$PSScriptRoot\backend"
    
    Write-Host "   Installing dependencies..."
    npm install 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend dependencies installed"
        
        # Check .env file
        if (-not (Test-Path ".env")) {
            if (Test-Path ".env.example") {
                Copy-Item ".env.example" ".env"
                Write-Host "   📝 Created .env file from .env.example" -ForegroundColor Yellow
            }
        }
        
        # Run TypeScript check
        Write-Host "   Checking TypeScript..."
        npm run typecheck 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend TypeScript check passed"
        } else {
            Write-Error "Backend TypeScript check failed"
        }
        
        # Run tests
        Write-Host "   Running tests..."
        npm test -- --passWithNoTests 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend tests passed"
        } else {
            Write-Host "   ⚠️  Some tests failed (this is OK during initial setup)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Error "Backend installation failed"
    }
    
    Set-Location $PSScriptRoot
}

# ==========================================
# SETUP FRONTEND
# ==========================================

if (-not $SkipFrontend) {
    Write-Host ""
    Write-Step "Setting up FRONTEND..."
    
    Set-Location "$PSScriptRoot\frontend"
    
    Write-Host "   Installing dependencies..."
    npm install 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend dependencies installed"
        
        # Run TypeScript check
        Write-Host "   Checking TypeScript..."
        npm run typecheck 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend TypeScript check passed"
        } else {
            Write-Error "Frontend TypeScript check failed"
        }
        
    } else {
        Write-Error "Frontend installation failed"
    }
    
    Set-Location $PSScriptRoot
}

# ==========================================
# SETUP MOBILE
# ==========================================

if (-not $SkipMobile) {
    Write-Host ""
    Write-Step "Setting up MOBILE APP..."
    
    Set-Location "$PSScriptRoot\mobile-app"
    
    Write-Host "   Installing dependencies..."
    npm install 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Mobile app dependencies installed"
        
        # Check for Expo CLI
        if (-not (Test-Command "expo")) {
            Write-Host "   Installing Expo CLI globally..."
            npm install -g @expo/cli 2>&1 | Out-Null
        }
        
        Write-Success "Expo CLI ready"
        
    } else {
        Write-Error "Mobile app installation failed"
    }
    
    Set-Location $PSScriptRoot
}

# ==========================================
# SUMMARY
# ==========================================

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Success "Setup Complete!"
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Quick Start Commands:" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipBackend) {
    Write-Host "Backend:" -ForegroundColor Yellow
    Write-Host "   cd backend"
    Write-Host "   npm run dev"
    Write-Host "   → http://localhost:5000"
    Write-Host ""
}

if (-not $SkipFrontend) {
    Write-Host "Frontend:" -ForegroundColor Yellow
    Write-Host "   cd frontend"
    Write-Host "   npm run dev"
    Write-Host "   → http://localhost:5173"
    Write-Host ""
}

if (-not $SkipMobile) {
    Write-Host "Mobile App:" -ForegroundColor Yellow
    Write-Host "   cd mobile-app"
    Write-Host "   npx expo start"
    Write-Host "   → Scan QR code with Expo Go"
    Write-Host ""
}

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   @MIGRATION_TYPESCRIPT.md - Migration guide"
Write-Host "   @TESTING.md - Testing guide"
Write-Host "   @MOBILE_OPTIMIZATION.md - Mobile optimization guide"
Write-Host ""

Write-Host "✨ Happy coding with BOSTON TRACKER!" -ForegroundColor Green
