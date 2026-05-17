# 🍔 BOSTON American Burgers - Tracker System

Sistema integral de seguimiento en tiempo real para deliveries de BOSTON American Burgers.

## 🚀 Inicio Rápido

### 🌐 Dashboard Admin
```
URL: http://185.144.157.163/
Login: admin@bostonburgers.com
Password: password123
```

### 📱 APK Mobile
```
Descarga: http://185.144.157.163/apk/boston-tracker-latest.apk
Login Delivery: DEL001 / delivery123
```

## 📁 Estructura del Proyecto

```
boston-tracker/
├── backend/              # API Node.js + PostgreSQL
├── frontend/             # Dashboard React + Vite
├── mobile-app/           # App React Native + Expo
├── scripts/              # Scripts de automatización
├── marketing/            # Material de marketing
├── documentation/        # Documentación organizada
└── WARP_COMPLETO.md     # 📖 DOCUMENTACIÓN COMPLETA
```

## 🔧 Componentes

- **Backend API**: Node.js + Express + PostgreSQL + Socket.io
- **Frontend**: React 18 + Vite + Bootstrap + Leaflet
- **Mobile**: React Native + Expo + Background Location
- **Base de Datos**: PostgreSQL con 646+ viajes registrados

## 📖 Documentación

### 📋 Documentación Principal
- **[WARP_COMPLETO.md](WARP_COMPLETO.md)** - Documentación completa del sistema

### 📚 Documentación Específica
- **[Técnica](documentation/technical/)** - Detalles técnicos y arquitectura
- **[Deployment](documentation/deployment/)** - Guías de despliegue
- **[Mobile](mobile-app/docs/)** - Documentación de la app móvil
- **[Análisis de Negocio](documentation/business-analysis/)** - Análisis financiero y competencia

## ⚡ Comandos Rápidos

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run build
cp -r build/* /var/www/html/
```

### Mobile
```bash
cd mobile-app
npm install
npm start
```

## 🎯 Estado Actual

- ✅ **Backend**: Operativo en puerto 5000
- ✅ **Frontend**: Deployado en http://185.144.157.163
- ✅ **Mobile**: APK funcional con tracking en background
- ✅ **Database**: 646 viajes completados registrados
- ✅ **Análisis de Negocio**: Proyecciones y análisis de mercado completos

## 🔍 Troubleshooting

### Problemas Comunes
1. **Backend no responde**: Verificar puerto 5000
2. **App no trackea**: Revisar permisos de ubicación Android
3. **Dashboard no actualiza**: Verificar WebSocket connection

### Logs
```bash
# Backend logs
tail -f backend/backend.log

# System logs  
tail -f logs/backup_*.log
```

## 👥 Soporte

- **Sistema**: Completamente operativo y documentado
- **Backup**: Automático diario con rotación
- **Monitoring**: Scripts en directorio `scripts/`
- **Marketing**: Material disponible en `marketing/`

---

**🍔 BOSTON American Burgers - Sistema de Tracking v1.0**
