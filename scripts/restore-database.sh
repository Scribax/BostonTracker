#!/bin/bash

# 🔄 SCRIPT DE RESTAURACIÓN DE BASE DE DATOS
# Restaura backup completo de PostgreSQL en nuevo VPS

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Debes especificar el archivo de backup"
    echo "💡 Uso: $0 <archivo_backup.sql.gz>"
    echo "📁 Backups disponibles:"
    ls -la /var/www/boston-tracker/backups/database/ 2>/dev/null || echo "   No hay backups disponibles"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="boston_tracker"

echo "🔄 Iniciando restauración de base de datos..."
echo "📅 Fecha: $(date)"
echo "📁 Archivo: $BACKUP_FILE"

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: El archivo $BACKUP_FILE no existe"
    exit 1
fi

# Descomprimir si es necesario
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "🗜️ Descomprimiendo backup..."
    gunzip -c "$BACKUP_FILE" > /tmp/boston_tracker_restore.sql
    SQL_FILE="/tmp/boston_tracker_restore.sql"
else
    SQL_FILE="$BACKUP_FILE"
fi

# Crear base de datos si no existe
echo "🏗️ Preparando base de datos..."
sudo -u postgres createdb "$DB_NAME" 2>/dev/null || echo "ℹ️  Base de datos ya existe"

# Restaurar datos
echo "📊 Restaurando datos..."
sudo -u postgres psql "$DB_NAME" < "$SQL_FILE"

# Limpiar archivo temporal
if [ "$SQL_FILE" = "/tmp/boston_tracker_restore.sql" ]; then
    rm -f "$SQL_FILE"
fi

# Mostrar estadísticas
echo ""
echo "📋 ESTADÍSTICAS POST-RESTAURACIÓN:"
sudo -u postgres psql "$DB_NAME" -c "
    SELECT 'Users' as tabla, COUNT(*) as registros FROM \"Users\"
    UNION ALL
    SELECT 'Trips' as tabla, COUNT(*) as registros FROM \"Trips\" 
    UNION ALL
    SELECT 'Locations' as tabla, COUNT(*) as registros FROM \"Locations\";
"

echo ""
echo "🎉 RESTAURACIÓN COMPLETADA EXITOSAMENTE"
echo "✅ Base de datos $DB_NAME restaurada"
