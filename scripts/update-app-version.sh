#!/bin/bash

# Script para actualizar automáticamente la versión en /contratos/
# Ejecutar cada vez que se compile un nuevo APK

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Boston Tracker - Auto Update Script${NC}"
echo ""

# Función para extraer versión del app.json
get_app_version() {
    local version=$(grep -o '"version": "[^"]*"' /var/www/boston-tracker/mobile-app/app.json | cut -d'"' -f4)
    echo "$version"
}

# Función para extraer versionCode del app.json
get_version_code() {
    local versionCode=$(grep -o '"versionCode": [0-9]*' /var/www/boston-tracker/mobile-app/app.json | cut -d' ' -f2)
    echo "$versionCode"
}

# Función para obtener fecha actual
get_current_date() {
    date '+%d/%m/%Y'
}

# Función para obtener tamaño del APK
get_apk_size() {
    if [ -f "/var/www/boston-tracker/apk/boston-tracker-latest.apk" ]; then
        du -h /var/www/boston-tracker/apk/boston-tracker-latest.apk | cut -f1
    else
        echo "~66M"
    fi
}

# Obtener información actual
APP_VERSION=$(get_app_version)
VERSION_CODE=$(get_version_code)
CURRENT_DATE=$(get_current_date)
APK_SIZE=$(get_apk_size)

echo -e "${YELLOW}📱 Información detectada:${NC}"
echo "   Versión: $APP_VERSION"
echo "   Version Code: $VERSION_CODE"
echo "   Fecha: $CURRENT_DATE"
echo "   Tamaño APK: $APK_SIZE"
echo ""

# Actualizar página de contratos
echo -e "${BLUE}🔄 Actualizando página de contratos...${NC}"

# Crear archivo temporal con las actualizaciones
cp /var/www/boston-tracker/contratos/index.html /tmp/contratos_temp.html

# Actualizar campos dinámicos
sed -i "s|<div class=\"version-number\">Versión [^<]*<|<div class=\"version-number\">Versión $APP_VERSION<|g" /tmp/contratos_temp.html
sed -i "s|🕒 Última actualización: [^<]*|🕒 Última actualización: $CURRENT_DATE - Background GPS Optimizado|g" /tmp/contratos_temp.html
sed -i "s|Descargar APK v[^<]*|Descargar APK v$APP_VERSION|g" /tmp/contratos_temp.html
sed -i "s|<strong>Tamaño:</strong> [^<]*|<strong>Tamaño:</strong> $APK_SIZE|g" /tmp/contratos_temp.html
sed -i "s|console\.log('📱 Página de contratos cargada - v[^']*'|console.log('📱 Página de contratos cargada - v$APP_VERSION'|g" /tmp/contratos_temp.html

# Copiar archivo actualizado
cp /tmp/contratos_temp.html /var/www/boston-tracker/contratos/index.html
rm /tmp/contratos_temp.html

# Actualizar README del APK también
sed -i "s|v[0-9]\+\.[0-9]\+\.[0-9]\+|v$APP_VERSION|g" /var/www/boston-tracker/apk/README.md

echo -e "${GREEN}✅ Página de contratos actualizada con versión $APP_VERSION${NC}"
echo ""

# Verificar que los cambios se aplicaron
echo -e "${BLUE}🔍 Verificando cambios aplicados:${NC}"
if grep -q "Versión $APP_VERSION" /var/www/boston-tracker/contratos/index.html; then
    echo -e "${GREEN}✅ Versión actualizada en página de contratos${NC}"
else
    echo -e "${RED}❌ Error actualizando versión en página de contratos${NC}"
fi

if grep -q "v$APP_VERSION" /var/www/boston-tracker/apk/README.md; then
    echo -e "${GREEN}✅ Versión actualizada en README de APK${NC}"
else
    echo -e "${RED}❌ Error actualizando versión en README de APK${NC}"
fi

echo ""
echo -e "${GREEN}🎯 Actualización automática completada!${NC}"
echo -e "${YELLOW}📄 Página disponible en: http://185.144.157.163/contratos/${NC}"
echo -e "${YELLOW}📱 APK disponible en: http://185.144.157.163/apk/boston-tracker-latest.apk${NC}"
