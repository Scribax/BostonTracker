#!/bin/bash

###############################################################################
# BOSTON TRACKER - DEPLOYMENT BACKEND
# Script para deployar el backend en el VPS (186.64.123.15)
###############################################################################

set -e  # Exit on error

echo "======================================================================"
echo "🔙 BOSTON TRACKER - Deployment Backend"
echo "======================================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables
PROJECT_DIR="/var/www/boston-tracker"
BACKEND_DIR="${PROJECT_DIR}/backend"

echo -e "${GREEN}>>> Paso 1: Ir al directorio del backend${NC}"
cd ${BACKEND_DIR}

echo ""
echo -e "${GREEN}>>> Paso 2: Instalar dependencias${NC}"
npm install

echo ""
echo -e "${GREEN}>>> Paso 3: Verificar archivo .env${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: Archivo .env no encontrado${NC}"
    echo "Por favor, copia el archivo .env con la configuración correcta"
    exit 1
else
    echo -e "${GREEN}✓ Archivo .env encontrado${NC}"
fi

echo ""
echo -e "${GREEN}>>> Paso 4: Detener servicio anterior (si existe)${NC}"
pm2 stop boston-api 2>/dev/null || echo "No había servicio previo"
pm2 delete boston-api 2>/dev/null || echo "Limpiando..."

echo ""
echo -e "${GREEN}>>> Paso 5: Iniciar backend con PM2${NC}"
pm2 start server-postgres.js --name boston-api
pm2 save
pm2 startup

echo ""
echo -e "${GREEN}>>> Paso 6: Verificar que el backend está corriendo${NC}"
sleep 3
pm2 status

echo ""
echo -e "${GREEN}>>> Paso 7: Ver logs del backend${NC}"
echo -e "${YELLOW}Presiona Ctrl+C para salir de los logs${NC}"
sleep 2
pm2 logs boston-api --lines 50

echo ""
echo "======================================================================"
echo -e "${GREEN}✅ BACKEND DEPLOYADO EXITOSAMENTE${NC}"
echo "======================================================================"
echo ""
echo -e "${YELLOW}VERIFICACIÓN:${NC}"
echo "Probar: curl http://localhost:5000/api/health"
echo "Ver logs: pm2 logs boston-api"
echo "Reiniciar: pm2 restart boston-api"
echo ""
