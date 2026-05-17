# 💾 SISTEMA DE BACKUPS - BOSTON TRACKER

## 📊 DATOS RESPALDADOS

Tu backup actual incluye:
- ✅ **6 usuarios** (admin + deliveries)
- ✅ **16 viajes** completados 
- ✅ **114,177 ubicaciones GPS** registradas
- ✅ **Tamaño**: 3.8MB comprimido (20MB descomprimido)

## 🚀 CÓMO USAR EN NUEVO VPS

### 1️⃣ Clonar proyecto
```bash
git clone https://github.com/Scribax/BostonTracker.git
cd BostonTracker
```

### 2️⃣ Instalar dependencias
```bash
# Instalar Node.js, PostgreSQL, Nginx
./scripts/setup.sh
```

### 3️⃣ Restaurar base de datos
```bash
# Restaurar desde backup
./scripts/restore-database.sh backups/database/boston_tracker_backup_YYYYMMDD_HHMMSS.sql.gz
```

### 4️⃣ Deploy aplicación
```bash
# Deploy completo
./scripts/build-and-deploy.sh
```

## 🔄 BACKUPS AUTOMÁTICOS

### Configurar backup automático:
```bash
./scripts/setup-auto-backup.sh
```

### Crear backup manual:
```bash
./scripts/backup-database.sh
```

### Ver backups disponibles:
```bash
ls -la backups/database/
```

## 📁 UBICACIÓN DE DATOS

- **Backups DB**: `/var/www/boston-tracker/backups/database/`
- **Scripts**: `/var/www/boston-tracker/scripts/`
- **Config**: `/var/www/boston-tracker/backend/.env`

## ⚠️ IMPORTANTE

1. **Siempre sube backups a Git** después de crearlos
2. **Programa backups automáticos** con cron
3. **Verifica los backups** periódicamente
4. **Guarda .env** con configuraciones

## 🆘 RECUPERACIÓN DE EMERGENCIA

Si pierdes el VPS:
1. Nuevo VPS con Ubuntu/Debian
2. `git clone` del repositorio
3. Ejecutar `setup.sh` 
4. Restaurar con `restore-database.sh`
5. ¡Listo! Todos los datos recuperados

---
**Backup creado**: 2025-09-08 18:57:28
**Próximo backup automático**: Configurar con setup-auto-backup.sh
