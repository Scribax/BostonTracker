# 📱 Boston Tracker Mobile App

Aplicación móvil React Native para repartidores de BOSTON American Burgers. Permite tracking GPS en tiempo real, gestión de viajes y sincronización automática con el backend.

## 🚀 **Estado Actual**

✅ **APK compilado y funcional** con todas las características  
✅ **Permisos de ubicación** configurados correctamente  
✅ **Tracking en background** optimizado para batería  
✅ **HTTP habilitado** para producción en Android  
✅ **Iconos y splash screen** configurados  

## 📱 **Descarga e Instalación**

### Descarga Directa
- **📱 APK Oficial:** http://185.144.157.163/apk/boston-tracker-latest.apk
- **📄 Términos de Uso:** http://185.144.157.163/contratos/

### Requisitos del Sistema
- **Android:** 6.0 (API 23) o superior
- **RAM:** Mínimo 2GB recomendado
- **Almacenamiento:** 100MB libres
- **GPS:** Requerido para funcionamiento

## 🔧 **Tecnologías**

- **React Native** con Expo SDK 51
- **Expo Location** para GPS tracking
- **Expo TaskManager** para background tasks
- **AsyncStorage** para almacenamiento local
- **Socket.io-client** para tiempo real
- **React Navigation 6** para navegación
- **Expo Notifications** para push notifications
- **React Native Maps** para mapas nativos

## 📂 **Estructura de la App**

```
mobile-app/
├── src/
│   ├── components/      # Componentes reutilizables
│   │   ├── Map/         # Componentes de mapa
│   │   ├── Trip/        # Gestión de viajes
│   │   ├── Location/    # Tracking GPS
│   │   └── Auth/        # Autenticación
│   ├── screens/         # Pantallas principales
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── TripScreen.js
│   │   └── ProfileScreen.js
│   ├── services/        # Servicios API
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utilidades
│   └── constants/       # Constantes
├── android/             # Configuración Android
├── assets/              # Imágenes y recursos
├── app.json            # Configuración Expo
├── package.json         # Dependencias
└── README.md           # Este archivo
```

## 🚀 **Desarrollo Local**

### 1. Instalar dependencias
```bash
cd mobile-app
npm install
```

### 2. Configurar variables de entorno
```bash
# Crear archivo .env
echo "API_URL=http://185.144.157.163:3001" > .env
echo "SOCKET_URL=http://185.144.157.163:3001" >> .env
```

### 3. Ejecutar en desarrollo
```bash
# Para Android
npx expo run:android

# Para iOS (si tienes Mac)
npx expo run:ios

# Desarrollo con Expo Go
npx expo start
```

### 4. Build APK para producción
```bash
# Build optimizado
npx expo build:android --type apk

# O usando EAS Build
eas build --platform android
```

## 📱 **Características de la App**

### Tracking GPS
- 📍 **Ubicación en tiempo real** con alta precisión
- 🔋 **Optimización de batería** para tracking continuo
- 📡 **Sincronización automática** con el servidor
- 🚫 **Funciona offline** y sincroniza al conectarse

### Gestión de Viajes
- 📋 **Lista de viajes asignados** al repartidor
- ▶️ **Iniciar/pausar/finalizar** viajes
- 🗺️ **Navegación integrada** con Google Maps
- 📊 **Estadísticas** de distancia y tiempo

### Interfaz de Usuario
- 🎨 **Diseño intuitivo** y fácil de usar
- 🌙 **Modo oscuro** para uso nocturno
- 🔔 **Notificaciones push** para nuevos viajes
- 📱 **Responsive** para diferentes tamaños de pantalla

### Autenticación
- 🔐 **Login seguro** con JWT
- 👤 **Perfil de usuario** personalizable
- 🔄 **Auto-login** para comodidad
- 🚪 **Logout seguro** con limpieza de datos

## ⚙️ **Configuración Android**

### Permisos Requeridos
```xml
<!-- Ubicación precisa -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<!-- Ubicación aproximada -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<!-- Ubicación en background -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET" />
<!-- Estado de red -->
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Network Security Config
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">185.144.157.163</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

## 🔋 **Optimización de Batería**

### Background Tasks
- ⚡ **Task Manager** para tracking continuo
- 🔋 **Optimización inteligente** de frecuencia GPS
- 📊 **Monitoreo de batería** y ajuste automático
- ⏸️ **Pausar tracking** cuando no hay viajes activos

### Settings de Ubicación
```javascript
// Configuración de location tracking
const locationOptions = {
  accuracy: LocationAccuracy.BestForNavigation,
  timeInterval: 5000,        // 5 segundos
  distanceInterval: 10,      // 10 metros
  enableHighAccuracy: true,
  backgroundPermissions: true
}
```

## 🌐 **Integración con Backend**

### API Calls
```javascript
// Configuración base
const API_BASE_URL = 'http://185.144.157.163:3001'

// Autenticación
await loginUser(email, password)

// Enviar ubicación
await sendLocation(latitude, longitude, timestamp)

// Obtener viajes
const trips = await getUserTrips()
```

### WebSocket Connection
```javascript
import io from 'socket.io-client'

const socket = io('http://185.144.157.163:3001')
socket.emit('join-trip', tripId)
socket.on('location-update', (data) => {
  // Actualizar mapa en tiempo real
})
```

## 🧪 **Testing**

```bash
# Tests unitarios
npm test

# Tests en dispositivo
npx expo start --device

# Tests de performance
npx expo start --tunnel
```

## 📦 **Build y Distribución**

### APK Release
```bash
# Build de producción
npx expo build:android --type apk

# Build optimizado
npx expo build:android --type apk --release-channel production
```

### Variables de Build
```javascript
// app.json
{
  "expo": {
    "name": "Boston Tracker",
    "slug": "boston-tracker",
    "version": "1.0.0",
    "platforms": ["android"],
    "android": {
      "package": "com.boston.tracker",
      "versionCode": 1,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    }
  }
}
```

## 🐛 **Problemas Resueltos**

- ✅ **HTTP en producción** habilitado correctamente
- ✅ **Permisos de ubicación** funcionando en todas las versiones Android
- ✅ **Background tracking** optimizado para batería
- ✅ **Network security** configurado para HTTP
- ✅ **Icons y splash** configurados correctamente
- ✅ **Build APK** generado sin errores

## 🔧 **Troubleshooting**

### Problemas Comunes
- **Location permission denied:** Verificar permisos en Configuración
- **Network error:** Verificar que el backend esté corriendo
- **App crashes:** Revisar logs con `npx expo logs`

### Debug Commands
```bash
# Ver logs en tiempo real
npx expo logs

# Limpiar cache
npx expo start -c

# Reset del proyecto
npx expo install --fix
```

---

**Última actualización:** $(date '+%d/%m/%Y %H:%M')  
**Versión APK:** v1.0.0  
**Estado:** ✅ Producción
