#!/bin/bash

# 🍔 BOSTON Tracker - Build Súper Rápido
# =====================================

echo "🍔 Compilando BOSTON Tracker APK..."

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detectar IP automáticamente
SERVER_IP=$(ip route get 8.8.8.8 | grep -oP 'src \K\S+' 2>/dev/null || hostname -I | awk '{print $1}')

echo -e "${BLUE}🌐 Detectada IP del servidor: $SERVER_IP${NC}"

# Ir al directorio de la app
cd "$(dirname "$0")/mobile-app"

# Instalar EAS CLI si no existe
if ! command -v eas &> /dev/null; then
    echo "📦 Instalando EAS CLI..."
    npm install -g eas-cli
fi

# Actualizar IP en app.json
echo "⚙️  Configurando app con IP: $SERVER_IP"
sed -i "s|\"EXPO_PUBLIC_SERVER_URL\": \".*\"|\"EXPO_PUBLIC_SERVER_URL\": \"http://$SERVER_IP:5000\"|g" app.json

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Build APK (sin credenciales para testing)
echo "🚀 Compilando APK en la nube..."
echo -e "${GREEN}Esto tomará unos minutos... ☕${NC}"

eas build --platform android --profile preview --non-interactive

echo -e "${GREEN}✅ ¡APK compilado! Descárgalo desde tu cuenta de Expo${NC}"
echo "🔗 Ve a: https://expo.dev/accounts/[tu-usuario]/projects/boston-tracker-mobile/builds"
