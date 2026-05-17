#!/bin/bash

###############################################################################
# BOSTON TRACKER - DEPLOYMENT FRONTEND
# Script para deployar el frontend en el VPS (186.64.123.15)
###############################################################################

set -e  # Exit on error

echo "======================================================================"
echo "🌐 BOSTON TRACKER - Deployment Frontend"
echo "======================================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables
PROJECT_DIR="/var/www/boston-tracker"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
NGINX_ROOT="/var/www/html"

echo -e "${GREEN}>>> Paso 1: Ir al directorio del frontend${NC}"
cd ${FRONTEND_DIR}

echo ""
echo -e "${GREEN}>>> Paso 2: Instalar dependencias${NC}"
npm install

echo ""
echo -e "${GREEN}>>> Paso 3: Compilar build de producción${NC}"
npm run build

echo ""
echo -e "${GREEN}>>> Paso 4: Limpiar directorio de Nginx${NC}"
sudo rm -rf ${NGINX_ROOT}/*

echo ""
echo -e "${GREEN}>>> Paso 5: Copiar archivos build a Nginx${NC}"
sudo cp -r build/* ${NGINX_ROOT}/

echo ""
echo -e "${GREEN}>>> Paso 6: Configurar Nginx${NC}"
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80;
    server_name bostonamerican.com 186.64.123.15;
    
    root /var/www/html;
    index index.html;
    
    # Servir frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy inverso para API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket para Socket.io
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo ""
echo -e "${GREEN}>>> Paso 7: Verificar configuración de Nginx${NC}"
sudo nginx -t

echo ""
echo -e "${GREEN}>>> Paso 8: Recargar Nginx${NC}"
sudo systemctl reload nginx

echo ""
echo "======================================================================"
echo -e "${GREEN}✅ FRONTEND DEPLOYADO EXITOSAMENTE${NC}"
echo "======================================================================"
echo ""
echo -e "${YELLOW}VERIFICACIÓN:${NC}"
echo "Dashboard Web: http://bostonamerican.com"
echo "            o: http://186.64.123.15"
echo ""
echo "Credenciales Admin:"
echo "  Email: admin@bostonburgers.com"
echo "  Password: password123"
echo ""
