#!/bin/bash

# 🕐 CONFIGURAR BACKUP AUTOMÁTICO DIARIO
# Programa cron para backup automático cada día a las 3 AM

echo "⏰ Configurando backup automático diario..."

# Agregar tarea cron para backup diario
(crontab -l 2>/dev/null; echo "0 3 * * * /var/www/boston-tracker/scripts/backup-database.sh") | crontab -

# Backup semanal (domingos a las 2 AM) 
(crontab -l 2>/dev/null; echo "0 2 * * 0 /var/www/boston-tracker/scripts/backup-database.sh") | crontab -

echo "✅ Backup automático configurado:"
echo "   📅 Diario a las 3:00 AM"
echo "   📅 Semanal domingos 2:00 AM"
echo ""
echo "📋 Tareas cron actuales:"
crontab -l

echo ""
echo "💡 Para desactivar: crontab -e"
