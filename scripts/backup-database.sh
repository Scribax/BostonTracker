#!/bin/bash

# 💾 SCRIPT DE BACKUP AUTOMÁTICO DE BASE DE DATOS
# Crea backup completo de PostgreSQL con datos de usuarios y viajes

set -e

BACKUP_DIR="/var/www/boston-tracker/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="boston_tracker"
BACKUP_FILE="$BACKUP_DIR/boston_tracker_backup_$DATE.sql"

echo "🚀 Iniciando backup de base de datos..."
echo "📅 Fecha: $(date)"
echo "💾 Archivo: $BACKUP_FILE"

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

# Backup completo con estructura y datos
echo "📊 Creando backup completo..."
sudo -u postgres pg_dump "$DB_NAME" > "$BACKUP_FILE"

# Verificar que el backup se creó correctamente
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup creado exitosamente: $SIZE"
    
    # Comprimir el backup
    echo "🗜️ Comprimiendo backup..."
    gzip "$BACKUP_FILE"
    COMPRESSED_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
    echo "✅ Backup comprimido: $COMPRESSED_SIZE"
    
    # Mostrar estadísticas
    echo ""
    echo "📋 ESTADÍSTICAS DEL BACKUP:"
    sudo -u postgres psql "$DB_NAME" -c "
        SELECT 'Users' as tabla, COUNT(*) as registros FROM \"Users\"
        UNION ALL
        SELECT 'Trips' as tabla, COUNT(*) as registros FROM \"Trips\" 
        UNION ALL
        SELECT 'Locations' as tabla, COUNT(*) as registros FROM \"Locations\";
    " 2>/dev/null || echo "⚠️  No se pudieron obtener estadísticas"
    
    echo ""
    echo "🎉 BACKUP COMPLETADO EXITOSAMENTE"
    echo "📁 Ubicación: $BACKUP_FILE.gz"
    
else
    echo "❌ Error: No se pudo crear el backup"
    exit 1
fi
