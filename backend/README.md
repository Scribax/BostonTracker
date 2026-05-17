# 🖥️ Boston Tracker - Backend API

API REST robusta construida con Node.js, Express y PostgreSQL para el sistema de seguimiento de deliveries de Boston American Burgers.

## 🌟 Características

- ⚡ **API REST completa** con todos los endpoints necesarios
- 🗄️ **PostgreSQL** como base de datos principal con Sequelize ORM
- 🔐 **Autenticación JWT** para seguridad
- 🔄 **WebSocket/Socket.io** para comunicación en tiempo real
- 📊 **Métricas y analytics** de viajes y deliveries
- 🎯 **Validaciones robustas** en todos los endpoints
- ✅ **Gestión completa de viajes** con detalles y eliminación

## 🚀 Nuevos Endpoints Agregados

### 🆕 Endpoints de Detalles de Viaje

#### `GET /api/trips/details/:id`
Obtiene detalles completos de un viaje específico incluyendo:
- Información completa del delivery (nombre, email, employeeId)
- Métricas del viaje (distancia, tiempo, velocidad promedio)
- Todas las ubicaciones GPS del recorrido
- Timestamps detallados

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid",
    "deliveryId": "delivery-uuid",
    "deliveryInfo": {
      "id": "delivery-uuid",
      "name": "Franco Demartos",
      "employeeId": "DEL003",
      "email": "franco@example.com"
    },
    "startTime": "2025-09-03T00:20:15.698Z",
    "endTime": "2025-09-03T00:45:22.156Z",
    "metrics": {
      "totalKm": 5.2,
      "totalTime": 25,
      "avgSpeed": 12.48,
      "totalLocations": 156
    },
    "status": "completed",
    "locations": [
      {
        "id": "location-uuid",
        "latitude": -34.6197775,
        "longitude": -68.3204075,
        "timestamp": "2025-09-03T00:20:16.133Z",
        "accuracy": 5.0
      }
      // ... más ubicaciones
    ]
  }
}
```

#### `DELETE /api/trips/details/:id`
Elimina un viaje específico de la base de datos.

**Validaciones:**
- ✅ Usuario debe ser administrador
- ✅ Viaje debe existir
- ✅ Solo se pueden eliminar viajes completados

**Respuesta:**
```json
{
  "success": true,
  "message": "Viaje eliminado exitosamente"
}
```

## 📋 API Endpoints Completos

### 🔐 Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Información del usuario actual
- `GET /api/auth/users` - Listar usuarios (solo admin)
- `POST /api/auth/register` - Registrar nuevo usuario (solo admin)

### 🚗 Gestión de Viajes
- `GET /api/trips/history` - Historial de viajes con paginación
- `GET /api/trips/details/:id` - **[NUEVO]** Detalles completos de viaje
- `DELETE /api/trips/details/:id` - **[NUEVO]** Eliminar viaje específico
- `POST /api/trips/start` - Iniciar nuevo viaje
- `POST /api/trips/end` - Finalizar viaje activo
- `GET /api/trips/active` - Obtener viajes activos

### 🚚 Gestión de Deliveries
- `GET /api/deliveries` - Listar deliveries activos
- `GET /api/deliveries/:id` - Información específica de delivery
- `GET /api/deliveries/:id/history` - Historial de viajes de delivery
- `POST /api/deliveries` - Crear nuevo delivery (solo admin)

### 📍 Ubicaciones GPS
- `POST /api/location` - Registrar nueva ubicación GPS
- `GET /api/deliveries/:id/locations` - Ubicaciones de un delivery específico
- `GET /api/trips/:id/locations` - Ubicaciones de un viaje específico

### 📱 Gestión de APK
- `GET /api/apk/info` - Información del APK actual
- `POST /api/apk/send-whatsapp` - Generar mensaje WhatsApp con link del APK

## 🗄️ Modelos de Base de Datos

### Users (Usuarios)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  employee_id VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Trips (Viajes)
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  delivery_id UUID REFERENCES users(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  total_km DECIMAL(10,3),
  total_time INTEGER,
  avg_speed DECIMAL(10,3),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Locations (Ubicaciones)
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  accuracy DECIMAL(10,3),
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Configuración del Servidor

### Variables de Entorno
```bash
# Servidor
SERVER_IP=185.144.157.163
SERVER_PORT=5000

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boston_tracker
DB_USER=boston_user
DB_PASSWORD=boston123

# Seguridad JWT
JWT_SECRET=boston_tracker_super_secret_key_production_2024
JWT_EXPIRE=7d

# URLs del sistema
FRONTEND_URL=http://185.144.157.163
BACKEND_URL=http://185.144.157.163:5000

# Configuración inicial
RESET_DATABASE=false
COMPANY_NAME=Boston Burgers
COMPANY_DOMAIN=bostonburgers.com
```

### Inicialización Automática
El servidor incluye scripts de inicialización que:
- ✅ Crean las tablas de base de datos automáticamente
- ✅ Insertan usuarios por defecto si no existen
- ✅ Configuran índices para mejor performance
- ✅ Validan la conexión a la base de datos

## 🚀 Instalación y Ejecución

### 1. Instalación de dependencias
```bash
cd backend
npm install
```

### 2. Configuración
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 3. Base de datos
```bash
# Crear base de datos PostgreSQL
createdb boston_tracker

# El servidor creará las tablas automáticamente al iniciar
```

### 4. Ejecutar servidor
```bash
# Desarrollo
npm run dev

# Producción
node server-postgres.js

# Con logs
nohup node server-postgres.js > backend.log 2>&1 &
```

## 🔄 WebSocket Events

### Eventos para Admins
- `trip-started` - Nuevo viaje iniciado
- `trip-ended` - Viaje finalizado
- `location-update` - Actualización de ubicación en tiempo real

### Eventos para Deliveries
- `location-request` - Solicitud de ubicación GPS
- `trip-status` - Estado del viaje actual

## 🛡️ Seguridad y Validaciones

### Autenticación
- ✅ Tokens JWT con expiración configurable
- ✅ Middleware de autenticación en todas las rutas protegidas
- ✅ Validación de roles (admin/delivery)

### Validaciones de Datos
- ✅ Validación de coordenadas GPS
- ✅ Verificación de IDs de viaje válidos
- ✅ Timestamps correctos
- ✅ Estados de viaje válidos

### Rate Limiting
- ✅ Límites en endpoints de ubicación
- ✅ Protección contra spam de requests
- ✅ Timeouts configurables

## 📊 Métricas y Analytics

### Cálculos Automáticos
- **Distancia total**: Calculada usando fórmula de Haversine
- **Tiempo de viaje**: Diferencia entre start_time y end_time
- **Velocidad promedio**: Distancia/Tiempo con validaciones
- **Número de ubicaciones**: Conteo de puntos GPS registrados

### Optimizaciones
- ✅ Consultas SQL optimizadas con índices
- ✅ Paginación en endpoints de historial
- ✅ Cache de cálculos pesados
- ✅ Lazy loading de datos relacionados

## 🧪 Testing y Debugging

### Endpoints de Verificación
```bash
# Verificar estado del servidor
curl http://localhost:5000/api/health

# Login de prueba
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bostonburgers.com", "password": "password123"}'
```

### Logs del Servidor
```bash
# Logs en tiempo real
tail -f backend.log

# Logs específicos de errores
grep "ERROR" backend.log
```

## 🔧 Dependencias Principales

```json
{
  "express": "^4.18.2",
  "sequelize": "^6.32.1",
  "pg": "^8.11.1",
  "socket.io": "^4.7.2",
  "jsonwebtoken": "^9.0.1",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "uuid": "^9.0.0"
}
```

## 📄 Changelog

### v2.1.0 (2025-09-03)
- ✨ Agregado endpoint `GET /api/trips/details/:id`
- ✨ Agregado endpoint `DELETE /api/trips/details/:id`
- 🐛 Corregidos conflictos de rutas entre endpoints
- 🔧 Mejorada información de delivery en respuestas
- 📊 Agregadas métricas completas en detalles de viaje

### v2.0.0 (2025-09-02)
- 🚀 Migración completa a PostgreSQL
- ⚡ Optimizaciones de rendimiento
- 🔐 Mejoras de seguridad
- 📱 Soporte completo para app móvil

---

**Backend desarrollado para Boston American Burgers** 🍔
