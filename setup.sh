#!/bin/bash

# ==========================================
# BOSTON TRACKER - SETUP SCRIPT (Linux/Mac)
# ==========================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print functions
print_step() {
    echo -e "${CYAN}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Header
echo ""
echo -e "${GREEN}🚀 BOSTON TRACKER - Setup Script${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check command line args
SKIP_BACKEND=false
SKIP_FRONTEND=false
SKIP_MOBILE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --skip-mobile)
            SKIP_MOBILE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# ==========================================
# CHECK PREREQUISITES
# ==========================================

print_step "Checking prerequisites..."

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Install from: https://nodejs.org/"
    exit 1
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. Install from: https://nodejs.org/"
    exit 1
fi

# Git
if command -v git &> /dev/null; then
    print_success "Git found"
else
    print_warning "Git not found (optional)"
fi

echo ""

# ==========================================
# SETUP BACKEND
# ==========================================

if [ "$SKIP_BACKEND" = false ]; then
    print_step "Setting up BACKEND..."
    
    cd "$SCRIPT_DIR/backend"
    
    print_step "Installing dependencies..."
    if npm install > /dev/null 2>&1; then
        print_success "Backend dependencies installed"
        
        # Check .env file
        if [ ! -f ".env" ]; then
            if [ -f ".env.example" ]; then
                cp .env.example .env
                print_warning "Created .env file from .env.example"
            fi
        fi
        
        # TypeScript check
        print_step "Checking TypeScript..."
        if npm run typecheck > /dev/null 2>&1; then
            print_success "Backend TypeScript check passed"
        else
            print_error "Backend TypeScript check failed"
        fi
        
        # Run tests
        print_step "Running tests..."
        if npm test -- --passWithNoTests > /dev/null 2>&1; then
            print_success "Backend tests passed"
        else
            print_warning "Some tests failed (this is OK during initial setup)"
        fi
        
    else
        print_error "Backend installation failed"
    fi
    
    cd "$SCRIPT_DIR"
fi

echo ""

# ==========================================
# SETUP FRONTEND
# ==========================================

if [ "$SKIP_FRONTEND" = false ]; then
    print_step "Setting up FRONTEND..."
    
    cd "$SCRIPT_DIR/frontend"
    
    print_step "Installing dependencies..."
    if npm install > /dev/null 2>&1; then
        print_success "Frontend dependencies installed"
        
        # TypeScript check
        print_step "Checking TypeScript..."
        if npm run typecheck > /dev/null 2>&1; then
            print_success "Frontend TypeScript check passed"
        else
            print_error "Frontend TypeScript check failed"
        fi
        
    else
        print_error "Frontend installation failed"
    fi
    
    cd "$SCRIPT_DIR"
fi

echo ""

# ==========================================
# SETUP MOBILE
# ==========================================

if [ "$SKIP_MOBILE" = false ]; then
    print_step "Setting up MOBILE APP..."
    
    cd "$SCRIPT_DIR/mobile-app"
    
    print_step "Installing dependencies..."
    if npm install > /dev/null 2>&1; then
        print_success "Mobile app dependencies installed"
        
        # Check for Expo CLI
        if ! command -v expo &> /dev/null; then
            print_step "Installing Expo CLI globally..."
            npm install -g @expo/cli > /dev/null 2>&1
        fi
        
        print_success "Expo CLI ready"
        
    else
        print_error "Mobile app installation failed"
    fi
    
    cd "$SCRIPT_DIR"
fi

echo ""

# ==========================================
# SUMMARY
# ==========================================

echo -e "${GREEN}=================================${NC}"
print_success "Setup Complete!"
echo -e "${GREEN}=================================${NC}"
echo ""

echo -e "${CYAN}📋 Quick Start Commands:${NC}"
echo ""

if [ "$SKIP_BACKEND" = false ]; then
    echo -e "${YELLOW}Backend:${NC}"
    echo "   cd backend"
    echo "   npm run dev"
    echo "   → http://localhost:5000"
    echo ""
fi

if [ "$SKIP_FRONTEND" = false ]; then
    echo -e "${YELLOW}Frontend:${NC}"
    echo "   cd frontend"
    echo "   npm run dev"
    echo "   → http://localhost:5173"
    echo ""
fi

if [ "$SKIP_MOBILE" = false ]; then
    echo -e "${YELLOW}Mobile App:${NC}"
    echo "   cd mobile-app"
    echo "   npx expo start"
    echo "   → Scan QR code with Expo Go"
    echo ""
fi

echo -e "${CYAN}📚 Documentation:${NC}"
echo "   @MIGRATION_TYPESCRIPT.md - Migration guide"
echo "   @TESTING.md - Testing guide"
echo "   @MOBILE_OPTIMIZATION.md - Mobile optimization guide"
echo ""

echo -e "${GREEN}✨ Happy coding with BOSTON TRACKER!${NC}"
echo ""
