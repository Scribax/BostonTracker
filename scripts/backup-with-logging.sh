#!/bin/bash

# 📝 BACKUP CON LOGGING DETALLADO
# Backup con logs detallados para monitoreo

set -e

LOG_DIR="/var/www/boston-tracker/logs"
LOG_FILE="$LOG_DIR/backup_$(date +%Y%m).log"
PROJECT_DIR="/var/www/boston-tracker"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# Función para escribir logs con timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 INICIANDO BACKUP AUTOMÁTICO PROGRAMADO"
log "====================================================="

# Cambiar al directorio del proyecto
cd "$PROJECT_DIR"

# Ejecutar backup con upload
if ./scripts/backup-and-upload.sh >> "$LOG_FILE" 2>&1; then
    log "✅ BACKUP COMPLETADO EXITOSAMENTE"
    
    # Mostrar estadísticas en el log
    LATEST_BACKUP=$(ls -t backups/database/*.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
        log "📊 Archivo: $(basename "$LATEST_BACKUP") ($BACKUP_SIZE)"
        
        # Estadísticas de la base de datos
        DB_STATS=$(sudo -u postgres psql boston_tracker -c "
            SELECT 'Users: ' || COUNT(*) FROM \"Users\" 
            UNION ALL 
            SELECT 'Trips: ' || COUNT(*) FROM \"Trips\" 
            UNION ALL 
            SELECT 'Locations: ' || COUNT(*) FROM \"Locations\";
        " -t 2>/dev/null | tr '\n' ' ' || echo "Stats N/A")
        log "📈 Datos: $DB_STATS"
    fi
    
    log "🌐 GitHub: Sincronizado correctamente"
else
    log "❌ ERROR EN BACKUP AUTOMÁTICO"
    log "📧 Se requiere revisión manual"
fi

log "====================================================="
log "🏁 BACKUP AUTOMÁTICO FINALIZADO"
log ""

# Mantener logs por 30 días
find "$LOG_DIR" -name "backup_*.log" -mtime +30 -delete 2>/dev/null || true

# Mostrar resumen del último backup en stdout para cron
echo "🔄 Backup programado ejecutado - $(date '+%d/%m/%Y %H:%M')"
if [ -n "$LATEST_BACKUP" ]; then
    echo "✅ $(basename "$LATEST_BACKUP") creado y subido a GitHub"
fi
