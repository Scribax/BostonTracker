#!/bin/bash

# ================================
# BOSTON TRACKER - INSTALACIÓN COMPLETA
# ================================

set -e  # Detener en cualquier error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║                  🍔 BOSTON TRACKER INSTALLER 🍔                 ║"
echo "║                                                                  ║"
echo "║           Instalación Automática de Dependencias                ║"
echo "║                        v1.0                                     ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}🔧 Iniciando instalación de dependencias...${NC}\n"

# Funciones de utilidad
show_progress() {
    echo -e "${BLUE}▶ $1...${NC}"
}

show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

show_error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Verificar directorio
if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]] || [[ ! -d "frontend" ]]; then
    show_error "Este script debe ejecutarse desde el directorio raíz del proyecto Boston Tracker"
fi

# 1. Verificar si ya se ejecutó setup.sh
if [[ ! -f ".env" ]]; then
    show_warning "No se encontró configuración. Ejecutando setup automático..."
    ./setup.sh
fi

# 2. Detectar sistema operativo
show_progress "Detectando sistema operativo"
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if command -v apt-get &> /dev/null; then
        DISTRO="debian"
    elif command -v yum &> /dev/null; then
        DISTRO="redhat"
    elif command -v pacman &> /dev/null; then
        DISTRO="arch"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
fi

echo -e "${GREEN}🖥️  Sistema detectado: $OS${NC}"

# 3. Instalar dependencias del sistema
show_progress "Instalando dependencias del sistema"

install_system_deps() {
    case $DISTRO in
        "debian")
            sudo apt update
            sudo apt install -y nodejs npm postgresql postgresql-contrib git curl wget
            ;;
        "redhat")
            sudo yum update -y
            sudo yum install -y nodejs npm postgresql postgresql-server git curl wget
            ;;
        "arch")
            sudo pacman -Sy --noconfirm nodejs npm postgresql git curl wget
            ;;
        *)
            show_warning "Distribución no reconocida. Asegurate de tener instalado: nodejs, npm, postgresql"
            ;;
    esac
}

if [[ $OS == "linux" ]]; then
    install_system_deps
elif [[ $OS == "macos" ]]; then
    if command -v brew &> /dev/null; then
        brew install node postgresql
    else
        show_warning "Se recomienda instalar Homebrew para gestionar dependencias en macOS"
    fi
fi

show_success "Dependencias del sistema instaladas"

# 4. Verificar Node.js y npm
show_progress "Verificando Node.js y npm"

if ! command -v node &> /dev/null; then
    show_error "Node.js no está instalado o no está en PATH"
fi

if ! command -v npm &> /dev/null; then
    show_error "npm no está instalado o no está en PATH"
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo -e "${GREEN}📦 Node.js: $NODE_VERSION${NC}"
echo -e "${GREEN}📦 npm: $NPM_VERSION${NC}"

# 5. Instalar dependencias del backend
show_progress "Instalando dependencias del backend"

cd backend

if [[ -f "package-lock.json" ]]; then
    npm ci --production
else
    npm install --production
fi

show_success "Dependencias del backend instaladas"
cd ..

# 6. Instalar dependencias del frontend
show_progress "Instalando dependencias del frontend"

cd frontend

if [[ -f "package-lock.json" ]]; then
    npm ci
else
    npm install
fi

show_success "Dependencias del frontend instaladas"
cd ..

# 7. Instalar dependencias de la app móvil
show_progress "Instalando dependencias de la aplicación móvil"

cd mobile-app

if [[ -f "package-lock.json" ]]; then
    npm ci
else
    npm install
fi

# Instalar Expo CLI globalmente si no existe
if ! command -v expo &> /dev/null; then
    npm install -g @expo/cli
    show_success "Expo CLI instalado globalmente"
fi

show_success "Dependencias de la aplicación móvil instaladas"
cd ..

# 8. Configurar PostgreSQL
show_progress "Configurando PostgreSQL"

# Función para configurar PostgreSQL
setup_postgresql() {
    case $DISTRO in
        "debian"|"ubuntu")
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            ;;
        "redhat"|"centos")
            if [[ ! -f "/var/lib/pgsql/data/postgresql.conf" ]]; then
                sudo postgresql-setup initdb
            fi
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            ;;
        "arch")
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            if [[ ! -f "/var/lib/postgres/data/postgresql.conf" ]]; then
                sudo -u postgres initdb -D /var/lib/postgres/data
            fi
            ;;
    esac
}

if [[ $OS == "linux" ]]; then
    setup_postgresql
fi

# Crear usuario y base de datos PostgreSQL
create_database() {
    echo -e "${YELLOW}Creando usuario y base de datos PostgreSQL...${NC}"
    
    # Verificar si el usuario ya existe
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='boston_user'" | grep -q 1; then
        show_warning "El usuario 'boston_user' ya existe"
    else
        sudo -u postgres psql << EOF
CREATE USER boston_user WITH PASSWORD 'boston123';
ALTER USER boston_user CREATEDB;
EOF
        show_success "Usuario 'boston_user' creado"
    fi
    
    # Verificar si la base de datos ya existe
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw boston_tracker; then
        show_warning "La base de datos 'boston_tracker' ya existe"
    else
        sudo -u postgres createdb -O boston_user boston_tracker
        show_success "Base de datos 'boston_tracker' creada"
    fi
}

create_database

show_success "PostgreSQL configurado"

# 9. Build del frontend
show_progress "Construyendo frontend para producción"

cd frontend
npm run build
show_success "Frontend construido"
cd ..

# 10. Crear scripts de inicio
show_progress "Creando scripts de inicio"

# Script para iniciar backend
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Boston Tracker Backend..."
cd backend
npm start
EOF

# Script para iniciar frontend
cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🌐 Iniciando Boston Tracker Frontend..."
cd frontend
npm run preview
EOF

# Script para iniciar aplicación móvil
cat > start-mobile.sh << 'EOF'
#!/bin/bash
echo "📱 Iniciando Boston Tracker Mobile..."
cd mobile-app
expo start
EOF

# Script para iniciar todo
cat > start-all.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Boston Tracker completo..."

# Función para matar procesos al salir
cleanup() {
    echo "🛑 Deteniendo servicios..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT

# Iniciar backend en background
echo "🔧 Iniciando Backend..."
cd backend && npm start &

# Esperar un poco para que inicie el backend
sleep 5

# Iniciar frontend en background
echo "🌐 Iniciando Frontend..."
cd ../frontend && npm run preview &

echo "✅ Servicios iniciados:"
echo "   🔧 Backend: http://localhost:5000"
echo "   🌐 Frontend: http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Esperar indefinidamente
wait
EOF

# Hacer ejecutables los scripts
chmod +x start-backend.sh
chmod +x start-frontend.sh
chmod +x start-mobile.sh
chmod +x start-all.sh

show_success "Scripts de inicio creados"

# 11. Crear archivo de servicio systemd (opcional)
show_progress "Creando configuración de servicio (opcional)"

cat > boston-tracker.service << EOF
[Unit]
Description=Boston Tracker Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

show_success "Archivo de servicio creado (boston-tracker.service)"

# 12. Resumen final
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════╗"
echo -e "║                                                                  ║"
echo -e "║                     ✅ INSTALACIÓN COMPLETA                     ║"
echo -e "║                                                                  ║"
echo -e "╚══════════════════════════════════════════════════════════════════╝${NC}"

# Obtener IP configurada
SERVER_IP=$(grep "SERVER_IP=" .env 2>/dev/null | cut -d'=' -f2 || echo "localhost")

echo -e "\n${CYAN}📋 SERVICIOS CONFIGURADOS:${NC}"
echo -e "${YELLOW}🔧 Backend:${NC} http://$SERVER_IP:5000"
echo -e "${YELLOW}🌐 Frontend:${NC} http://$SERVER_IP:3000"
echo -e "${YELLOW}📱 Mobile:${NC} exp://$SERVER_IP:8081"
echo -e "${YELLOW}🗄️  PostgreSQL:${NC} puerto 5432"

echo -e "\n${BLUE}🚀 COMANDOS DISPONIBLES:${NC}"
echo -e "${GREEN}• Todo el sistema:${NC} ${CYAN}./start-all.sh${NC}"
echo -e "${GREEN}• Solo backend:${NC} ${CYAN}./start-backend.sh${NC}"
echo -e "${GREEN}• Solo frontend:${NC} ${CYAN}./start-frontend.sh${NC}"
echo -e "${GREEN}• Solo mobile:${NC} ${CYAN}./start-mobile.sh${NC}"
echo -e "${GREEN}• Con Docker:${NC} ${CYAN}docker-compose up -d${NC}"

echo -e "\n${BLUE}🔧 SERVICIO DEL SISTEMA (opcional):${NC}"
echo -e "${CYAN}sudo cp boston-tracker.service /etc/systemd/system/${NC}"
echo -e "${CYAN}sudo systemctl enable boston-tracker${NC}"
echo -e "${CYAN}sudo systemctl start boston-tracker${NC}"

echo -e "\n${PURPLE}🔑 CREDENCIALES:${NC}"
echo -e "${YELLOW}Admin:${NC} admin@bostonburgers.com / password123"
echo -e "${YELLOW}Delivery 1:${NC} DEL001 / delivery123"
echo -e "${YELLOW}Delivery 2:${NC} DEL002 / delivery123"

echo -e "\n${GREEN}✨ ¡Instalación completada con éxito!${NC}"
echo -e "${GREEN}🎯 Ejecuta ${CYAN}./start-all.sh${GREEN} para iniciar el sistema${NC}"
