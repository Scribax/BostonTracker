# ANEXO A: INVENTARIO TÉCNICO DETALLADO
## BOSTON TRACKER - TRANSFERENCIA DE ACTIVOS

---

## 📂 ESTRUCTURA COMPLETA DEL PROYECTO

```
boston-tracker/
├── 📄 README.md                    # Documentación principal
├── 📄 CONTRATO_VENTA_BOSTON_TRACKER.md
├── 📄 ANEXO_INVENTARIO_TECNICO.md
├── 📄 .gitignore
├── 🗄️ backend/                     # API Backend (Node.js)
│   ├── 📄 README.md
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   ├── 🔧 server-postgres.js       # Servidor principal
│   ├── 📁 controllers/
│   │   └── 📄 authController.js
│   ├── 📁 routes/
│   │   └── 📄 auth.js
│   ├── 📁 middleware/
│   │   └── 📄 auth.js
│   └── 🔧 .env                     # Variables de entorno
├── 🌐 frontend/                    # Dashboard Web (React)
│   ├── 📄 README.md
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   ├── 🔧 vite.config.js
│   ├── 📄 index.html
│   ├── 📁 src/
│   │   ├── 📄 App.jsx
│   │   ├── 📄 main.jsx
│   │   ├── 📄 index.css
│   │   ├── 📁 components/
│   │   │   ├── 📄 MapComponent.jsx
│   │   │   ├── 📄 DeliveryTable.jsx
│   │   │   └── 📄 UserManagement.jsx
│   │   ├── 📁 pages/
│   │   │   ├── 📄 Dashboard.jsx
│   │   │   ├── 📄 Login.jsx
│   │   │   └── 📄 Users.jsx
│   │   └── 📁 services/
│   │       ├── 📄 api.js
│   │       ├── 📄 authService.js
│   │       └── 📄 deliveryService.js
│   └── 📁 build/                   # Build de producción
├── 📱 mobile-app/                  # App Móvil (React Native)
│   ├── 📄 README.md
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   ├── 📄 app.json
│   ├── 📄 expo.json
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   ├── 📁 screens/
│   │   ├── 📁 services/
│   │   │   ├── 📄 apiService.js
│   │   │   ├── 📄 socketService.js
│   │   │   └── 📄 locationService.js
│   │   └── 📁 config/
│   │       └── 📄 environment.js
│   └── 📁 android/                 # Proyecto Android nativo
│       └── 📁 app/build/outputs/apk/release/
└── 📱 *.apk                        # APKs compilados
```

---

## 🛠️ DEPENDENCIAS Y TECNOLOGÍAS

### 🗄️ BACKEND (Node.js)
```json
"dependencies": {
  "express": "^4.18.x",
  "socket.io": "^4.7.x", 
  "sequelize": "^6.33.x",
  "pg": "^8.11.x",
  "jsonwebtoken": "^9.0.x",
  "bcryptjs": "^2.4.x",
  "helmet": "^7.0.x",
  "cors": "^2.8.x",
  "express-rate-limit": "^6.10.x",
  "dotenv": "^16.3.x"
}
```

### 🌐 FRONTEND (React)
```json
"dependencies": {
  "react": "^18.2.x",
  "react-dom": "^18.2.x",
  "react-router-dom": "^6.15.x",
  "bootstrap": "^5.3.x",
  "react-bootstrap": "^2.8.x",
  "leaflet": "^1.9.x",
  "react-leaflet": "^4.2.x",
  "axios": "^1.5.x",
  "socket.io-client": "^4.7.x",
  "react-hot-toast": "^2.4.x",
  "date-fns": "^2.30.x"
}
```

### 📱 MOBILE (React Native)
```json
"dependencies": {
  "react-native": "^0.72.x",
  "expo": "^49.x.x",
  "expo-location": "^16.1.x",
  "expo-task-manager": "^11.3.x",
  "expo-notifications": "^0.20.x",
  "axios": "^1.5.x",
  "socket.io-client": "^4.7.x",
  "@react-native-async-storage/async-storage": "^1.19.x"
}
```

---

## 🗄️ BASE DE DATOS POSTGRESQL

### 📊 ESTRUCTURA DE TABLAS

#### Users (Usuarios)
```sql
CREATE TABLE Users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  employeeId VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'delivery') NOT NULL,
  phone VARCHAR(255),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Trips (Viajes)
```sql
CREATE TABLE Trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliveryId UUID NOT NULL REFERENCES Users(id),
  startTime TIMESTAMP NOT NULL,
  endTime TIMESTAMP,
  status ENUM('active', 'completed') DEFAULT 'active',
  mileage FLOAT DEFAULT 0,
  duration INTEGER DEFAULT 0,
  averageSpeed FLOAT DEFAULT 0,
  realTimeMetrics TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Locations (Ubicaciones)
```sql
CREATE TABLE Locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tripId UUID NOT NULL REFERENCES Trips(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy FLOAT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 CREDENCIALES Y CONFIGURACIONES

### 🗄️ BASE DE DATOS
```
Host: localhost
Puerto: 5432
Base de datos: boston_tracker
Usuario: boston_user
Contraseña: [INCLUIDA EN TRANSFERENCIA]
```

### 👥 USUARIOS DEL SISTEMA
```
ADMINISTRADOR:
- Email: admin@bostonburgers.com  
- Contraseña: password123
- Rol: admin

DELIVERY FRANCO:
- ID Empleado: DEL001
- Contraseña: 123456
- Rol: delivery
- Estado: activo

DELIVERY MARÍA:
- ID Empleado: DEL002
- Contraseña: delivery123
- Rol: delivery
- Estado: activo
```

### 🔧 VARIABLES DE ENTORNO
```bash
# Backend (.env)
DB_NAME=boston_tracker
DB_USER=boston_user
DB_PASSWORD=[CONFIDENCIAL]
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=[CONFIDENCIAL]
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=production
```

---

## 🌐 CONFIGURACIÓN DEL SERVIDOR

### 🔧 NGINX CONFIGURATION
```nginx
# /etc/nginx/sites-available/boston-tracker
server {
    listen 80;
    server_name 185.144.157.163;
    root /var/www/boston-tracker/frontend/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /apk/ {
        alias /var/www/html/apk/;
        autoindex on;
        add_header Content-Type application/vnd.android.package-archive;
        add_header Content-Disposition attachment;
    }
}
```

### 🐧 SYSTEMD SERVICES
```ini
# /etc/systemd/system/boston-tracker.service
[Unit]
Description=Boston Tracker Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/boston-tracker/backend
ExecStart=/usr/bin/node server-postgres.js
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 📱 APK Y BUILDS

### 🔧 BUILD CONFIGURATION

#### Android Manifest Permisos
```xml
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.INTERNET"/>

<application android:usesCleartextTraffic="true">
```

#### APKs Disponibles
```
📱 BOSTON-Tracker-v20250902-0807-LOCATION-FIXED.apk
   - Tamaño: ~66MB
   - Estado: ✅ Completamente funcional
   - Permisos: HTTP + Ubicación completos
   - Descarga: http://185.144.157.163/apk/

📱 Versiones anteriores disponibles:
   - BOSTON-Tracker-v20250902-0759-HTTP-FIXED.apk
   - BOSTON-Tracker-v20250902-0741-FINAL.apk
   - BOSTON-Tracker-v20250902-0734-REBUILD.apk
```

---

## 🔌 API ENDPOINTS DOCUMENTADOS

### 🔐 AUTENTICACIÓN
```
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
GET  /api/auth/users         # Solo admin
POST /api/auth/users         # Solo admin  
PUT  /api/auth/users/:id     # Solo admin
DELETE /api/auth/users/:id   # Solo admin
```

### 🚚 DELIVERIES Y TRACKING
```
GET  /api/deliveries              # Admin: todos los activos
GET  /api/deliveries/my-trip      # Delivery: mi viaje activo
POST /api/deliveries/:id/start    # Iniciar viaje
POST /api/deliveries/:id/stop     # Detener viaje
POST /api/deliveries/:id/location # Actualizar ubicación
POST /api/deliveries/:id/metrics  # Métricas tiempo real
```

### 🔍 SISTEMA
```
GET /api/health                   # Health check
```

---

## 📡 WEBSOCKET EVENTS

### 📨 SERVIDOR → CLIENTE
```javascript
// Para Admins
'tripStarted'           // Nuevo viaje iniciado
'tripCompleted'         // Viaje completado  
'locationUpdate'        // Ubicación actualizada
'realTimeMetricsUpdate' // Métricas en tiempo real

// Para Deliveries
'tripStatusChanged'     // Estado de viaje cambió
```

### 📩 CLIENTE → SERVIDOR
```javascript
'join-admin'            // Admin se une al room
'join-delivery'         // Delivery se une a room específico
```

---

## 🧮 ALGORITMOS IMPLEMENTADOS

### 📏 CÁLCULO HAVERSINE (Distancias GPS)
```javascript
function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371.0; // Radio de la Tierra en km
  
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  const lat1Rad = lat1 * (Math.PI / 180);
  const lat2Rad = lat2 * (Math.PI / 180);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
           Math.cos(lat1Rad) * Math.cos(lat2Rad) *
           Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distancia en kilómetros
}
```

---

## 🔒 ASPECTOS DE SEGURIDAD

### 🛡️ MEDIDAS IMPLEMENTADAS
- **JWT Authentication** con expiración configurable
- **bcryptjs** para hash de passwords
- **Helmet.js** para headers de seguridad
- **CORS** configurado específicamente
- **Rate Limiting** por endpoint
- **Input Validation** en todas las rutas
- **SQL Injection** protección via Sequelize ORM

---

## 📋 PROCEDIMIENTOS OPERATIVOS

### 🚀 DEPLOYMENT
```bash
# Backend
cd backend && npm install && node server-postgres.js

# Frontend  
cd frontend && npm install && npm run build

# Mobile
cd mobile-app && npx expo prebuild && cd android && ./gradlew assembleRelease
```

### 🔧 MANTENIMIENTO
```bash
# Restart services
systemctl restart boston-tracker
systemctl reload nginx

# Database backup
pg_dump boston_tracker > backup_$(date +%Y%m%d).sql

# Logs monitoring
tail -f /var/log/nginx/access.log
```

---

**INVENTARIO COMPLETADO:** Septiembre 2025  
**ESTADO:** Todos los activos documentados y funcionales  
**TRANSFERENCIA:** Lista para ejecución inmediata
