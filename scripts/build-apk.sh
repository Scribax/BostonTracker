#!/bin/bash

# 🍔 BOSTON Tracker - Script de Build Automático para APK
# =====================================================

echo "🍔 BOSTON Tracker - Compilación Automática de APK"
echo "================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_DIR="/home/Franco/Desktop/Proyecto/Boston Tracker"
MOBILE_DIR="$PROJECT_DIR/mobile-app"
BUILD_DIR="$PROJECT_DIR/builds"
APP_NAME="BOSTON-Tracker"
VERSION="1.0.0"

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Verificar prerequisitos
check_prerequisites() {
    log "Verificando prerequisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js no está instalado. Por favor instala Node.js 18+"
    fi
    
    # Verificar Expo CLI
    if ! command -v expo &> /dev/null; then
        log "Instalando Expo CLI..."
        npm install -g @expo/cli
    fi
    
    # Verificar EAS CLI
    if ! command -v eas &> /dev/null; then
        log "Instalando EAS CLI..."
        npm install -g eas-cli
    fi
    
    log "✅ Todos los prerequisitos están instalados"
}

# Detectar IP del servidor automáticamente
detect_server_ip() {
    log "Detectando IP del servidor..."
    
    # Intentar múltiples métodos para detectar IP
    SERVER_IP=""
    
    # Método 1: ip route (Linux)
    if command -v ip &> /dev/null; then
        SERVER_IP=$(ip route get 8.8.8.8 | grep -oP 'src \K\S+')
    fi
    
    # Método 2: hostname -I (Linux)
    if [[ -z "$SERVER_IP" ]] && command -v hostname &> /dev/null; then
        SERVER_IP=$(hostname -I | awk '{print $1}')
    fi
    
    # Método 3: ifconfig (macOS/Linux)
    if [[ -z "$SERVER_IP" ]] && command -v ifconfig &> /dev/null; then
        SERVER_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    fi
    
    # Fallback: preguntar al usuario
    if [[ -z "$SERVER_IP" ]]; then
        echo -e "${YELLOW}No se pudo detectar automáticamente la IP del servidor.${NC}"
        read -p "Por favor ingresa la IP del servidor: " SERVER_IP
    fi
    
    log "🌐 IP del servidor detectada: $SERVER_IP"
    
    # Validar formato IP
    if [[ ! $SERVER_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        error "IP inválida: $SERVER_IP"
    fi
}

# Actualizar configuración de la app
update_app_config() {
    log "Actualizando configuración de la app..."
    
    cd "$MOBILE_DIR" || error "No se pudo acceder al directorio mobile-app"
    
    # Crear backup del app.json original
    if [[ ! -f "app.json.backup" ]]; then
        cp app.json app.json.backup
        log "✅ Backup de app.json creado"
    fi
    
    # Actualizar app.json con la nueva IP
    cat > app.json << EOF
{
  "expo": {
    "name": "BOSTON Tracker",
    "slug": "boston-tracker-mobile",
    "version": "$VERSION",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#dc3545"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.bostonburgers.tracker",
      "infoPlist": {
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Esta app necesita acceso a tu ubicación para calcular distancias precisas durante tus entregas.",
        "NSLocationWhenInUseUsageDescription": "Esta app necesita acceso a tu ubicación para calcular distancias precisas durante tus entregas.",
        "NSLocationAlwaysUsageDescription": "Esta app necesita acceso a tu ubicación en segundo plano para calcular distancias precisas durante tus entregas.",
        "UIBackgroundModes": [
          "location",
          "background-fetch"
        ]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#dc3545"
      },
      "package": "com.bostonburgers.tracker",
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Esta app necesita acceso a tu ubicación para calcular distancias precisas durante tus entregas.",
          "locationAlwaysPermission": "Esta app necesita acceso a tu ubicación en segundo plano para calcular distancias precisas durante tus entregas.",
          "locationWhenInUsePermission": "Esta app necesita acceso a tu ubicación para calcular distancias precisas durante tus entregas."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#dc3545"
        }
      ],
      "expo-font"
    ],
    "extra": {
      "EXPO_PUBLIC_API_URL": "http://$SERVER_IP:5000/api",
      "EXPO_PUBLIC_SOCKET_URL": "http://$SERVER_IP:5000",
      "EXPO_PUBLIC_TRACKING_INTERVAL": "2000",
      "EXPO_PUBLIC_HIGH_FREQUENCY_MODE": "false",
      "EXPO_PUBLIC_MIN_DISTANCE_FILTER": "5",
      "EXPO_PUBLIC_USE_LEGACY_LOCATION_API": "false",
      "EXPO_PUBLIC_DEBUG_MODE": "false"
    },
    "build": {
      "production": {}
    }
  }
}
EOF
    
    log "✅ Configuración actualizada con IP: $SERVER_IP"
}

# Instalar dependencias
install_dependencies() {
    log "Instalando dependencias..."
    
    cd "$MOBILE_DIR" || error "No se pudo acceder al directorio mobile-app"
    
    # Limpiar cache
    npm cache clean --force
    rm -rf node_modules package-lock.json
    
    # Instalar dependencias
    npm install
    
    log "✅ Dependencias instaladas"
}

# Build APK con Expo
build_apk() {
    log "Iniciando compilación del APK..."
    
    cd "$MOBILE_DIR" || error "No se pudo acceder al directorio mobile-app"
    
    # Crear directorio de builds
    mkdir -p "$BUILD_DIR"
    
    # Configurar EAS (si no está configurado)
    if [[ ! -f "eas.json" ]]; then
        log "Configurando EAS Build..."
        cat > eas.json << EOF
{
  "cli": {
    "version": ">= 13.2.3"
  },
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
EOF
    fi
    
    echo -e "${BLUE}Selecciona el método de compilación:${NC}"
    echo "1) EAS Build (Recomendado - Compilación en la nube)"
    echo "2) Expo Build Local (Requiere Android SDK)"
    echo "3) Crear solo el bundle JS"
    read -p "Opción [1-3]: " BUILD_METHOD
    
    case $BUILD_METHOD in
        1)
            build_with_eas
            ;;
        2)
            build_local
            ;;
        3)
            build_bundle_only
            ;;
        *)
            build_with_eas
            ;;
    esac
}

# Build con EAS (Recomendado)
build_with_eas() {
    log "🚀 Compilando APK con EAS Build..."
    
    # Login a Expo (si es necesario)
    if ! eas whoami &> /dev/null; then
        warn "Necesitas hacer login a Expo para usar EAS Build"
        echo "Puedes crear una cuenta gratuita en https://expo.dev"
        eas login
    fi
    
    # Inicializar EAS si es necesario
    if ! eas build:list &> /dev/null; then
        log "Inicializando proyecto en EAS..."
        eas build:configure
    fi
    
    # Compilar APK
    log "Iniciando build en la nube..."
    eas build --platform android --profile preview --local
    
    # Mover APK al directorio de builds
    if [[ -f "*.apk" ]]; then
        mv *.apk "$BUILD_DIR/${APP_NAME}-v${VERSION}-$(date +%Y%m%d_%H%M%S).apk"
        log "✅ APK compilado exitosamente en: $BUILD_DIR"
    fi
}

# Build local (requiere Android SDK)
build_local() {
    log "🔨 Compilando APK localmente..."
    warn "Este método requiere Android SDK y herramientas de desarrollo instaladas"
    
    # Verificar que expo build esté disponible
    if ! expo build:android --help &> /dev/null; then
        error "Comando 'expo build' no disponible. Usa EAS Build en su lugar."
    fi
    
    # Build APK local
    expo build:android --type apk --clear-cache
    
    log "El APK se descargará automáticamente cuando esté listo"
}

# Solo crear bundle JS
build_bundle_only() {
    log "📦 Creando bundle JavaScript..."
    
    # Crear bundle
    expo export --platform android --output-dir "$BUILD_DIR/bundle-$(date +%Y%m%d_%H%M%S)"
    
    log "✅ Bundle creado en: $BUILD_DIR"
    log "Nota: Para crear APK completa, usa las opciones 1 o 2"
}

# Función principal
main() {
    echo
    log "Iniciando proceso de compilación..."
    
    check_prerequisites
    detect_server_ip
    update_app_config
    install_dependencies
    build_apk
    
    echo
    echo -e "${GREEN}🎉 ¡Compilación completada!${NC}"
    echo -e "${BLUE}📱 Información del build:${NC}"
    echo "   • Nombre: $APP_NAME"
    echo "   • Versión: $VERSION"
    echo "   • Servidor: http://$SERVER_IP:5000"
    echo "   • Directorio: $BUILD_DIR"
    echo
    echo -e "${YELLOW}📋 Próximos pasos:${NC}"
    echo "   1. El APK estará disponible en el directorio 'builds'"
    echo "   2. Transfiere el APK al dispositivo Android"
    echo "   3. Habilita 'Instalación desde fuentes desconocidas'"
    echo "   4. Instala el APK"
    echo
}

# Verificar argumentos
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "🍔 BOSTON Tracker - Script de Build Automático"
    echo "============================================="
    echo
    echo "Uso: $0 [opciones]"
    echo
    echo "Opciones:"
    echo "  --help, -h     Mostrar esta ayuda"
    echo "  --ip IP        Especificar IP del servidor manualmente"
    echo
    echo "Ejemplos:"
    echo "  $0                    # Build automático con detección de IP"
    echo "  $0 --ip 192.168.1.100 # Build con IP específica"
    echo
    exit 0
fi

# Verificar si se especificó IP manualmente
if [[ "$1" == "--ip" ]] && [[ -n "$2" ]]; then
    SERVER_IP="$2"
    main_without_ip_detection() {
        log "Iniciando proceso de compilación con IP específica..."
        check_prerequisites
        update_app_config
        install_dependencies
        build_apk
        
        echo
        echo -e "${GREEN}🎉 ¡Compilación completada!${NC}"
        echo -e "${BLUE}📱 Información del build:${NC}"
        echo "   • Nombre: $APP_NAME"
        echo "   • Versión: $VERSION"
        echo "   • Servidor: http://$SERVER_IP:5000"
        echo "   • Directorio: $BUILD_DIR"
    }
    main_without_ip_detection
else
    main
fi
