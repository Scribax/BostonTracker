#!/bin/bash

###############################################################################
# BOSTON TRACKER - SETUP INICIAL DEL VPS
# Script para configurar el VPS nuevo (186.64.123.15 - bostonamerican.com)
###############################################################################

set -e  # Exit on error

echo "======================================================================"
echo "🍔 BOSTON TRACKER - Setup Inicial del VPS"
echo "======================================================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
VPS_IP="186.64.123.15"
VPS_DOMAIN="bostonamerican.com"
PROJECT_DIR="/var/www/boston-tracker"
NGINX_DIR="/etc/nginx"
DB_NAME="boston_tracker"
DB_USER="boston_user"
DB_PASS="boston123"

echo -e "${GREEN}>>> Paso 1: Actualizar sistema operativo${NC}"
sudo apt update
sudo apt upgrade -y

echo ""
echo -e "${GREEN}>>> Paso 2: Instalar Node.js (usando nvm)${NC}"
if ! command -v nvm &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi
nvm install 18
nvm use 18
nvm alias default 18

echo ""
echo -e "${GREEN}>>> Paso 3: Instalar PostgreSQL${NC}"
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo ""
echo -e "${GREEN}>>> Paso 4: Configurar Base de Datos${NC}"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || echo "Base de datos ya existe"
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || echo "Usuario ya existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
sudo -u postgres psql -c "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};"

echo ""
echo -e "${GREEN}>>> Paso 5: Instalar Nginx${NC}"
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

echo ""
echo -e "${GREEN}>>> Paso 6: Configurar Firewall (UFW)${NC}"
sudo ufw allow 22222/tcp   # SSH custom port
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 5000/tcp    # Backend API
sudo ufw --force enable

echo ""
echo -e "${GREEN}>>> Paso 7: Instalar PM2 (Process Manager)${NC}"
npm install -g pm2

echo ""
echo -e "${GREEN}>>> Paso 8: Crear directorio del proyecto${NC}"
sudo mkdir -p ${PROJECT_DIR}
sudo chown -R $USER:$USER ${PROJECT_DIR}

echo ""
echo -e "${GREEN}>>> Paso 9: Instalar Git${NC}"
sudo apt install git -y

echo ""
echo "======================================================================"
echo -e "${GREEN}✅ SETUP INICIAL COMPLETADO${NC}"
echo "======================================================================"
echo ""
echo -e "${YELLOW}SIGUIENTE PASO:${NC}"
echo "1. Clonar el repositorio en ${PROJECT_DIR}"
echo "2. Ejecutar el script de deployment del backend"
echo "3. Ejecutar el script de deployment del frontend"
echo ""
echo -e "${YELLOW}INFORMACIÓN DEL SERVIDOR:${NC}"
echo "IP: ${VPS_IP}"
echo "Dominio: ${VPS_DOMAIN}"
echo "Directorio: ${PROJECT_DIR}"
echo "DB Name: ${DB_NAME}"
echo "DB User: ${DB_USER}"
echo ""
