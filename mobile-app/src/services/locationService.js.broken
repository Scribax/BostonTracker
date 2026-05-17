import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, Linking, AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import apiService from './apiService';
import tripMetricsService from './tripMetricsService';

// Nombre de la tarea en background
const BACKGROUND_LOCATION_TASK = 'background-location';

// Configuración desde variables de entorno
const CONFIG = {
  TRACKING_INTERVAL: parseInt(Constants.expoConfig?.extra?.EXPO_PUBLIC_TRACKING_INTERVAL) || 5000, // 5 segundos optimizado
  HIGH_FREQUENCY_MODE: Constants.expoConfig?.extra?.EXPO_PUBLIC_HIGH_FREQUENCY_MODE === 'true' || false,
  MIN_DISTANCE_FILTER: parseInt(Constants.expoConfig?.extra?.EXPO_PUBLIC_MIN_DISTANCE_FILTER) || 5, // 5 metros optimizado
  DEBUG_MODE: Constants.expoConfig?.extra?.EXPO_PUBLIC_DEBUG_MODE === 'true' || false,
  AGGRESSIVE_BACKGROUND_MODE: Constants.expoConfig?.extra?.EXPO_PUBLIC_AGGRESSIVE_BACKGROUND_MODE === 'true' || false,
  BATCH_SIZE: 2, // Reducido para mejor tiempo real
  MAX_BATCH_INTERVAL: 10000, // 10 segundos máximo
  USE_LEGACY_LOCATION_API: (Constants.expoConfig?.extra?.EXPO_PUBLIC_USE_LEGACY_LOCATION_API || 'false') === 'true',
};

// Buffer para almacenar ubicaciones cuando no hay conexión
let locationBuffer = [];
let lastSentLocation = null;
let batchTimeout = null;
let keepAliveTimer = null;

class LocationService {
  constructor() {
    this.isInitialized = false;
    this.currentUserId = null;
    this.lastKnownLocation = null;
    this.isTrackingActive = false;
    this.foregroundSubscription = null;
    this.appStateSubscription = null;
  }

  // Inicializar servicio
  async initialize() {
    try {
      if (this.isInitialized) return true;

      // Definir tarea en background con configuración mejorada
      TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
        if (error) {
          console.error('❌ Error en background location task:', error);
          return;
        }

        if (data) {
          const { locations } = data;
          if (locations && locations.length > 0) {
            const location = locations[0];
            console.log('📍 Background location received:', {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              timestamp: new Date(location.timestamp).toLocaleTimeString(),
              accuracy: location.coords.accuracy
            });
            this.handleBackgroundLocation(location);
          }
        }
      });

      // Escuchar cambios de estado de la app
      this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        console.log('📱 App State changed to:', nextAppState);
        if (nextAppState === 'background' && this.isTrackingActive) {
          this.onAppGoesToBackground();
        } else if (nextAppState === 'active' && this.isTrackingActive) {
          this.onAppComesToForeground();
        }
      });

      this.isInitialized = true;
      console.log('✅ LocationService inicializado con background tracking mejorado');
      return true;

    } catch (error) {
      console.error('❌ Error inicializando LocationService:', error);
      return false;
    }
  }

  // Manejo cuando la app va a background
  async onAppGoesToBackground() {
    console.log('🌙 App va a background - Activando modo agresivo');
    if (CONFIG.AGGRESSIVE_BACKGROUND_MODE && this.isTrackingActive) {
      // Iniciar keep-alive timer para evitar que Android mate la tarea
      this.startKeepAliveTimer();
    }
  }

  // Manejo cuando la app vuelve a foreground
  async onAppComesToForeground() {
    console.log('🌅 App vuelve a foreground - Optimizando tracking');
    this.stopKeepAliveTimer();
    
    // Reiniciar foreground tracking si está activo
    if (this.isTrackingActive && this.currentUserId) {
      this.startForegroundTracking(this.currentUserId);
    }
  }

  // Timer para mantener la app viva en background
  startKeepAliveTimer() {
    if (keepAliveTimer) return;
    
    keepAliveTimer = setInterval(() => {
      console.log('⏰ Keep-alive ping en background');
      // Ping al servidor para mantener la conexión activa
      this.sendKeepAlivePing();
    }, 30000); // Cada 30 segundos
  }

  stopKeepAliveTimer() {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  }

  // Ping para mantener conexión activa
  async sendKeepAlivePing() {
    try {
      if (this.currentUserId && this.lastKnownLocation) {
        // Enviar última ubicación conocida como keep-alive
        await apiService.sendLocation({
          user_id: this.currentUserId,
          latitude: this.lastKnownLocation.coords.latitude,
          longitude: this.lastKnownLocation.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: this.lastKnownLocation.coords.accuracy,
          isKeepAlive: true
        });
        console.log('💓 Keep-alive ping enviado');
      }
    } catch (error) {
      console.log('⚠️ Keep-alive ping falló (normal si no hay internet)');
    }
  }

  // Manejar ubicación en background
  async handleBackgroundLocation(location) {
    try {
      if (!this.currentUserId || !this.isTrackingActive) return;

      console.log('📍 Procesando background location:', {
        lat: location.coords.latitude.toFixed(6),
        lng: location.coords.longitude.toFixed(6),
        accuracy: Math.round(location.coords.accuracy),
        timestamp: new Date(location.timestamp).toLocaleTimeString()
      });

      this.lastKnownLocation = location;

      // Preparar datos de ubicación
      const locationData = {
        user_id: this.currentUserId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude || 0,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
        timestamp: new Date(location.timestamp).toISOString(),
        isBackground: true
      };

      // Añadir al buffer
      locationBuffer.push(locationData);

      // Enviar inmediatamente si es alta frecuencia o si el buffer está lleno
      if (CONFIG.HIGH_FREQUENCY_MODE || locationBuffer.length >= CONFIG.BATCH_SIZE) {
        await this.flushLocationBuffer();
      } else {
        // Programar envío si no hay timeout activo
        if (!batchTimeout) {
          batchTimeout = setTimeout(() => {
            this.flushLocationBuffer();
          }, CONFIG.MAX_BATCH_INTERVAL);
        }
      }

    } catch (error) {
      console.error('❌ Error procesando background location:', error);
    }
  }

  // Iniciar tracking de alta frecuencia optimizado para background
  async startHighFrequencyTracking(userId) {
    try {
      if (this.isTrackingActive) {
        console.log('⚠️ Tracking ya está activo');
        return { success: true };
      }

      this.currentUserId = userId;
      this.isTrackingActive = true;

      // Configuración ultra-optimizada para background
      const trackingConfig = {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: CONFIG.TRACKING_INTERVAL,
        distanceInterval: CONFIG.MIN_DISTANCE_FILTER,
        deferredUpdatesInterval: CONFIG.TRACKING_INTERVAL,
        // Configuración crítica para background
        mayShowUserSettingsDialog: true,
        foregroundService: {
          notificationTitle: 'BOSTON Tracker 🍔 - Tracking Activo',
          notificationBody: `📍 Ubicación actualizada cada ${CONFIG.TRACKING_INTERVAL/1000}s - No cerrar para mantener precisión`,
          notificationColor: '#dc3545',
          killServiceOnDestroy: false, // CRÍTICO: No matar el servicio
        },
        // Configuraciones adicionales para Android
        pausesLocationUpdatesAutomatically: false, // No pausar automáticamente
        activityType: Location.ActivityType.AutomotiveNavigation, // Tipo de actividad para delivery
        showsBackgroundLocationIndicator: true, // Mostrar indicador en iOS
      };

      console.log('🚀 Iniciando background tracking optimizado:', {
        interval: CONFIG.TRACKING_INTERVAL + 'ms',
        minDistance: CONFIG.MIN_DISTANCE_FILTER + 'm',
        aggressive: CONFIG.AGGRESSIVE_BACKGROUND_MODE,
        userId: userId
      });

      // Iniciar background location
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, trackingConfig);
      
      // Iniciar tracking de foreground también para redundancia
      if (CONFIG.HIGH_FREQUENCY_MODE) {
        this.startForegroundTracking(userId);
      }

      // Iniciar keep-alive timer inmediatamente
      if (CONFIG.AGGRESSIVE_BACKGROUND_MODE) {
        this.startKeepAliveTimer();
      }

      console.log('✅ Background tracking OPTIMIZADO iniciado');
      return { success: true };

    } catch (error) {
      console.error('❌ Error iniciando background tracking:', error);
      this.isTrackingActive = false;
      this.currentUserId = null;
      
      return {
        success: false,
        error: error.message || 'Error iniciando background tracking'
      };
    }
  }

  // Tracking en foreground como backup
  async startForegroundTracking(userId) {
    try {
      if (this.foregroundSubscription) {
        this.foregroundSubscription.remove();
      }

      this.foregroundSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: Math.max(CONFIG.TRACKING_INTERVAL / 2, 2000), // Más frecuente en foreground
          distanceInterval: CONFIG.MIN_DISTANCE_FILTER,
        },
        (location) => {
          console.log('📱 Foreground location:', {
            lat: location.coords.latitude.toFixed(6),
            lng: location.coords.longitude.toFixed(6),
            timestamp: new Date(location.timestamp).toLocaleTimeString()
          });
          this.handleBackgroundLocation(location); // Usar la misma lógica
        }
      );

      console.log('✅ Foreground tracking iniciado como backup');
    } catch (error) {
      console.error('❌ Error iniciando foreground tracking:', error);
    }
  }

  // Detener tracking
  async stopTracking() {
    try {
      this.isTrackingActive = false;
      this.currentUserId = null;

      // Detener background task
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      // Detener foreground tracking
      if (this.foregroundSubscription) {
        this.foregroundSubscription.remove();
        this.foregroundSubscription = null;
      }

      // Detener keep-alive
      this.stopKeepAliveTimer();

      // Enviar buffer pendiente
      await this.flushLocationBuffer();

      console.log('🛑 Tracking detenido completamente');
      return { success: true };

    } catch (error) {
      console.error('❌ Error deteniendo tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar buffer de ubicaciones
  async flushLocationBuffer() {
    if (locationBuffer.length === 0) return;

    try {
      // Limpiar timeout
      if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
      }

      const locationsToSend = [...locationBuffer];
      locationBuffer = []; // Limpiar buffer inmediatamente

      console.log(`📤 Enviando ${locationsToSend.length} ubicaciones en batch`);

      for (const locationData of locationsToSend) {
        try {
          await apiService.sendLocation(locationData);
          lastSentLocation = locationData;
        } catch (error) {
          console.error('❌ Error enviando ubicación individual:', error);
          // Volver a añadir al buffer si falla
          locationBuffer.unshift(locationData);
        }
      }

      console.log('✅ Batch de ubicaciones enviado');

    } catch (error) {
      console.error('❌ Error en flush de ubicaciones:', error);
    }
  }

  // Solicitar permisos optimizados
  async requestPermissions() {
    try {
      console.log('🔐 Solicitando permisos de ubicación optimizados...');

      // Paso 1: Permisos básicos
      const foregroundPermission = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundPermission.status !== 'granted') {
        Alert.alert(
          'Permisos de Ubicación Requeridos',
          'Boston Tracker necesita acceso a tu ubicación para funcionar correctamente.',
          [
            { text: 'Configuración', onPress: () => Linking.openSettings() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return false;
      }

      // Paso 2: Permisos de background (crítico)
      const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundPermission.status !== 'granted') {
        Alert.alert(
          '⚠️ Permiso de Ubicación en Background Crítico',
          'Para un tracking preciso durante deliveries, debes permitir "Permitir siempre" en la configuración de ubicación.\n\nSin esto, el tracking se detendrá cuando guardes el teléfono.',
          [
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
            { text: 'Continuar sin background', style: 'cancel' }
          ]
        );
        // Continuar pero con funcionalidad limitada
      }

      // Verificar configuración de batería
      if (Platform.OS === 'android') {
        this.checkBatteryOptimization();
      }

      console.log('✅ Permisos configurados:', {
        foreground: foregroundPermission.status,
        background: backgroundPermission.status
      });

      return true;

    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      return false;
    }
  }

  // Verificar optimización de batería (Android)
  async checkBatteryOptimization() {
    try {
      Alert.alert(
        '🔋 Optimización de Batería',
        'Para el mejor tracking de deliveries:\n\n1. Ve a Configuración → Batería → Optimización de batería\n2. Busca "Boston Tracker"\n3. Selecciona "No optimizar"\n\nEsto evita que Android detenga el GPS en background.',
        [
          { text: 'Configurar Ahora', onPress: () => Linking.openSettings() },
          { text: 'Recordar Después', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.log('ℹ️ No se pudo verificar optimización de batería');
    }
  }

  // Obtener ubicación actual
  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 1000, // Máximo 1 segundo de cache
        timeout: 10000, // 10 segundos timeout
      });

      this.lastKnownLocation = location;
      return location;

    } catch (error) {
      console.error('❌ Error obteniendo ubicación actual:', error);
      throw error;
    }
  }

  // Verificar si TaskManager está funcionando
  async isBackgroundTaskRunning() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      const isLocationUpdatesDefined = await TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
      
      console.log('🔍 Estado de background task:', {
        registered: isRegistered,
        defined: isLocationUpdatesDefined,
        tracking: this.isTrackingActive
      });

      return isRegistered && isLocationUpdatesDefined;
    } catch (error) {
      console.error('❌ Error verificando background task:', error);
      return false;
    }
  }

  // Diagnosticar problemas de tracking
  async diagnoseTracking() {
    try {
      console.log('🔍 Diagnóstico de tracking:');
      
      // 1. Verificar permisos
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      const backgroundStatus = await Location.getBackgroundPermissionsAsync();
      
      console.log('📋 Permisos:', {
        foreground: foregroundStatus.status,
        background: backgroundStatus.status
      });

      // 2. Verificar estado de TaskManager
      const taskRunning = await this.isBackgroundTaskRunning();
      
      // 3. Verificar configuración del dispositivo
      const locationEnabled = await Location.hasServicesEnabledAsync();
      
      // 4. Obtener ubicación de prueba
      let testLocation = null;
      try {
        testLocation = await this.getCurrentLocation();
      } catch (error) {
        console.log('❌ No se pudo obtener ubicación de prueba');
      }

      const diagnosis = {
        permissions: {
          foreground: foregroundStatus.status === 'granted',
          background: backgroundStatus.status === 'granted'
        },
        services: {
          locationEnabled,
          taskRunning,
          tracking: this.isTrackingActive
        },
        config: CONFIG,
        testLocation: testLocation ? {
          lat: testLocation.coords.latitude.toFixed(6),
          lng: testLocation.coords.longitude.toFixed(6),
          accuracy: Math.round(testLocation.coords.accuracy)
        } : null
      };

      console.log('📊 Diagnóstico completo:', diagnosis);
      return diagnosis;

    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      return { error: error.message };
    }
  }

  // Limpiar recursos
  cleanup() {
    this.stopTracking();
    this.stopKeepAliveTimer();
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

const locationService = new LocationService();
export default locationService;
