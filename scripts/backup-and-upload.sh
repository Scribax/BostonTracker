#!/bin/bash

# 🔄 BACKUP AUTOMÁTICO CON UPLOAD A GITHUB
# Crea backup, lo comprime y lo sube automáticamente a GitHub

set -e

BACKUP_DIR="/var/www/boston-tracker/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/var/www/boston-tracker"

echo "🚀 Iniciando backup automático con upload a GitHub..."
echo "📅 Fecha: $(date)"

# Cambiar al directorio del proyecto
cd "$PROJECT_DIR"

# 1. Crear backup de base de datos
echo "💾 Creando backup de base de datos..."
./scripts/backup-database.sh

# 2. Obtener el archivo de backup más reciente
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.gz 2>/dev/null | head -1)

if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
    echo "✅ Backup creado: $(basename "$LATEST_BACKUP") ($BACKUP_SIZE)"
    
    # 3. Agregar archivos a Git
    echo "📤 Subiendo backup a GitHub..."
    git add backups/database/
    
    # 4. Commit con información detallada
    COMMIT_MSG="🔄 Backup automático $(date '+%Y-%m-%d %H:%M')

📊 Backup: $(basename "$LATEST_BACKUP")
💾 Tamaño: $BACKUP_SIZE
📅 Fecha: $(date '+%d/%m/%Y %H:%M:%S')

$(sudo -u postgres psql boston_tracker -c "SELECT 'Users: ' || COUNT(*) FROM \"Users\" UNION ALL SELECT 'Trips: ' || COUNT(*) FROM \"Trips\" UNION ALL SELECT 'Locations: ' || COUNT(*) FROM \"Locations\";" -t 2>/dev/null | tr '\n' ' ' || echo "Stats N/A")"

    git commit -m "$COMMIT_MSG" || echo "ℹ️  No hay cambios para commitear"
    
    # 5. Push a GitHub
    git push origin main && echo "✅ Backup subido exitosamente a GitHub" || echo "⚠️  Error al subir a GitHub"
    
    # 6. Limpiar backups antiguos (mantener últimos 7 días)
    echo "🧹 Limpiando backups antiguos..."
    find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete 2>/dev/null || true
    
    echo ""
    echo "🎉 BACKUP AUTOMÁTICO COMPLETADO"
    echo "📁 Local: $LATEST_BACKUP"
    echo "🌐 GitHub: https://github.com/Scribax/BostonTracker"
    echo "🗑️  Archivos antiguos (+7 días) eliminados"
    
else
    echo "❌ Error: No se pudo crear el backup"
    exit 1
fi
