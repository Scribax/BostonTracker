# 🍔 BOSTON TRACKER - DOCUMENTACIÓN COMPLETA DEL PROYECTO

## 📋 VISIÓN GENERAL DEL SISTEMA

El proyecto **BOSTON Tracker** es un sistema integral de seguimiento en tiempo real para los deliveries de BOSTON American Burgers. El sistema consta de tres componentes principales interconectados:

1. **Backend (API/Servidor)**: Servicio Node.js que maneja datos, autenticación y comunicación en tiempo real.
2. **Frontend (Dashboard Web)**: Interfaz administrativa para monitoreo y gestión en tiempo real.
3. **Aplicación Móvil**: App Android para deliveries que envía ubicaciones GPS.

### 🎯 Propósito y Funcionalidades Clave

- **Tracking GPS en Tiempo Real**: Seguimiento preciso de deliveries con ubicaciones en vivo.
- **Monitoreo de Entregas**: Visualización en mapa interactivo con rutas e historiales.
- **Gestión de Usuarios**: Administración de deliveries y permisos.
- **Historial y Análisis**: Registros completos de viajes y métricas de rendimiento.
- **Comunicación Segura**: Intercambio de datos encriptado y autenticado.

### 🌐 Arquitectura General

```
+---------------------+        +---------------------+        +---------------------+
|                     |        |                     |        |                     |
|   APLICACIÓN MÓVIL  |<------>|  BACKEND / API      |<------>|  FRONTEND / ADMIN   |
|   (React Native)    |  HTTP  |  (Node.js/Express)  |  HTTP  |  (React)            |
|                     |  WS    |                     |  WS    |                     |
+---------------------+        +---------------------+        +---------------------+
                                        |
                                        v
                               +--------------------+
                               |                    |
                               |  BASE DE DATOS     |
                               |  (PostgreSQL)      |
                               |                    |
                               +--------------------+
```

---

## 🔧 COMPONENTES DEL SISTEMA

### 📱 Aplicación Móvil (React Native/Expo)

#### Tecnologías:
- **Framework**: React Native + Expo
- **Navegación**: React Navigation 6
- **Almacenamiento**: AsyncStorage
- **HTTP**: Axios
- **WebSockets**: Socket.io Client
- **Geolocalización**: Expo Location + Task Manager
- **Autenticación**: JWT Tokens
- **UI/UX**: Componentes nativos + vectores

#### Características clave:
- **Tracking en Background**: Funcionamiento continuo incluso con pantalla apagada
- **Monitoreo de Batería**: Optimización según nivel de batería
- **Sincronización Offline**: Buffer local y sincronización inteligente
- **Gestión de Permisos**: Manejo de permisos de ubicación en Android
- **Métricas en Tiempo Real**: Velocidad, distancia, duración del viaje
- **Resistencia a Desconexiones**: Estrategias para reconexión automática

#### Estructura de Archivos:
```
mobile-app/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── contexts/         # Contextos de React (Auth, Location, Connectivity)
│   ├── screens/          # Pantallas principales (Login, Home)
│   ├── services/         # Servicios (API, Socket, Location, Sync)
│   ├── utils/            # Utilidades y helpers
│   └── config/           # Configuraciones
├── assets/               # Imágenes, fuentes, recursos
├── App.js                # Punto de entrada
└── app.json              # Configuración Expo
```

#### Servicios principales:
- **advancedLocationService.js**: Sistema avanzado de tracking GPS
- **locationService.js**: Servicio de ubicación estándar
- **apiService.js**: Cliente HTTP para conexión con backend
- **socketService.js**: Cliente WebSocket para datos en tiempo real
- **disconnectionService.js**: Manejo de desconexiones y reconexiones
- **syncService.js**: Sincronización de datos offline

### 🖥️ Backend (Node.js/Express)

#### Tecnologías:
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL (Sequelize)
- **Autenticación**: JWT (jsonwebtoken)
- **Tiempo Real**: Socket.io
- **Seguridad**: Helmet, CORS, Rate Limiting
- **Encriptación**: bcryptjs

#### Características clave:
- **API RESTful**: Endpoints documentados para todas las operaciones
- **WebSockets**: Comunicación bidireccional en tiempo real
- **Autenticación Segura**: JWT con roles (admin/delivery)
- **Validaciones Robustas**: Verificación de datos de entrada
- **Logging Estructurado**: Registro de eventos y errores
- **Protección CSRF/XSS**: Medidas de seguridad implementadas
- **Rate Limiting**: Protección contra abusos

#### Estructura de Archivos:
```
backend/
├── controllers/          # Controladores para cada entidad
├── middleware/           # Middlewares (auth, validation, etc)
├── models/               # Modelos de datos (User, DeliveryTrip)
├── routes/               # Definición de rutas API
├── utils/                # Funciones auxiliares
├── server-postgres.js    # Punto de entrada principal
└── .env                  # Variables de entorno (no en VCS)
```

#### Endpoints API principales:
- **auth/**: Login, logout, verificación
- **deliveries/**: Gestión de entregas activas
- **trips/**: Historial y detalles de viajes
- **users/**: CRUD de usuarios
- **apk/**: Gestión de instaladores Android

### 🌐 Frontend Web (React/Vite)

#### Tecnologías:
- **Framework**: React 18
- **Build Tool**: Vite
- **State Management**: Context API + useReducer
- **Routing**: React Router DOM 6
- **HTTP**: Axios
- **UI Framework**: Bootstrap 5
- **Mapas**: Leaflet + React Leaflet
- **Notificaciones**: React Hot Toast
- **WebSockets**: Socket.io Client

#### Características clave:
- **Mapa Interactivo**: Visualización en tiempo real de deliveries
- **Dashboard Administrativo**: Control total del sistema
- **Historial de Viajes**: Consulta y filtrado de entregas pasadas
- **Gestión de Usuarios**: CRUD completo de usuarios y permisos
- **Distribución de APK**: Envío via WhatsApp de instaladores
- **Métricas y Estadísticas**: Análisis de rendimiento y eficiencia

#### Estructura de Archivos:
```
frontend/
├── src/
│   ├── components/       # Componentes UI
│   ├── context/          # Contextos (Auth)
│   ├── services/         # Servicios API
│   ├── styles/           # CSS y estilos
│   ├── config/           # Configuraciones
│   ├── App.jsx           # Componente principal
│   └── main.jsx          # Punto de entrada
├── public/               # Recursos estáticos
└── index.html            # Template HTML base
```

#### Componentes principales:
- **Dashboard.jsx**: Panel principal con tabs
- **MapComponent.jsx**: Mapa interactivo con Leaflet
- **DeliveryList.jsx**: Lista de entregas activas
- **TripHistory.jsx**: Historial de viajes completados
- **UserManagement.jsx**: Gestión de usuarios
- **APKManager.jsx**: Distribución de aplicación móvil

### 🗄️ Base de Datos (PostgreSQL)

#### Tecnologías:
- **Sistema**: PostgreSQL 14+
- **ORM**: Sequelize
- **Indices**: Optimizados para geolocalización

#### Tablas Principales:
- **Users**: Administradores y deliveries
- **Trips**: Viajes/entregas realizados
- **Locations**: Puntos GPS registrados

#### Relaciones:
- **User 1:N Trips**: Un usuario puede tener múltiples viajes
- **Trip 1:N Locations**: Un viaje tiene múltiples ubicaciones

---

## 🚀 FLUJOS DE TRABAJO CLAVE

### 📍 Tracking en Tiempo Real

1. **Inicio de Sesión Delivery**
   - Delivery ingresa credenciales en app móvil
   - Backend valida y emite token JWT
   - App almacena token para futuras solicitudes

2. **Inicio de Viaje**
   - Delivery toca "Iniciar Viaje" en app
   - App solicita permisos de ubicación avanzados
   - Backend crea registro de viaje activo
   - Se inicia servicio de ubicación en background

3. **Transmisión de Ubicaciones**
   - App captura ubicación GPS cada 5-30 segundos
   - Datos se envían al backend via API REST
   - En caso de desconexión, ubicaciones se almacenan localmente
   - Al recuperar conexión, se sincronizan datos almacenados

4. **Visualización en Dashboard**
   - Admin ve ubicaciones en tiempo real en mapa
   - Iconos se actualizan automáticamente con nombre del delivery
   - Se dibuja ruta del recorrido realizado
   - Socket.io notifica cambios sin necesidad de refresh

5. **Finalización de Viaje**
   - Delivery toca "Finalizar Viaje" en app
   - Backend cierra registro y calcula métricas finales
   - Viaje pasa a historial con estadísticas completas
   - Se detiene servicio de ubicación en background

### 👤 Gestión de Usuarios

1. **Creación de Usuario**
   - Admin ingresa datos del nuevo usuario en dashboard
   - Backend valida información y encripta contraseña
   - Se asigna rol (admin/delivery) con permisos correspondientes
   - Se genera credencial única para delivery (DELxxx)

2. **Distribución de Aplicación**
   - Admin accede a "Gestión APK" en dashboard
   - Selecciona delivery o ingresa número manualmente
   - Sistema genera mensaje WhatsApp con link de descarga
   - Delivery instala aplicación desde enlace recibido

3. **Inicio de Sesión y Verificación**
   - Delivery inicia sesión con credenciales asignadas
   - Sistema valida permisos y activa funcionalidades correspondientes
   - Dashboard muestra estado "En línea" del nuevo delivery

### 📊 Análisis de Datos

1. **Registro de Métricas**
   - Sistema captura datos en tiempo real: ubicaciones, velocidad, tiempos
   - Se calculan métricas derivadas: distancia, tiempo total, velocidad promedio
   - Datos se almacenan en base de datos relacional

2. **Visualización de Históricos**
   - Admin accede a "Historial de Viajes" en dashboard
   - Interfaz muestra tabla filtrable/ordenable con todos los viajes
   - Se visualizan métricas agregadas y tendencias

3. **Exportación y Reportes**
   - Sistema permite visualizar detalles completos de cada viaje
   - Rutas históricas se pueden visualizar en mapa
   - Datos disponibles para análisis posterior

---

## 🔐 SEGURIDAD Y AUTENTICACIÓN

### Modelo de Autenticación

- **JWT (JSON Web Tokens)** para autenticación stateless
- **Roles diferenciados**: admin/delivery con permisos específicos
- **Almacenamiento seguro**: LocalStorage (web) y AsyncStorage (móvil)
- **Encriptación**: bcrypt para hashing de contraseñas
- **Expiración**: Tokens con tiempo limitado de validez

### Mecanismos de Protección

- **HTTPS**: Comunicación encriptada en producción
- **CORS**: Restricciones de origen configuradas
- **Helmet**: Headers HTTP de seguridad
- **Rate Limiting**: Protección contra abusos de API
- **Validación de Datos**: Sanitización de inputs
- **XSS Protection**: Prevención de inyección de scripts
- **Protección CSRF**: Tokens y medidas anti-forgery

---

## 📡 COMUNICACIÓN EN TIEMPO REAL

### WebSockets (Socket.io)

- **Canales**: Separación lógica por funcionalidad
- **Namespaces**: admin/delivery para separación de responsabilidades
- **Eventos**: Protocolo bien definido para actualizaciones
- **Heartbeats**: Detección automática de desconexiones
- **Reconexión**: Estrategias robustas para mantener servicio

### Eventos Principales

- **location-update**: Actualización de ubicación de delivery
- **trip-status-changed**: Cambio en estado de viaje (inicio/fin)
- **new-delivery**: Notificación de nueva entrega asignada
- **user-status-changed**: Cambio en estado de conexión de usuario

---

## 🔄 SINCRONIZACIÓN Y RESILIENCIA

### Estrategias Offline-First

- **Buffer Local**: Almacenamiento temporal de ubicaciones sin conexión
- **Sincronización Inteligente**: Envío automático al recuperar conexión
- **Priorización de Datos**: Estrategia para enviar datos más relevantes primero
- **Compresión**: Reducción de payload para conexiones lentas
- **Timestamps**: Control de secuencia para ordenar datos correctamente

### Manejo de Errores

- **Retry Mechanisms**: Reintentos automáticos con backoff exponencial
- **Circuit Breaker**: Prevención de sobrecarga en caso de fallos recurrentes
- **Logging**: Registro detallado de errores para análisis
- **Alertas**: Notificaciones para errores críticos
- **Degradación Graciosa**: Funcionalidad reducida en lugar de fallo total

---

## 🚀 DESPLIEGUE Y OPERACIONES

### Infraestructura

- **Servidor**: Linux Debian (VPS)
- **Reverse Proxy**: Nginx para servir frontend y routing API
- **Base de Datos**: PostgreSQL en mismo servidor
- **Backups**: Automatizados diarios con rotación

### Scripts de Automatización

- **build-and-deploy.sh**: Compilación y despliegue completo
- **build-apk.sh**: Generación de instalador Android
- **backup-database.sh**: Respaldo de base de datos
- **monitor-backend.sh**: Monitoreo de servicios
- **setup-auto-backup.sh**: Configuración de backups automáticos

### Estrategia de Despliegue

- **Frontend**: Build estático en /var/www/html
- **Backend**: Servicio systemd con pm2
- **Mobile**: Generación de APK y distribución manual
- **Base de Datos**: Migraciones manuales con scripts

---

## 📱 APLICACIÓN MÓVIL: DETALLES TÉCNICOS

### Optimización de Batería

- **Ajuste Dinámico**: Frecuencia de ubicación según nivel de batería
- **Modos de Precisión**: Balance entre exactitud y consumo energético
- **Background Fetch**: Técnicas optimizadas para Android
- **Foreground Service**: Notificación persistente para fiabilidad
- **Task Manager**: Gestión de tareas en segundo plano

### Tracking GPS Avanzado

- **Algoritmo Adaptativo**: Ajuste según velocidad y precisión
- **Filtrado Espacial**: Eliminación de puntos redundantes
- **Fusión de Sensores**: Acelerómetro + GPS para mejor precisión
- **Geofencing**: Detección de entrada/salida de zonas
- **Detección de Paradas**: Identificación inteligente de detenciones

### Manejo de Reconexiones

- **Detección de Conectividad**: Monitoreo continuo del estado de red
- **Cola de Mensajes**: Almacenamiento organizado de datos pendientes
- **Estrategia de Sincronización**: Priorización y compresión de datos
- **Notificaciones al Usuario**: Feedback sobre estado de conexión
- **Metrics**: Registro de calidad de servicio para análisis

---

## 🖥️ FRONTEND WEB: DETALLES TÉCNICOS

### Mapa Interactivo

- **Leaflet**: Biblioteca ligera para mapas interactivos
- **Marcadores Personalizados**: Iconos y popups informativos
- **Clustering**: Agrupación de puntos cercanos
- **Autocentrado**: Seguimiento automático de deliveries
- **Rutas**: Visualización de recorridos completos
- **Control de Capas**: Diferentes vistas del mapa base
- **Controles Personalizados**: Botones de zoom, seguimiento, etc.

### Dashboard Administrativo

- **Diseño Responsive**: Adaptación a diferentes dispositivos
- **Tabs Interactivos**: Organización por funcionalidad
- **Tiempo Real**: Actualizaciones sin reload via WebSockets
- **Notificaciones**: Alertas para eventos importantes
- **Estado Sistema**: Indicadores de salud de componentes
- **Temas**: Soporte para modo claro/oscuro

### Historial y Análisis

- **Tablas Avanzadas**: Ordenamiento, filtrado, paginación
- **Visualización de Datos**: Estadísticas agregadas
- **Exportación**: Descarga de datos para análisis externo
- **Detalle de Viajes**: Modal con información completa
- **Rutas Históricas**: Visualización de recorridos pasados

---

## 🗄️ BACKEND: DETALLES TÉCNICOS

### API RESTful

- **Endpoints Estructurados**: Organización lógica por recurso
- **Versioning**: Soporte para evolución de API
- **Responses Consistentes**: Formato estándar de respuestas
- **HTTP Status Codes**: Uso apropiado de códigos de estado
- **Validación**: Middleware para verificar datos de entrada
- **Documentación**: Endpoints documentados para desarrolladores

### Procesamiento de Ubicaciones

- **Validación Geográfica**: Verificación de coordenadas válidas
- **Cálculo de Distancias**: Fórmula haversine para distancias precisas
- **Detección de Anomalías**: Filtrado de ubicaciones sospechosas
- **Optimización de Rutas**: Simplificación de trazados para visualización
- **Métricas en Tiempo Real**: Cálculo de velocidad, tiempo, distancia

### Middleware

- **Autenticación**: Verificación de tokens JWT
- **Autorización**: Control de acceso basado en roles
- **Validación**: Sanitización y verificación de datos
- **Logging**: Registro estructurado de actividad
- **Error Handling**: Captura y formateo de errores
- **Compresión**: Reducción de tamaño de respuestas
- **CORS**: Control de acceso cross-origin

---

## 📊 MODELO DE DATOS

### Entidades Principales

#### Usuario (User)
```
- id: UUID (PK)
- name: String
- email: String (admin)
- employeeId: String (delivery)
- password: String (hashed)
- role: Enum ['admin', 'delivery']
- isActive: Boolean
- lastLogin: DateTime
- createdAt: DateTime
- updatedAt: DateTime
```

#### Viaje (DeliveryTrip)
```
- id: UUID (PK)
- deliveryId: UUID (FK -> User)
- deliveryName: String
- startTime: DateTime
- endTime: DateTime
- status: Enum ['active', 'completed', 'paused']
- mileage: Float (km)
- realTimeMetrics: Object {
  - currentSpeed: Float
  - averageSpeed: Float
  - maxSpeed: Float
  - totalTime: Integer
  - validLocations: Integer
  - lastSpeedUpdate: DateTime
}
- currentLocation: Object {
  - latitude: Float
  - longitude: Float
  - timestamp: DateTime
}
- notes: String
- createdAt: DateTime
- updatedAt: DateTime
```

#### Ubicación (Location)
```
- id: UUID (PK)
- tripId: UUID (FK -> DeliveryTrip)
- latitude: Float
- longitude: Float
- timestamp: DateTime
- accuracy: Float
- speed: Float
- altitude: Float
- heading: Float
- createdAt: DateTime
- updatedAt: DateTime
```

### Relaciones

- **User 1:N DeliveryTrip**: Un usuario puede tener múltiples viajes
- **DeliveryTrip 1:N Location**: Un viaje tiene múltiples ubicaciones
- **User N:M User**: Relación jerárquica opcional (supervisores)

---

## 🧪 PRUEBAS Y CALIDAD

### Estrategias de Prueba

- **Pruebas Manuales**: Verificación de funcionalidad end-to-end
- **Logs Detallados**: Registro de actividad para diagnóstico
- **Monitoreo en Producción**: Supervisión de métricas clave
- **Feedback de Usuarios**: Reportes de incidencias

### Calidad de Código

- **ESLint**: Análisis estático para JavaScript/React
- **Prettier**: Formateo consistente de código
- **Git Hooks**: Verificaciones pre-commit
- **Code Reviews**: Revisión manual de cambios
- **Refactoring**: Mejora continua de codebase

---

## 📚 RECURSOS Y DOCUMENTACIÓN

### Documentación Existente

- **CONTEXTO_PROYECTO.md**: Visión general del sistema
- **README.md**: Instrucciones básicas de instalación
- **ADVANCED_LOCATION_API.md**: Detalles técnicos de tracking
- **APK-VERSIONS.md**: Historial de versiones móviles
- **BACKUP_SYSTEM_GUIDE.md**: Sistema de respaldos automáticos

### Guías de Desarrollo

- **Instalación Local**: Configuración de entorno desarrollo
- **Arquitectura**: Documentación de estructura del sistema
- **API Endpoints**: Referencia completa de backend
- **Modelos de Datos**: Esquemas y relaciones
- **Flujos**: Diagramas de procesos principales

---

## 🎯 CARACTERÍSTICAS ESPECIALES

### 1. Tracking GPS en Background con Optimización de Batería

Sistema avanzado que permite seguimiento continuo incluso con la pantalla apagada. Implementa:
- Detección automática de estado de batería
- Ajuste dinámico de frecuencia de actualización
- Foreground service con notificación persistente
- Filtrado inteligente de ubicaciones redundantes
- Mecanismos de "wake lock" para garantizar funcionamiento

### 2. Sistema de Sincronización Offline-Online

Mecanismo robusto para manejar desconexiones temporales:
- Buffer local de ubicaciones durante desconexión
- Sincronización automática al recuperar conectividad
- Compresión de datos para optimizar transferencia
- Priorización de datos más recientes/relevantes
- Detección de conflictos y resolución automática

### 3. Distribución APK via WhatsApp

Sistema integrado para facilitar la distribución de la aplicación:
- Generación de enlaces directos para WhatsApp
- Mensajes personalizados con instrucciones
- Seguimiento de versiones instaladas
- Notificaciones de actualizaciones disponibles
- Estadísticas de instalación/adopción

### 4. Sistema de Backup Automatizado

Solución completa para garantizar la integridad de los datos:
- Respaldos diarios programados
- Compresión y encriptación de datos sensibles
- Rotación de backups con política de retención
- Verificación automática de integridad
- Procedimientos documentados de restauración

---

## 🚀 EVOLUCIÓN Y ROADMAP

### Características Implementadas Recientemente

- ✅ **Historial de Viajes Detallado**: Consulta completa de entregas pasadas
- ✅ **Distribución APK via WhatsApp**: Envío facilitado de instaladores
- ✅ **Nombres en Mapa**: Visualización de nombres encima de íconos
- ✅ **Optimización de Batería**: Mejoras en consumo energético
- ✅ **Sistema de Backup**: Respaldos automáticos diarios

### Próximas Mejoras Planificadas

- 🔄 **Notificaciones Push**: Alertas en tiempo real para administradores
- 🔄 **Métricas Avanzadas**: Dashboard con KPIs de rendimiento
- 🔄 **Geofencing**: Zonas de entrega con alertas automáticas
- 🔄 **Modo Offline Completo**: Funcionalidad total sin conexión
- 🔄 **Integración con Sistemas POS**: Conexión con punto de venta

---

## 👥 EQUIPO Y SOPORTE

### Contactos Clave

- **Desarrollo Frontend**: [Nombre del Desarrollador Frontend]
- **Desarrollo Backend**: [Nombre del Desarrollador Backend]
- **Desarrollo Mobile**: [Nombre del Desarrollador Mobile]
- **Administración Sistema**: [Nombre del Administrador]
- **Soporte Técnico**: [Contacto de Soporte]

### Procedimientos de Soporte

1. **Problemas de Aplicación Móvil**:
   - Verificar versión instalada
   - Comprobar permisos de ubicación
   - Revisar logs de aplicación
   - Reinstalar desde APK actualizado

2. **Problemas de Dashboard Web**:
   - Verificar conexión a internet
   - Limpiar caché del navegador
   - Comprobar estado del servidor backend
   - Revisar logs de consola

3. **Problemas de Backend**:
   - Verificar servicio activo
   - Comprobar conectividad base de datos
   - Revisar logs de error
   - Reiniciar servicio si es necesario

---

## 🛠️ GUÍA DE INSTALACIÓN Y CONFIGURACIÓN

### Requisitos del Sistema

- **Servidor**: Linux Debian/Ubuntu, 2GB RAM, 20GB SSD
- **Node.js**: v18+
- **PostgreSQL**: v14+
- **Nginx**: v1.18+
- **React Native Environment**: Para desarrollo móvil

### Pasos de Instalación (Producción)

1. **Preparación del Servidor**:
   ```bash
   apt update && apt upgrade -y
   apt install nodejs npm postgresql nginx
   ```

2. **Configuración de Base de Datos**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE boston_tracker;
   CREATE USER boston_user WITH PASSWORD 'boston123';
   GRANT ALL PRIVILEGES ON DATABASE boston_tracker TO boston_user;
   ```

3. **Despliegue de Backend**:
   ```bash
   cd /var/www/boston-tracker/backend
   npm install
   cp .env.example .env
   # Editar .env con configuración adecuada
   npm run start
   ```

4. **Despliegue de Frontend**:
   ```bash
   cd /var/www/boston-tracker/frontend
   npm install
   npm run build
   cp -r build/* /var/www/html/
   ```

5. **Configuración de Nginx**:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     root /var/www/html;
     
     location / {
       try_files $uri $uri/ /index.html;
     }
     
     location /api {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

6. **Compilación de APK**:
   ```bash
   cd /var/www/boston-tracker/scripts
   ./build-apk.sh
   ```

7. **Configuración de Backups Automáticos**:
   ```bash
   cd /var/www/boston-tracker/scripts
   ./setup-auto-backup.sh
   ```

### Configuración de Desarrollo

1. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Aplicación Móvil**:
   ```bash
   cd mobile-app
   npm install
   npm start
   ```

---

## 📊 ESTADO ACTUAL DEL SISTEMA

### Versiones Actuales
- **Backend**: v1.0.0
- **Frontend**: v1.0.0
- **Aplicación Móvil**: v1.0.1

### Métricas de Uso
- **Usuarios Activos**: [Número de usuarios activos]
- **Viajes Registrados**: 646 viajes completados
- **Puntos GPS Almacenados**: [Número de ubicaciones]
- **Deliveries Activos**: [Número de deliveries]

### Estado de Servicios
- **Backend API**: ✅ Operativo
- **Frontend Web**: ✅ Operativo
- **Base de Datos**: ✅ Operativa
- **WebSockets**: ✅ Operativos
- **Sistema de Backups**: ✅ Operativo

---

## 🔍 TROUBLESHOOTING COMÚN

### Problemas Frecuentes y Soluciones

#### Backend no responde:
```bash
# Verificar si el servicio está activo
ps aux | grep node
# Reiniciar servicio
cd /var/www/boston-tracker/backend
npm run start
```

#### App no envía ubicaciones:
1. Verificar permisos de ubicación en Android
2. Comprobar si la app está en "battery optimization exclusions"
3. Reiniciar aplicación completamente
4. Verificar credenciales válidas

#### Dashboard no muestra deliveries:
1. Verificar conexión WebSocket (icono estado)
2. Comprobar si hay viajes activos
3. Refrescar página completamente
4. Verificar logs de consola del navegador

---

## 📝 NOTAS TÉCNICAS ADICIONALES

### Rendimiento y Escalabilidad

- **Optimización de Consultas**: Índices en ubicaciones geográficas
- **Rate Limiting**: Protección contra sobrecarga
- **Caching**: Estrategias implementadas para datos frecuentes
- **Lazy Loading**: Carga diferida de componentes pesados
- **Pagination**: Manejo de grandes conjuntos de datos

### Consideraciones de Seguridad

- **Sanitización**: Limpieza de inputs de usuario
- **Validación**: Verificación estricta de datos entrantes
- **Encriptación**: Datos sensibles almacenados con hash
- **Tokens**: JWT con expiración y refresh apropiado
- **Headers**: Security headers configurados en Nginx

---

Este documento proporciona una visión completa del sistema BOSTON Tracker, incluyendo todos sus componentes, arquitectura, funcionalidades y configuraciones técnicas. Sirve como referencia central para entender y operar el sistema en su totalidad.

**Última actualización**: 9 de Septiembre de 2025
