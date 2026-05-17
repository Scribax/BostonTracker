# 🌐 Boston Tracker - Frontend Dashboard

Dashboard web administrativo construido con React para el sistema de seguimiento de deliveries de Boston American Burgers.

## 🌟 Características

- ⚛️ **React 18** con Hooks y Context API
- 🗺️ **Mapas interactivos** con Leaflet y OpenStreetMap
- 📊 **Dashboard en tiempo real** con WebSocket
- 🔐 **Autenticación JWT** integrada
- 📱 **Responsive design** para móvil y desktop  
- 🎯 **Sistema de logging configurable** por niveles
- 🚀 **Build optimizado** con Vite
- ✅ **Gestión completa de viajes** con detalles y eliminación

## 🎯 Nuevas Funcionalidades Implementadas

### 🆕 Sistema de Logging Configurable

#### Configuración por Niveles
Ubicado en `src/config/logger.js`, permite controlar la verbosidad de los logs:

```javascript
const LOG_LEVELS = {
  NONE: 0,    // Sin logs
  ERROR: 1,   // Solo errores críticos ⭐ (configuración actual)
  WARN: 2,    // Errores y advertencias
  INFO: 3,    // Información básica
  DEBUG: 4    // Todos los logs (desarrollo completo)
};
```

#### Métodos Disponibles
```javascript
import Logger from '../config/logger.js';

Logger.error('Error crítico');           // Siempre visible
Logger.warn('Advertencia');              // Solo en WARN+
Logger.info('Información general');      // Solo en INFO+
Logger.debug('Debug detallado');         // Solo en DEBUG

// Métodos específicos para APIs
Logger.apiRequest(method, url);
Logger.apiResponse(method, url, data);
Logger.apiError(error);

// Métodos para eventos del sistema
Logger.tripUpdate(data);
Logger.deliveryUpdate(data);
Logger.socketEvent(event, data);
```

### ✨ Gestión Avanzada de Viajes

#### Detalles Completos
- **Vista detallada** de cada viaje con toda la información
- **Información del delivery** completa (nombre, ID, email)
- **Métricas del viaje** (distancia, tiempo, velocidad promedio)
- **Recorrido GPS** con todas las ubicaciones
- **Timestamps detallados** de inicio y fin

#### Eliminación Segura
- **Confirmación de eliminación** con modal
- **Validación de permisos** solo para administradores
- **Feedback visual** del proceso de eliminación
- **Actualización automática** de la lista tras eliminación

## 🖥️ Componentes Principales

### Dashboard (`src/components/Dashboard.jsx`)
- **Mapa principal** con ubicaciones en tiempo real
- **Lista de deliveries** activos
- **Socket.io** para actualizaciones en vivo
- **Gestión de viajes** iniciados/finalizados
- **Notificaciones** de eventos importantes

### TripHistory (`src/components/TripHistory.jsx`)  
- **Historial paginado** de todos los viajes
- **Filtros y búsqueda** por delivery, fecha, estado
- **Vista de detalles** completa por viaje
- **Eliminación de viajes** con confirmación
- **Exportación** de datos (futura implementación)

### MapComponent (`src/components/MapComponent.jsx`)
- **Mapa Leaflet** con tiles de OpenStreetMap
- **Marcadores dinámicos** para deliveries activos
- **Tracking en tiempo real** de ubicaciones
- **Zoom automático** a ubicaciones relevantes
- **Tooltips informativos** con datos de delivery

### UserManagement (`src/components/UserManagement.jsx`)
- **Gestión de usuarios** del sistema
- **Creación de deliveries** con credenciales
- **Asignación de roles** admin/delivery
- **Estado de usuarios** activos/inactivos

### APKManager (`src/components/APKManager.jsx`)
- **Información del APK** actual disponible
- **Generación de enlaces** para WhatsApp
- **Estadísticas de descargas** (futura implementación)

## 🔌 Servicios y APIs

### API Service (`src/services/api.js`)
Servicio centralizado para todas las peticiones HTTP:

```javascript
import api from '../services/api.js';

// Ejemplos de uso
const response = await api.get('/trips/history');
const details = await api.get(`/trips/details/${tripId}`);
const result = await api.delete(`/trips/details/${tripId}`);
```

**Características:**
- ✅ **Interceptores** para requests y responses
- ✅ **Manejo automático** de tokens JWT
- ✅ **Logging integrado** con sistema configurable
- ✅ **Manejo de errores** con notificaciones toast
- ✅ **Timeout configurado** (10 segundos)
- ✅ **Redirección automática** en errores 401

### Trip Service (`src/services/tripService.js`)
Servicio especializado para gestión de viajes:

```javascript
import { getTripHistory, getTripDetails, deleteTrip } from '../services/tripService.js';

// Obtener historial con paginación
const history = await getTripHistory(page, limit, filters);

// Obtener detalles completos de un viaje
const details = await getTripDetails(tripId);

// Eliminar viaje específico
const result = await deleteTrip(tripId);
```

### Socket Service (`src/services/socket.js`)
Servicio para comunicación en tiempo real:

```javascript
import SocketService from '../services/socket.js';

// Conectar con token
SocketService.connect(token);

// Escuchar eventos
SocketService.onTripStarted((data) => {
  Logger.tripUpdate('Trip started:', data);
});

SocketService.onLocationUpdate((data) => {
  Logger.deliveryUpdate('Location update:', data);
});
```

## 🎨 Estilos y UI

### Bootstrap 5
- **Grid system** responsivo
- **Componentes** pre-estilizados (cards, modals, buttons)
- **Iconos** Bootstrap Icons
- **Utilidades** de spacing y color

### CSS Personalizado
- **Variables CSS** para colores del brand
- **Animaciones** para feedback visual
- **Responsive breakpoints** para móvil
- **Dark mode** preparado (futura implementación)

### Toasts y Notificaciones
```javascript
import toast from 'react-hot-toast';

// Notificaciones de éxito
toast.success('Viaje eliminado exitosamente');

// Notificaciones de error  
toast.error('Error al eliminar viaje');

// Notificaciones personalizadas
toast('Procesando...', { icon: '⏳' });
```

## 🚀 Build y Deployment

### Desarrollo
```bash
cd frontend
npm install
npm start         # Servidor de desarrollo en puerto 3000
npm run build     # Build de producción
```

### Producción con Nginx
```bash
# Build optimizado
npm run build

# Copiar archivos al servidor web
cp -r build/* /var/www/html/

# O usar la configuración específica de Nginx
cp -r build/* /var/www/boston-tracker/frontend/build/
```

### Variables de Entorno
El frontend detecta automáticamente el entorno:

```javascript
// Configuración automática de URLs
const config = {
  development: {
    API_URL: `http://${window.location.hostname}:5000/api`,
    SOCKET_URL: `http://${window.location.hostname}:5000`
  },
  production: {
    API_URL: `http://${window.location.hostname}:5000/api`,
    SOCKET_URL: `http://${window.location.hostname}:5000`
  }
};
```

## 🛡️ Seguridad y Autenticación

### JWT Token Management
- **Storage seguro** en localStorage
- **Renovación automática** antes de expiración
- **Limpieza automática** en logout o error 401
- **Validación** en cada request

### Protección de Rutas
```jsx
// AuthContext protege rutas privadas
<AuthProvider>
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
</AuthProvider>
```

### Validación de Permisos
```javascript
// Verificación de rol de administrador
if (user.role !== 'admin') {
  toast.error('Acceso denegado');
  return;
}
```

## 📊 Performance y Optimizaciones

### Bundle Size
- **Vite** para build rápido y optimizado
- **Tree shaking** automático
- **Code splitting** por rutas
- **Lazy loading** de componentes pesados

### Caching
- **Service Worker** ready para PWA
- **API responses** cacheadas temporalmente
- **Assets** con versionado automático

### Optimizaciones de Red
- **Compresión gzip** en assets
- **CDN ready** para recursos estáticos
- **Prefetch** de rutas críticas

## 🧪 Testing

### Setup de Testing (Futuro)
```bash
# Instalar dependencias de testing
npm install --save-dev @testing-library/react jest

# Ejecutar tests
npm test
```

### Estructura de Tests
```
src/
├── __tests__/
│   ├── components/
│   │   ├── Dashboard.test.jsx
│   │   └── TripHistory.test.jsx
│   ├── services/
│   │   ├── api.test.js
│   │   └── tripService.test.js
│   └── utils/
│       └── logger.test.js
```

## 📱 Mobile Responsiveness

### Breakpoints
- **xs**: < 576px (móviles)
- **sm**: ≥ 576px (móviles grandes)
- **md**: ≥ 768px (tablets)
- **lg**: ≥ 992px (desktops)
- **xl**: ≥ 1200px (desktops grandes)

### Mobile-First Design
- **Touch-friendly** buttons y controles
- **Swipe gestures** en componentes apropiados
- **Viewport** optimizado para móviles
- **PWA ready** para instalación

## 🔧 Configuración Avanzada

### Logging para Debugging
Para habilitar logs completos durante desarrollo:

```javascript
// En src/config/logger.js cambiar:
const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;
```

Luego rebuildar:
```bash
npm run build
```

### Customización de Mapas
```javascript
// En MapComponent.jsx personalizar:
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = '© OpenStreetMap contributors';
const maxZoom = 19;
const defaultZoom = 13;
```

## 📄 Changelog

### v2.1.0 (2025-09-03)
- ✨ **Sistema de logging configurable** implementado
- ✨ **Detalles completos de viajes** con nueva UI
- ✨ **Eliminación de viajes** desde dashboard
- 🐛 **URLs corregidas** para nuevos endpoints
- 🔧 **Optimización de logs** para producción
- 📱 **Mejoras de responsividad** en componentes

### v2.0.0 (2025-09-02)
- 🚀 **Migración a React 18**
- ⚡ **Optimizaciones de rendimiento**
- 🗺️ **Mapas mejorados** con Leaflet
- 📊 **Dashboard rediseñado**

## 🔗 URLs y Recursos

### Desarrollo
- **Dev Server**: http://localhost:3000
- **API Local**: http://localhost:5000/api
- **Socket Local**: http://localhost:5000

### Producción  
- **Dashboard**: http://185.144.157.163/
- **API**: http://185.144.157.163:5000/api
- **Documentación**: https://github.com/Scribax/BostonTracker

---

**Frontend desarrollado para Boston American Burgers** 🍔🌐
