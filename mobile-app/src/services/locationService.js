import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, Linking, AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import apiService from './apiService';

// Nombre de la tarea en background
const BACKGROUND_LOCATION_TASK = 'background-location';

// Configuración desde variables de entorno
const CONFIG = {
  TRACKING_INTERVAL: parseInt(Constants.expoConfig?.extra?.EXPO_PUBLIC_TRACKING_INTERVAL) || 5000,
  HIGH_FREQUENCY_MODE: Constants.expoConfig?.extra?.EXPO_PUBLIC_HIGH_FREQUENCY_MODE === 'true' || false,
  MIN_DISTANCE_FILTER: parseInt(Constants.expoConfig?.extra?.EXPO_PUBLIC_MIN_DISTANCE_FILTER) || 5,
  DEBUG_MODE: Constants.expoConfig?.extra?.EXPO_PUBLIC_DEBUG_MODE === 'true' || false,
  AGGRESSIVE_BACKGROUND_MODE: Constants.expoConfig?.extra?.EXPO_PUBLIC_AGGRESSIVE_BACKGROUND_MODE === 'true' || false,
  BATCH_SIZE: 2,
  MAX_BATCH_INTERVAL: 10000,
  USE_LEGACY_LOCATION_API: (Constants.expoConfig?.extra?.EXPO_PUBLIC_USE_LEGACY_LOCATION_API || 'false') === 'true',
};

// Variables globales para manejar en callbacks
let locationBuffer = [];
let lastSentLocation = null;
let batchTimeout = null;
let keepAliveTimer = null;
let currentUserId = null;
let isTrackingActive = false;
let authToken = null;
let lastKnownLocation = null;

// Función global para manejar ubicación en background
const handleBackgroundLocation = async (location) => {
  try {
    if (!currentUserId || !isTrackingActive) return;

    console.log('📍 Background location received:', {
      lat: location.coords.latitude.toFixed(6),
      lng: location.coords.longitude.toFixed(6),
      accuracy: Math.round(location.coords.accuracy),
      timestamp: new Date(location.timestamp).toLocaleTimeString()
    });

    lastKnownLocation = location;

    const locationData = {
      user_id: currentUserId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || 0,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed || 0,
      heading: location.coords.heading || 0,
      timestamp: new Date(location.timestamp).toISOString(),
      isBackground: true
    };

    locationBuffer.push(locationData);

    if (CONFIG.HIGH_FREQUENCY_MODE || locationBuffer.length >= CONFIG.BATCH_SIZE) {
      await flushLocationBuffer();
    } else {
      if (!batchTimeout) {
        batchTimeout = setTimeout(() => {
          flushLocationBuffer();
        }, CONFIG.MAX_BATCH_INTERVAL);
      }
    }

  } catch (error) {
    console.error('❌ Error procesando background location:', error);
  }
};

// Función global para enviar buffer
const flushLocationBuffer = async () => {
  if (locationBuffer.length === 0) return;

  try {
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }

    const locationsToSend = [...locationBuffer];
    locationBuffer = [];

    console.log(`📤 Enviando ${locationsToSend.length} ubicaciones en batch`);

    for (const locationData of locationsToSend) {
      try {
        await apiService.updateLocation(locationData.user_id, {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy
        });
        lastSentLocation = locationData;
      } catch (error) {
        console.error('❌ Error enviando ubicación:', error);
        locationBuffer.unshift(locationData);
      }
    }

    console.log('✅ Batch de ubicaciones enviado');

  } catch (error) {
    console.error('❌ Error en flush de ubicaciones:', error);
  }
};

class LocationService {
  constructor() {
    this.isInitialized = false;
    this.foregroundSubscription = null;
    this.appStateSubscription = null;
  }

  async initialize() {
    try {
      if (this.isInitialized) return true;

      TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
        if (error) {
          console.error('❌ Error en background location task:', error);
          return;
        }

        if (data) {
          const { locations } = data;
          if (locations && locations.length > 0) {
            const location = locations[0];
            handleBackgroundLocation(location);
          }
        }
      });

      this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        console.log('📱 App State changed to:', nextAppState);
        if (nextAppState === 'background' && isTrackingActive) {
          this.onAppBackground();
        } else if (nextAppState === 'active' && isTrackingActive) {
          this.onAppForeground();
        }
      });

      this.isInitialized = true;
      console.log('✅ LocationService inicializado');
      return true;

    } catch (error) {
      console.error('❌ Error inicializando LocationService:', error);
      return false;
    }
  }

  async requestPermissions() {
    try {
      console.log('🔐 Verificando permisos de ubicación...');

      // Primero verificar si ya tenemos permisos
      const existingForeground = await Location.getForegroundPermissionsAsync();
      const existingBackground = await Location.getBackgroundPermissionsAsync();

      console.log('📋 Estado actual de permisos:', {
        foreground: existingForeground.status,
        background: existingBackground.status
      });

      // Si ya tenemos permisos de foreground, no pedir de nuevo
      let foregroundPermission = existingForeground;
      if (existingForeground.status !== 'granted') {
        console.log('🔐 Solicitando permisos de foreground...');
        foregroundPermission = await Location.requestForegroundPermissionsAsync();
      }
      
      if (foregroundPermission.status !== 'granted') {
        Alert.alert(
          'Permisos de Ubicación Requeridos',
          'Boston Tracker necesita acceso a tu ubicación para funcionar.',
          [
            { text: 'Configuración', onPress: () => this.openSettings() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return { success: false, error: 'Permisos de foreground no otorgados' };
      }

      // Si ya tenemos permisos de background, no pedir de nuevo
      let backgroundPermission = existingBackground;
      if (existingBackground.status !== 'granted') {
        console.log('🔐 Solicitando permisos de background...');
        backgroundPermission = await Location.requestBackgroundPermissionsAsync();
      }
      
      if (backgroundPermission.status !== 'granted') {
        Alert.alert(
          '⚠️ Permiso de Ubicación en Background Crítico',
          'Para tracking preciso, debes permitir "Permitir siempre".\n\nSin esto, el GPS se detendrá al guardar el teléfono.',
          [
            { text: 'Abrir Configuración', onPress: () => this.openSettings() },
            { text: 'Continuar sin background', style: 'cancel' }
          ]
        );
        console.log('⚠️ Background permission no otorgado, pero continuando...');
      }

      console.log('✅ Permisos configurados:', {
        foreground: foregroundPermission.status,
        background: backgroundPermission.status
      });

      return { success: true };

    } catch (error) {
      console.error('❌ Error verificando/solicitando permisos:', error);
      return { success: false, error: error.message };
    }
  }

  // Configurar token para background
  setAuthToken(token) {
    authToken = token;
    apiService.setAuthToken(token);
  }

  async startHighFrequencyTracking(userId) {
    try {
      if (isTrackingActive) {
        console.log('⚠️ Tracking ya está activo');
        return { success: true };
      }

      currentUserId = userId;
      isTrackingActive = true;

      const trackingConfig = {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: CONFIG.TRACKING_INTERVAL,
        distanceInterval: CONFIG.MIN_DISTANCE_FILTER,
        deferredUpdatesInterval: CONFIG.TRACKING_INTERVAL,
        mayShowUserSettingsDialog: true,
        foregroundService: {
          notificationTitle: 'BOSTON Tracker 🍔 - Tracking Activo',
          notificationBody: `📍 GPS activo cada ${CONFIG.TRACKING_INTERVAL/1000}s`,
          notificationColor: '#dc3545',
          killServiceOnDestroy: false,
        },
        pausesLocationUpdatesAutomatically: false,
        activityType: Location.ActivityType.AutomotiveNavigation,
        showsBackgroundLocationIndicator: true,
      };

      console.log('🚀 Iniciando background tracking optimizado:', {
        interval: CONFIG.TRACKING_INTERVAL + 'ms',
        minDistance: CONFIG.MIN_DISTANCE_FILTER + 'm',
        userId: userId
      });

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, trackingConfig);
      
      if (CONFIG.HIGH_FREQUENCY_MODE) {
        this.startForegroundTracking(userId);
      }

      console.log('✅ Background tracking iniciado');
      return { success: true };

    } catch (error) {
      console.error('❌ Error iniciando background tracking:', error);
      isTrackingActive = false;
      currentUserId = null;
      
      return {
        success: false,
        error: error.message || 'Error iniciando tracking'
      };
    }
  }

  async startForegroundTracking(userId) {
    try {
      if (this.foregroundSubscription) {
        this.foregroundSubscription.remove();
      }

      this.foregroundSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: Math.max(CONFIG.TRACKING_INTERVAL / 2, 2000),
          distanceInterval: CONFIG.MIN_DISTANCE_FILTER,
        },
        (location) => {
          console.log('📱 Foreground location:', {
            lat: location.coords.latitude.toFixed(6),
            lng: location.coords.longitude.toFixed(6),
            timestamp: new Date(location.timestamp).toLocaleTimeString()
          });
          handleBackgroundLocation(location);
        }
      );

      console.log('✅ Foreground tracking iniciado');
    } catch (error) {
      console.error('❌ Error iniciando foreground tracking:', error);
    }
  }

  async stopTracking() {
    try {
      isTrackingActive = false;
      currentUserId = null;

      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      if (this.foregroundSubscription) {
        this.foregroundSubscription.remove();
        this.foregroundSubscription = null;
      }

      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }

      await flushLocationBuffer();

      console.log('🛑 Tracking detenido');
      return { success: true };

    } catch (error) {
      console.error('❌ Error deteniendo tracking:', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 1000,
        timeout: 10000,
      });

      lastKnownLocation = location;
      return location;

    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      throw error;
    }
  }

  async isBackgroundTaskRunning() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      const isLocationUpdatesDefined = await TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
      
      console.log('🔍 Estado de background task:', {
        registered: isRegistered,
        defined: isLocationUpdatesDefined,
        tracking: isTrackingActive
      });

      return isRegistered && isLocationUpdatesDefined;
    } catch (error) {
      console.error('❌ Error verificando background task:', error);
      return false;
    }
  }

  // Funciones de compatibilidad
  async openSettings() {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error abriendo configuración:', error);
    }
  }

  async onAppBackground() {
    console.log('🌙 App va a background');
    if (CONFIG.AGGRESSIVE_BACKGROUND_MODE && isTrackingActive) {
      if (keepAliveTimer) return;
      
      keepAliveTimer = setInterval(() => {
        console.log('⏰ Keep-alive ping en background');
        // Keep alive ping
      }, 30000);
    }
  }

  async onAppForeground() {
    console.log('🌅 App vuelve a foreground');
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
    
    if (isTrackingActive && currentUserId) {
      this.startForegroundTracking(currentUserId);
    }
  }

  // Getters para compatibilidad
  getCurrentUserId() {
    return currentUserId;
  }

  getIsTrackingActive() {
    return isTrackingActive;
  }

  cleanup() {
    this.stopTracking();
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

const locationService = new LocationService();
export default locationService;
