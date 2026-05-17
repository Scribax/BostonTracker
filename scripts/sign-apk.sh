#!/bin/bash

# 🍔 BOSTON Tracker - Firma Automática de APK
# ===========================================

echo "🔐 BOSTON Tracker - Firma de APK"
echo "================================"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuración
PROJECT_DIR="$(dirname "$0")"
KEYSTORE_DIR="$PROJECT_DIR/keystore"
KEYSTORE_FILE="$KEYSTORE_DIR/boston-tracker.keystore"
ALIAS="boston-tracker-key"
BUILD_DIR="$PROJECT_DIR/builds"

# Función de logging
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

# Crear keystore si no existe
create_keystore() {
    log "Verificando keystore..."
    
    if [[ -f "$KEYSTORE_FILE" ]]; then
        log "✅ Keystore existente encontrado"
        return 0
    fi
    
    log "Creando nuevo keystore..."
    mkdir -p "$KEYSTORE_DIR"
    
    # Generar keystore automáticamente
    keytool -genkey -v \
        -keystore "$KEYSTORE_FILE" \
        -alias "$ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 25000 \
        -storepass "boston123" \
        -keypass "boston123" \
        -dname "CN=BOSTON American Burgers, OU=Mobile Development, O=Boston Burgers, L=Buenos Aires, S=Buenos Aires, C=AR"
    
    if [[ $? -eq 0 ]]; then
        log "✅ Keystore creado exitosamente"
        
        # Guardar credenciales en archivo seguro
        cat > "$KEYSTORE_DIR/credentials.txt" << EOF
Keystore: $KEYSTORE_FILE
Alias: $ALIAS
Store Password: boston123
Key Password: boston123

¡IMPORTANTE! Guarda estas credenciales de forma segura.
EOF
        chmod 600 "$KEYSTORE_DIR/credentials.txt"
        
    else
        error "No se pudo crear el keystore"
    fi
}

# Firmar APK
sign_apk() {
    local apk_file="$1"
    
    if [[ ! -f "$apk_file" ]]; then
        error "APK no encontrado: $apk_file"
    fi
    
    log "Firmando APK: $(basename "$apk_file")"
    
    # Nombre del APK firmado
    local signed_apk="${apk_file%.apk}-signed.apk"
    
    # Firmar con apksigner (Android SDK)
    if command -v apksigner &> /dev/null; then
        apksigner sign \
            --ks "$KEYSTORE_FILE" \
            --ks-key-alias "$ALIAS" \
            --ks-pass pass:boston123 \
            --key-pass pass:boston123 \
            --out "$signed_apk" \
            "$apk_file"
            
    # Fallback: usar jarsigner
    elif command -v jarsigner &> /dev/null; then
        cp "$apk_file" "$signed_apk"
        jarsigner -verbose \
            -sigalg SHA1withRSA \
            -digestalg SHA1 \
            -keystore "$KEYSTORE_FILE" \
            -storepass boston123 \
            -keypass boston123 \
            "$signed_apk" \
            "$ALIAS"
            
        # Alinear APK
        if command -v zipalign &> /dev/null; then
            local aligned_apk="${signed_apk%.apk}-aligned.apk"
            zipalign -v 4 "$signed_apk" "$aligned_apk"
            mv "$aligned_apk" "$signed_apk"
        fi
    else
        error "No se encontró apksigner ni jarsigner. Instala Android SDK."
    fi
    
    if [[ $? -eq 0 ]]; then
        log "✅ APK firmado: $signed_apk"
        
        # Verificar firma
        if command -v apksigner &> /dev/null; then
            apksigner verify "$signed_apk"
            if [[ $? -eq 0 ]]; then
                log "✅ Firma verificada correctamente"
            else
                warn "⚠️  No se pudo verificar la firma"
            fi
        fi
        
        return 0
    else
        error "No se pudo firmar el APK"
    fi
}

# Función principal
main() {
    echo -e "${BLUE}🔐 Procesando firma de APKs...${NC}"
    
    create_keystore
    
    # Buscar APKs para firmar
    if [[ -n "$1" ]]; then
        # APK específico pasado como argumento
        sign_apk "$1"
    else
        # Buscar APKs en el directorio builds
        if [[ -d "$BUILD_DIR" ]]; then
            local apk_files=$(find "$BUILD_DIR" -name "*.apk" ! -name "*signed*" 2>/dev/null)
            
            if [[ -z "$apk_files" ]]; then
                warn "No se encontraron APKs para firmar en: $BUILD_DIR"
                echo "Uso: $0 [ruta-al-apk]"
                exit 1
            fi
            
            while IFS= read -r apk_file; do
                sign_apk "$apk_file"
            done <<< "$apk_files"
        else
            warn "Directorio builds no encontrado: $BUILD_DIR"
            echo "Uso: $0 [ruta-al-apk]"
            exit 1
        fi
    fi
    
    echo
    echo -e "${GREEN}🎉 Proceso de firma completado${NC}"
    echo -e "${BLUE}📋 Información del keystore:${NC}"
    echo "   • Archivo: $KEYSTORE_FILE"
    echo "   • Alias: $ALIAS"
    echo "   • Credenciales: $KEYSTORE_DIR/credentials.txt"
    echo
    echo -e "${YELLOW}📱 Los APKs firmados están listos para distribución${NC}"
}

# Mostrar ayuda
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "🔐 BOSTON Tracker - Firma de APK"
    echo "==============================="
    echo
    echo "Uso: $0 [opciones] [archivo.apk]"
    echo
    echo "Opciones:"
    echo "  --help, -h     Mostrar esta ayuda"
    echo "  --create-key   Solo crear keystore"
    echo
    echo "Ejemplos:"
    echo "  $0                           # Firmar todos los APKs en builds/"
    echo "  $0 mi-app.apk               # Firmar APK específico"
    echo "  $0 --create-key             # Solo crear keystore"
    echo
    exit 0
fi

# Crear solo keystore
if [[ "$1" == "--create-key" ]]; then
    create_keystore
    echo -e "${GREEN}✅ Keystore creado. Credenciales guardadas en: $KEYSTORE_DIR/credentials.txt${NC}"
    exit 0
fi

# Verificar herramientas necesarias
if ! command -v keytool &> /dev/null; then
    error "keytool no encontrado. Instala Java JDK."
fi

main "$@"
