#!/bin/bash

# Script completo para build y deploy automático de Boston Tracker
# Incluye actualización automática de página de contratos

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 Boston Tracker - Build & Deploy Script${NC}"
echo ""

# Cambiar al directorio de la mobile app
cd /var/www/boston-tracker/mobile-app

echo -e "${BLUE}📱 PASO 1: Preparando build de mobile app...${NC}"
echo ""

# Limpiar cache de Expo
echo -e "${YELLOW}🧹 Limpiando cache...${NC}"
npx expo install --fix

# Verificar versión actual
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
echo -e "${YELLOW}📋 Versión actual: $CURRENT_VERSION${NC}"
echo ""

echo -e "${BLUE}📦 PASO 2: Compilando APK optimizado...${NC}"
echo ""

# Build APK
cd android
./gradlew clean
./gradlew assembleRelease

# Verificar que el build fue exitoso
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ APK compilado exitosamente${NC}"
else
    echo -e "${RED}❌ Error compilando APK${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📁 PASO 3: Copiando APK al directorio de descargas...${NC}"

# Volver al directorio principal
cd /var/www/boston-tracker

# Verificar que el APK existe
APK_PATH="/var/www/boston-tracker/mobile-app/android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}❌ APK no encontrado en $APK_PATH${NC}"
    exit 1
fi

# Obtener timestamp para versión con fecha
TIMESTAMP=$(date '+%Y%m%d-%H%M')

# Copiar APK con versión timestamped
cp "$APK_PATH" "/var/www/boston-tracker/apk/boston-tracker-v$CURRENT_VERSION-$TIMESTAMP.apk"

# Actualizar APK latest
cp "$APK_PATH" "/var/www/boston-tracker/apk/boston-tracker-latest.apk"

echo -e "${GREEN}✅ APK copiado a directorio de descargas${NC}"
echo ""

echo -e "${BLUE}🔄 PASO 4: Actualizando página de contratos automáticamente...${NC}"

# Ejecutar script de auto-update
/var/www/boston-tracker/scripts/update-app-version.sh

echo ""
echo -e "${BLUE}🧪 PASO 5: Verificando deployment...${NC}"

# Verificar que el APK esté disponible vía web
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "http://185.144.157.163/apk/boston-tracker-latest.apk")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ APK disponible vía web${NC}"
else
    echo -e "${RED}❌ APK no disponible vía web (HTTP $HTTP_STATUS)${NC}"
fi

# Verificar página de contratos
CONTRATOS_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "http://185.144.157.163/contratos/")

if [ "$CONTRATOS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Página de contratos disponible${NC}"
else
    echo -e "${RED}❌ Página de contratos no disponible (HTTP $CONTRATOS_STATUS)${NC}"
fi

echo ""
echo -e "${PURPLE}🎉 BUILD Y DEPLOY COMPLETADO${NC}"
echo ""
echo -e "${GREEN}📱 Nueva versión disponible:${NC}"
echo -e "${YELLOW}   Versión: $CURRENT_VERSION${NC}"
echo -e "${YELLOW}   APK: http://185.144.157.163/apk/boston-tracker-latest.apk${NC}"
echo -e "${YELLOW}   Contratos: http://185.144.157.163/contratos/${NC}"
echo -e "${YELLOW}   Dashboard: http://185.144.157.163/${NC}"
echo ""
echo -e "${BLUE}📋 Archivos generados:${NC}"
echo "   • boston-tracker-latest.apk (última versión)"
echo "   • boston-tracker-v$CURRENT_VERSION-$TIMESTAMP.apk (versión timestamped)"
echo ""
echo -e "${GREEN}🎯 ¡Listo para usar!${NC}"
