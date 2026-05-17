import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import apiService from './apiService';
import advancedLocationService from './advancedLocationService';

const METRICS_SYNC_INTERVAL = 10000; // 10 segundos

/**
 * Servicio especializado en calcular métricas reales de viaje
 * - Kilometraje preciso usando Haversine
 * - Velocidad instantánea y promedio
 * - Filtrado de datos GPS erróneos
 * - Persistencia local para no perder datos
 */
class TripMetricsService {
  constructor() {
    this.currentTrip = null;
    this.tripHistory = [];
    this.lastValidLocation = null;
    this.speedSamples = [];
    this.maxSpeedSamples = 10; // Para calcular velocidad promedio móvil
    this.minAccuracy = 15; // Máximo 15 metros de error GPS (ultra-estricto)
    this.maxReasonableSpeed = 120; // 120 km/h máximo razonable
    this.minValidDistance = 8; // Mínimo 8 metros para contar como movimiento real (anti-deriva estricto)
    this.minSpeedThreshold = 3; // Velocidad mínima 3 km/h para considerar movimiento real (eliminar deriva)
    
    // 🎆 NUEVOS: Parámetros de fusión de sensores (ACTIVADO para máxima precisión)
    this.useAdvancedFiltering = true; // Activar filtrado avanzado
    this.useSensorFusion = true; // Activar fusión con acelerómetro
    this.kalmanFilterEnabled = true; // Filtro Kalman básico
    this.snapToRoadsEnabled = false; // Snap to roads (requiere API)
    this.isActive = false;
    
    // 🎯 NUEVO: Detector de reposo inteligente (ultra-estricto)
    this.recentLocations = []; // Últimas ubicaciones para calcular zona de reposo
    this.maxRecentLocations = 12; // Mantener últimas 12 ubicaciones (más datos)
    this.restZoneRadius = 10; // Radio de 10m para considerar "en reposo" (más estricto)
    
    // 🔥 NUEVO: Propiedades para sincronización con backend
    this.metricsSyncTimer = null;
    this.lastMetricsSyncTime = null;
    this.syncInProgress = false;
    
    // 🚨 NUEVO: Control de inactividad
    this.lastMovementTime = null; // Último momento de movimiento real
    this.inactivityAlertSent = false; // Bandera para evitar múltiples alertas
    this.inactivityThresholdMinutes = 5; // 5 minutos de umbral
  }

  /**
   * Iniciar nuevo viaje
   */
  async startTrip(userId, tripId = null) {
    try {
      const tripData = {
        id: tripId || `trip_${Date.now()}_${userId}`,
        userId: userId,
        startTime: new Date().toISOString(),
        endTime: null,
        totalDistance: 0, // En kilómetros
        totalTime: 0, // En segundos
        averageSpeed: 0, // km/h
        maxSpeed: 0, // km/h
        currentSpeed: 0, // km/h instantánea
        locations: [], // Array de ubicaciones con timestamps
        status: 'active',
        lastUpdate: new Date().toISOString()
      };

      this.currentTrip = tripData;
      this.lastValidLocation = null;
      this.speedSamples = [];
      this.isActive = true;

      // 🎆 NUEVO: Inicializar AdvancedLocationService
      if (this.useAdvancedFiltering && advancedLocationService.isAvailable()) {
        try {
          await advancedLocationService.start();
          console.log('🎯 AdvancedLocationService iniciado para el viaje');
        } catch (error) {
          console.warn('⚠️ No se pudo iniciar AdvancedLocationService:', error.message);
        }
      }

      // Guardar en AsyncStorage
      await this.saveTripData();

      // 🔥 NUEVO: Iniciar sincronización de métricas
      this.startMetricsSync();

      console.log('🚀 Nuevo viaje iniciado:', {
        id: tripData.id,
        userId: userId,
        startTime: tripData.startTime
      });

      return {
        success: true,
        tripId: tripData.id
      };

    } catch (error) {
      console.error('Error iniciando viaje:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Procesar nueva ubicación GPS usando AdvancedLocationService y calcular métricas
   */
  async processLocation(locationData) {
    if (!this.isActive || !this.currentTrip) {
      return { success: false, error: 'No hay viaje activo' };
    }

    try {
      const currentTime = new Date();
      
      // 🎆 NUEVO: Procesar ubicación con AdvancedLocationService si está habilitado
      let processedLocation = locationData;
      
      if (this.useAdvancedFiltering && advancedLocationService.isAvailable()) {
        try {
          const enhancedLocation = await advancedLocationService.processLocation(locationData);
          if (enhancedLocation && enhancedLocation.isValid) {
            processedLocation = {
              ...locationData,
              latitude: enhancedLocation.latitude,
              longitude: enhancedLocation.longitude,
              accuracy: enhancedLocation.accuracy,
              speed: enhancedLocation.speed,
              heading: enhancedLocation.heading,
              isEnhanced: true,
              kalmanFiltered: enhancedLocation.kalmanFiltered,
              confidence: enhancedLocation.confidence
            };
            
            console.log('🎯 Ubicación procesada con AdvancedLocationService:', {
              originalAccuracy: locationData.accuracy?.toFixed(1) + 'm',
              enhancedAccuracy: enhancedLocation.accuracy?.toFixed(1) + 'm',
              confidence: enhancedLocation.confidence?.toFixed(2),
              kalmanFiltered: enhancedLocation.kalmanFiltered
            });
          }
        } catch (advancedError) {
          console.warn('⚠️ Error en AdvancedLocationService, usando ubicación GPS estándar:', advancedError.message);
        }
      }
      
      // Validar datos de ubicación (ahora con posible mejora del servicio avanzado)
      if (!this.isValidLocation(processedLocation)) {
        console.warn('⚠️ Ubicación GPS inválida ignorada:', {
          accuracy: processedLocation.accuracy,
          lat: processedLocation.latitude?.toFixed(6),
          lng: processedLocation.longitude?.toFixed(6),
          enhanced: processedLocation.isEnhanced || false
        });
        return { success: false, error: 'Ubicación GPS inválida' };
      }

      const newLocation = {
        latitude: processedLocation.latitude,
        longitude: processedLocation.longitude,
        accuracy: processedLocation.accuracy,
        timestamp: currentTime.toISOString(),
        altitude: processedLocation.altitude || null,
        heading: processedLocation.heading || null,
        speed: processedLocation.speed || null, // Velocidad del GPS o mejorada
        isEnhanced: processedLocation.isEnhanced || false,
        kalmanFiltered: processedLocation.kalmanFiltered || false,
        confidence: processedLocation.confidence || null
      };

      // Si es la primera ubicación válida del viaje
      if (!this.lastValidLocation) {
        this.lastValidLocation = newLocation;
        this.currentTrip.locations.push(newLocation);
        await this.saveTripData();
        
        console.log('📍 Primera ubicación del viaje registrada');
        return {
          success: true,
          metrics: this.getCurrentMetrics()
        };
      }

      // 🎯 PASO 1: SIEMPRE agregar ubicación al historial de reposo (ANTES de filtros)
      this.recentLocations.push({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        timestamp: currentTime
      });

      // Mantener solo las últimas N ubicaciones
      if (this.recentLocations.length > this.maxRecentLocations) {
        this.recentLocations.shift();
      }

      // 🔥 PASO 2: Detector de reposo inteligente (PRIORITARIO)
      if (this.recentLocations.length >= 5) {
        const isAtRest = this.isUserAtRest();
        if (isAtRest) {
          console.log('😴 USUARIO EN REPOSO detectado - Ignorando movimiento de deriva GPS');
          // Manejar inactividad cuando está en reposo
          this.handleInactivity();
          return {
            success: true,
            metrics: this.getCurrentMetrics()
          };
        } else {
          // Si sale del reposo, resetear timer de inactividad
          this.resetInactivityTimer();
        }
      }

      // 🎯 PASO 2.5: Detector de movimiento cero ultra-estricto (NUEVO)
      if (this.recentLocations.length >= 3) {
        const isCompletelyStill = this.isCompletelyStill();
        if (isCompletelyStill) {
          console.log('🚫 MOVIMIENTO CERO detectado - Usuario completamente inmóvil');
          // Manejar inactividad cuando está completamente inmovil
          this.handleInactivity();
          return {
            success: true,
            metrics: this.getCurrentMetrics()
          };
        }
      }

      // PASO 3: Calcular distancia desde la última ubicación válida
      const distanceKm = this.calculateHaversineDistance(
        this.lastValidLocation.latitude,
        this.lastValidLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );

      // PASO 4: Filtrar movimientos muy pequeños (ruido GPS)
      if (distanceKm * 1000 < this.minValidDistance) {
        console.log('🔄 Movimiento menor a', this.minValidDistance, 'm ignorado');
        return {
          success: true,
          metrics: this.getCurrentMetrics()
        };
      }

      // PASO 5: Calcular tiempo transcurrido
      const timeDiffSeconds = (currentTime - new Date(this.lastValidLocation.timestamp)) / 1000;

      // PASO 6: Calcular velocidad instantánea
      let instantSpeed = 0;
      if (timeDiffSeconds > 0) {
        instantSpeed = (distanceKm / (timeDiffSeconds / 3600)); // km/h
      }

      // PASO 7: Validar velocidad (filtrar valores imposibles)
      if (instantSpeed > this.maxReasonableSpeed) {
        console.warn('🚨 Velocidad imposible detectada y ignorada:', 
          instantSpeed.toFixed(1) + ' km/h');
        return {
          success: true,
          metrics: this.getCurrentMetrics()
        };
      }

      // PASO 8: Filtro adicional de deriva GPS por velocidad
      if (instantSpeed < this.minSpeedThreshold && distanceKm * 1000 < this.minValidDistance) {
        // Si la velocidad es muy baja Y la distancia es pequeña,
        // probablemente es deriva GPS, no movimiento real
        console.log('🎯 Deriva GPS detectada (velocidad:', instantSpeed.toFixed(1), 
                   'km/h, distancia:', (distanceKm * 1000).toFixed(1), 'm) - Ignorando');
        return {
          success: true,
          metrics: this.getCurrentMetrics()
        };
      }

      // Actualizar métricas del viaje
      this.currentTrip.totalDistance += distanceKm;
      this.currentTrip.currentSpeed = Math.max(0, instantSpeed);
      
      // Actualizar velocidad máxima
      if (this.currentTrip.currentSpeed > this.currentTrip.maxSpeed) {
        this.currentTrip.maxSpeed = this.currentTrip.currentSpeed;
      }

      // Mantener muestras de velocidad para promedio móvil
      this.speedSamples.push(this.currentTrip.currentSpeed);
      if (this.speedSamples.length > this.maxSpeedSamples) {
        this.speedSamples.shift();
      }

      // Calcular velocidad promedio móvil (últimas N muestras)
      const avgSpeed = this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length;
      this.currentTrip.averageSpeed = avgSpeed;

      // Calcular tiempo total del viaje
      const startTime = new Date(this.currentTrip.startTime);
      this.currentTrip.totalTime = Math.floor((currentTime - startTime) / 1000);

      // Resetear timer de inactividad por movimiento válido
      this.resetInactivityTimer();
      
      // Añadir ubicación al historial
      this.currentTrip.locations.push({
        ...newLocation,
        distanceFromPrevious: distanceKm,
        instantSpeed: this.currentTrip.currentSpeed,
        cumulativeDistance: this.currentTrip.totalDistance
      });

      // Actualizar última ubicación válida
      this.lastValidLocation = newLocation;
      this.currentTrip.lastUpdate = currentTime.toISOString();

      // Guardar datos actualizados
      await this.saveTripData();

      // Log de progreso cada cierto kilometraje
      if (this.currentTrip.totalDistance > 0 && 
          Math.floor(this.currentTrip.totalDistance * 10) % 5 === 0) { // Cada 500m
        console.log('🚚 Progreso del viaje:', {
          distance: (this.currentTrip.totalDistance * 1000).toFixed(0) + 'm',
          speed: this.currentTrip.currentSpeed.toFixed(1) + ' km/h',
          avgSpeed: this.currentTrip.averageSpeed.toFixed(1) + ' km/h',
          time: this.formatTime(this.currentTrip.totalTime)
        });
      }

      return {
        success: true,
        metrics: this.getCurrentMetrics()
      };

    } catch (error) {
      console.error('Error procesando ubicación:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validar si una ubicación GPS es confiable
   */
  isValidLocation(location) {
    // Verificar que existan las coordenadas
    if (!location || 
        typeof location.latitude !== 'number' || 
        typeof location.longitude !== 'number') {
      return false;
    }

    // Verificar que las coordenadas estén en rangos válidos
    if (location.latitude < -90 || location.latitude > 90 ||
        location.longitude < -180 || location.longitude > 180) {
      return false;
    }

    // Verificar precisión GPS
    if (location.accuracy && location.accuracy > this.minAccuracy) {
      return false;
    }

    return true;
  }

  /**
   * 🎯 NUEVO: Detectar si el usuario está en reposo analizando ubicaciones recientes
   * 
   * Analiza las últimas ubicaciones GPS para determinar si el usuario está 
   * en una zona de reposo (dentro de un radio pequeño durante un período)
   */
  isUserAtRest() {
    if (this.recentLocations.length < 5) {
      return false; // No hay suficientes datos
    }

    // Calcular el centro geométrico de las ubicaciones recientes
    let totalLat = 0;
    let totalLng = 0;
    const locationsCount = this.recentLocations.length;

    for (const location of this.recentLocations) {
      totalLat += location.latitude;
      totalLng += location.longitude;
    }

    const centerLat = totalLat / locationsCount;
    const centerLng = totalLng / locationsCount;

    // Verificar si todas las ubicaciones recientes están dentro del radio de reposo
    let locationsWithinRadius = 0;
    let maxDistanceFromCenter = 0;

    for (const location of this.recentLocations) {
      const distanceFromCenter = this.calculateHaversineDistance(
        centerLat,
        centerLng,
        location.latitude,
        location.longitude
      ) * 1000; // Convertir a metros

      if (distanceFromCenter > maxDistanceFromCenter) {
        maxDistanceFromCenter = distanceFromCenter;
      }

      if (distanceFromCenter <= this.restZoneRadius) {
        locationsWithinRadius++;
      }
    }

    // El usuario está en reposo si al menos 80% de las ubicaciones 
    // están dentro del radio de reposo
    const restThreshold = Math.ceil(locationsCount * 0.8);
    const isAtRest = locationsWithinRadius >= restThreshold;

    if (isAtRest) {
      console.log(`🔍 Análisis de reposo: ${locationsWithinRadius}/${locationsCount} ubicaciones dentro de ${this.restZoneRadius}m (máx: ${maxDistanceFromCenter.toFixed(1)}m)`);
    }

    return isAtRest;
  }

  /**
   * 🚫 NUEVO: Detector de movimiento cero ultra-estricto
   * 
   * Verifica si el usuario está completamente inmóvil analizando
   * las últimas 3 ubicaciones con un radio aún más pequeño
   */
  isCompletelyStill() {
    if (this.recentLocations.length < 3) {
      return false;
    }

    // Tomar las últimas 3 ubicaciones
    const lastThreeLocations = this.recentLocations.slice(-3);
    const stillnessRadius = 5; // Radio ultra-estricto de 5 metros

    // Usar la primera ubicación como referencia
    const referenceLocation = lastThreeLocations[0];

    // Verificar que todas las ubicaciones estén dentro del radio de inmovilidad
    for (let i = 1; i < lastThreeLocations.length; i++) {
      const distance = this.calculateHaversineDistance(
        referenceLocation.latitude,
        referenceLocation.longitude,
        lastThreeLocations[i].latitude,
        lastThreeLocations[i].longitude
      ) * 1000; // Convertir a metros

      if (distance > stillnessRadius) {
        return false; // Si cualquier ubicación está fuera del radio, no está inmóvil
      }
    }

    console.log('🔒 Usuario COMPLETAMENTE INMÓVIL detectado (últimas 3 ubicaciones dentro de 5m)');
    return true;
  }

  /**
   * Calcular distancia usando fórmula Haversine (más precisa)
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en kilómetros
    
    // Convertir grados a radianes
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distancia en kilómetros

    return distance;
  }

  /**
   * Obtener métricas actuales del viaje
   */
  getCurrentMetrics() {
    if (!this.currentTrip) {
      return null;
    }

    return {
      tripId: this.currentTrip.id,
      userId: this.currentTrip.userId,
      totalDistance: this.currentTrip.totalDistance, // km
      totalDistanceM: Math.round(this.currentTrip.totalDistance * 1000), // metros
      totalTime: this.currentTrip.totalTime, // segundos
      formattedTime: this.formatTime(this.currentTrip.totalTime),
      currentSpeed: Math.round(this.currentTrip.currentSpeed), // km/h
      averageSpeed: Math.round(this.currentTrip.averageSpeed * 10) / 10, // km/h con 1 decimal
      maxSpeed: Math.round(this.currentTrip.maxSpeed), // km/h
      isActive: this.isActive,
      lastUpdate: this.currentTrip.lastUpdate,
      locationCount: this.currentTrip.locations.length,
      startTime: this.currentTrip.startTime
    };
  }

  /**
   * Finalizar viaje actual
   */
  async endTrip() {
    if (!this.currentTrip) {
      return { success: false, error: 'No hay viaje activo' };
    }

    try {
      const endTime = new Date().toISOString();
      this.currentTrip.endTime = endTime;
      this.currentTrip.status = 'completed';
      this.currentTrip.lastUpdate = endTime;

      // Calcular velocidad promedio real del viaje completo
      if (this.currentTrip.totalTime > 0) {
        const realAverageSpeed = (this.currentTrip.totalDistance / (this.currentTrip.totalTime / 3600));
        this.currentTrip.realAverageSpeed = realAverageSpeed;
      }

      const tripSummary = {
        ...this.getCurrentMetrics(),
        endTime: endTime,
        status: 'completed'
      };

      // 🔥 NUEVO: Sincronización final antes de terminar viaje
      await this.forceSyncMetrics();
      
      // Detener sincronización periódica
      this.stopMetricsSync();
      
      // 🎆 NUEVO: Detener AdvancedLocationService
      if (this.useAdvancedFiltering && advancedLocationService.isAvailable()) {
        try {
          await advancedLocationService.stop();
          console.log('🎯 AdvancedLocationService detenido al finalizar viaje');
        } catch (error) {
          console.warn('⚠️ Error deteniendo AdvancedLocationService:', error.message);
        }
      }

      // Guardar en historial
      this.tripHistory.push({ ...this.currentTrip });
      await this.saveTripHistory();

      // Limpiar viaje actual
      this.currentTrip = null;
      this.lastValidLocation = null;
      this.speedSamples = [];
      this.recentLocations = []; // Limpiar ubicaciones para detector de reposo
      this.isActive = false;
      
      // Limpiar timer de inactividad
      this.resetInactivityTimer();

      console.log('✅ Viaje finalizado:', {
        distance: tripSummary.totalDistanceM + 'm',
        time: tripSummary.formattedTime,
        avgSpeed: tripSummary.averageSpeed + ' km/h'
      });

      return {
        success: true,
        tripSummary: tripSummary
      };

    } catch (error) {
      console.error('Error finalizando viaje:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Formatear tiempo en formato legible
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Guardar datos del viaje actual
   */
  async saveTripData() {
    try {
      if (this.currentTrip) {
        await AsyncStorage.setItem('currentTrip', JSON.stringify(this.currentTrip));
      }
    } catch (error) {
      console.error('Error guardando datos del viaje:', error);
    }
  }

  /**
   * Guardar historial de viajes
   */
  async saveTripHistory() {
    try {
      await AsyncStorage.setItem('tripHistory', JSON.stringify(this.tripHistory));
    } catch (error) {
      console.error('Error guardando historial de viajes:', error);
    }
  }

  /**
   * Cargar viaje desde AsyncStorage
   */
  async loadCurrentTrip() {
    try {
      const tripData = await AsyncStorage.getItem('currentTrip');
      if (tripData) {
        this.currentTrip = JSON.parse(tripData);
        if (this.currentTrip.status === 'active') {
          // Verificar si el viaje es muy viejo (más de 24 horas)
          const startTime = new Date(this.currentTrip.startTime);
          const now = new Date();
          const hoursDiff = (now - startTime) / (1000 * 60 * 60);
          
          if (hoursDiff > 24) {
            console.log('🗑️ Viaje muy viejo encontrado, limpiando...');
            await this.clearCurrentTrip();
            return;
          }
          
          this.isActive = true;
          // Restaurar última ubicación
          if (this.currentTrip.locations.length > 0) {
            this.lastValidLocation = this.currentTrip.locations[this.currentTrip.locations.length - 1];
          }
          
          console.log('📱 Viaje activo restaurado:', {
            id: this.currentTrip.id,
            startTime: this.currentTrip.startTime,
            locations: this.currentTrip.locations.length
          });
        } else {
          // Si el viaje no está activo, limpiar
          await this.clearCurrentTrip();
        }
      }
    } catch (error) {
      console.error('Error cargando viaje:', error);
      await this.clearCurrentTrip();
    }
  }

  /**
   * Limpiar viaje actual sin afectar historial
   */
  async clearCurrentTrip() {
    try {
      this.currentTrip = null;
      this.lastValidLocation = null;
      this.speedSamples = [];
      this.recentLocations = [];
      this.isActive = false;
      
      // Detener sincronización si está activa
      this.stopMetricsSync();
      
      // Limpiar timer de inactividad
      this.resetInactivityTimer();
      
      await AsyncStorage.removeItem('currentTrip');
      console.log('🧹 Viaje actual limpiado');
    } catch (error) {
      console.error('Error limpiando viaje actual:', error);
    }
  }

  /**
   * Cargar historial de viajes
   */
  async loadTripHistory() {
    try {
      const historyData = await AsyncStorage.getItem('tripHistory');
      if (historyData) {
        this.tripHistory = JSON.parse(historyData);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  }

  /**
   * Obtener historial de viajes
   */
  getTripHistory() {
    return this.tripHistory;
  }

  /**
   * Obtener estadísticas generales
   */
  getOverallStats() {
    const completedTrips = this.tripHistory.filter(trip => trip.status === 'completed');
    
    if (completedTrips.length === 0) {
      return null;
    }

    const totalDistance = completedTrips.reduce((sum, trip) => sum + trip.totalDistance, 0);
    const totalTime = completedTrips.reduce((sum, trip) => sum + trip.totalTime, 0);
    const maxSpeed = Math.max(...completedTrips.map(trip => trip.maxSpeed));
    const avgSpeed = totalTime > 0 ? (totalDistance / (totalTime / 3600)) : 0;

    return {
      totalTrips: completedTrips.length,
      totalDistance: totalDistance, // km
      totalDistanceM: Math.round(totalDistance * 1000), // metros
      totalTime: totalTime, // segundos
      formattedTotalTime: this.formatTime(totalTime),
      averageSpeed: Math.round(avgSpeed * 10) / 10, // km/h
      maxSpeed: Math.round(maxSpeed), // km/h
      averageTripDistance: Math.round((totalDistance / completedTrips.length) * 1000), // metros promedio por viaje
    };
  }

  /**
   * Limpiar datos (para testing o reset)
   */
  async clearAllData() {
    try {
      this.currentTrip = null;
      this.tripHistory = [];
      this.lastValidLocation = null;
      this.speedSamples = [];
      this.recentLocations = []; // Limpiar ubicaciones para detector de reposo
      this.isActive = false;

      await AsyncStorage.removeItem('currentTrip');
      await AsyncStorage.removeItem('tripHistory');

      console.log('🗑️ Todos los datos de viajes han sido limpiados');
      return { success: true };
    } catch (error) {
      console.error('Error limpiando datos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar si hay viaje activo
   */
  hasActiveTrip() {
    return this.isActive && this.currentTrip && this.currentTrip.status === 'active';
  }

  /**
   * Pausar viaje (mantiene datos pero deja de procesar ubicaciones)
   */
  pauseTrip() {
    if (this.currentTrip) {
      this.isActive = false;
      this.currentTrip.status = 'paused';
      this.saveTripData();
      console.log('⏸️ Viaje pausado');
    }
  }

  /**
   * Resumir viaje pausado
   */
  resumeTrip() {
    if (this.currentTrip && this.currentTrip.status === 'paused') {
      this.isActive = true;
      this.currentTrip.status = 'active';
      this.saveTripData();
      console.log('▶️ Viaje resumido');
    }
  }

  // 🔥 NUEVOS MÉTODOS PARA SINCRONIZACIÓN CON BACKEND

  /**
   * Iniciar sincronización periódica de métricas
   */
  startMetricsSync() {
    if (!this.hasActiveTrip() || this.metricsSyncTimer) {
      return;
    }

    console.log('📡 Iniciando sincronización de métricas cada', METRICS_SYNC_INTERVAL / 1000, 'segundos');

    // Primera sincronización inmediata
    this.syncMetricsToBackend();

    // Configurar timer para sincronización periódica
    this.metricsSyncTimer = setInterval(() => {
      this.syncMetricsToBackend();
    }, METRICS_SYNC_INTERVAL);
  }

  /**
   * Detener sincronización periódica de métricas
   */
  stopMetricsSync() {
    if (this.metricsSyncTimer) {
      clearInterval(this.metricsSyncTimer);
      this.metricsSyncTimer = null;
      console.log('📡 Sincronización de métricas detenida');
    }
  }

  /**
   * Sincronizar métricas actuales con el backend
   */
  async syncMetricsToBackend() {
    if (!this.hasActiveTrip() || this.syncInProgress) {
      return;
    }

    try {
      this.syncInProgress = true;
      const currentTime = new Date();
      const metrics = this.getCurrentMetrics();
      
      if (!metrics || !this.lastValidLocation) {
        return;
      }

      // Preparar payload de métricas para el backend (estructura corregida)
      const metricsPayload = {
        currentSpeed: metrics.currentSpeed, // km/h
        averageSpeed: metrics.averageSpeed, // km/h
        maxSpeed: metrics.maxSpeed, // km/h
        totalDistanceM: metrics.totalDistanceM, // metros (nombre correcto)
        totalTime: metrics.totalTime, // segundos
        validLocations: metrics.locationCount, // nombre correcto
        latitude: this.lastValidLocation.latitude,
        longitude: this.lastValidLocation.longitude,
        accuracy: this.lastValidLocation.accuracy,
        lastUpdate: currentTime.toISOString()
      };

      // Enviar al backend
      const result = await apiService.updateRealTimeMetrics(
        metrics.userId, 
        metricsPayload
      );

      if (result.success) {
        this.lastMetricsSyncTime = currentTime;
        console.log('📊 Métricas sincronizadas:', {
          distance: metrics.totalDistanceM + 'm',
          speed: metrics.currentSpeed + ' km/h',
          avgSpeed: metrics.averageSpeed + ' km/h',
          locations: metrics.locationCount
        });
      } else {
        console.warn('⚠️ Error sincronizando métricas:', result.error);
      }

    } catch (error) {
      console.error('❌ Error en sincronización de métricas:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Forzar sincronización inmediata (para momentos críticos como inicio/fin de viaje)
   */
  async forceSyncMetrics() {
    if (!this.hasActiveTrip()) {
      return { success: false, error: 'No hay viaje activo' };
    }

    try {
      await this.syncMetricsToBackend();
      return { success: true };
    } catch (error) {
      console.error('Error en sincronización forzada:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estado de la sincronización
   */
  getSyncStatus() {
    return {
      isActive: this.metricsSyncTimer !== null,
      lastSyncTime: this.lastMetricsSyncTime,
      syncInProgress: this.syncInProgress,
      hasActiveTrip: this.hasActiveTrip()
    };
  }

  // 🎆 NUEVOS MÉTODOS PARA CONFIGURACIÓN DE CARACTERÍSTICAS AVANZADAS

  /**
   * Configurar parámetros del sistema avanzado de ubicación
   */
  configureAdvancedSettings(settings) {
    if (settings.useAdvancedFiltering !== undefined) {
      this.useAdvancedFiltering = settings.useAdvancedFiltering;
    }
    if (settings.useSensorFusion !== undefined) {
      this.useSensorFusion = settings.useSensorFusion;
    }
    if (settings.kalmanFilterEnabled !== undefined) {
      this.kalmanFilterEnabled = settings.kalmanFilterEnabled;
    }
    if (settings.minAccuracy !== undefined) {
      this.minAccuracy = settings.minAccuracy;
    }
    if (settings.restZoneRadius !== undefined) {
      this.restZoneRadius = settings.restZoneRadius;
    }
    if (settings.minValidDistance !== undefined) {
      this.minValidDistance = settings.minValidDistance;
    }
    if (settings.minSpeedThreshold !== undefined) {
      this.minSpeedThreshold = settings.minSpeedThreshold;
    }

    console.log('🎯 Configuración avanzada actualizada:', {
      advancedFiltering: this.useAdvancedFiltering,
      sensorFusion: this.useSensorFusion,
      kalmanFilter: this.kalmanFilterEnabled,
      minAccuracy: this.minAccuracy + 'm',
      restZoneRadius: this.restZoneRadius + 'm',
      minValidDistance: this.minValidDistance + 'm',
      minSpeedThreshold: this.minSpeedThreshold + ' km/h'
    });
  }

  /**
   * Obtener configuración actual del sistema avanzado
   */
  getAdvancedSettings() {
    return {
      useAdvancedFiltering: this.useAdvancedFiltering,
      useSensorFusion: this.useSensorFusion,
      kalmanFilterEnabled: this.kalmanFilterEnabled,
      snapToRoadsEnabled: this.snapToRoadsEnabled,
      minAccuracy: this.minAccuracy,
      maxReasonableSpeed: this.maxReasonableSpeed,
      minValidDistance: this.minValidDistance,
      minSpeedThreshold: this.minSpeedThreshold,
      restZoneRadius: this.restZoneRadius,
      maxRecentLocations: this.maxRecentLocations,
      maxSpeedSamples: this.maxSpeedSamples
    };
  }

  /**
   * Obtener estadísticas del sistema avanzado de ubicación
   */
  getAdvancedStats() {
    const stats = {
      isAdvancedServiceAvailable: advancedLocationService.isAvailable(),
      currentServiceStatus: null,
      recentLocationsCount: this.recentLocations.length,
      lastRestDetection: null,
      enhancedLocationsProcessed: 0,
      standardLocationsProcessed: 0
    };

    // Obtener estadísticas del AdvancedLocationService si está disponible
    if (advancedLocationService.isAvailable()) {
      try {
        const serviceStats = advancedLocationService.getStats();
        stats.currentServiceStatus = serviceStats;
      } catch (error) {
        stats.currentServiceStatus = { error: error.message };
      }
    }

    // Calcular estadísticas de ubicaciones mejoradas vs estándar en el viaje actual
    if (this.currentTrip && this.currentTrip.locations) {
      this.currentTrip.locations.forEach(location => {
        if (location.isEnhanced) {
          stats.enhancedLocationsProcessed++;
        } else {
          stats.standardLocationsProcessed++;
        }
      });
    }

    return stats;
  }

  // 🚨 NUEVOS MÉTODOS DE ALERTA DE INACTIVIDAD

  /**
   * Manejar detección de inactividad (usuario inmóvil)
   */
  handleInactivity() {
    const now = Date.now();
    
    // Si es la primera vez que detectamos inactividad, registrar el tiempo
    if (!this.lastMovementTime) {
      this.lastMovementTime = now;
      console.log('⏰ Iniciando timer de inactividad...');
      return;
    }
    
    // Calcular tiempo inactivo
    const inactiveTimeMs = now - this.lastMovementTime;
    const inactiveTimeMinutes = Math.floor(inactiveTimeMs / (1000 * 60));
    
    // Si han pasado 5+ minutos y no se ha enviado la alerta
    if (inactiveTimeMinutes >= this.inactivityThresholdMinutes && !this.inactivityAlertSent) {
      this.sendInactivityAlert(inactiveTimeMinutes);
      this.inactivityAlertSent = true;
      console.log(`🚨 ALERTA DE INACTIVIDAD enviada: ${inactiveTimeMinutes} minutos inmóvil`);
    } else if (inactiveTimeMinutes > 0) {
      const remainingMinutes = this.inactivityThresholdMinutes - inactiveTimeMinutes;
      if (remainingMinutes > 0) {
        console.log(`⏳ Usuario inmóvil por ${inactiveTimeMinutes} min (alerta en ${remainingMinutes} min)`);
      }
    }
  }

  /**
   * Resetear timer de inactividad por movimiento detectado
   */
  resetInactivityTimer() {
    if (this.lastMovementTime) {
      const inactiveTime = Math.floor((Date.now() - this.lastMovementTime) / (1000 * 60));
      if (inactiveTime > 0) {
        console.log(`✅ Movimiento detectado - Timer de inactividad reseteado (estuvo inmóvil ${inactiveTime} min)`);
      }
    }
    this.lastMovementTime = null;
    this.inactivityAlertSent = false;
  }

  /**
   * Enviar alerta de inactividad al dashboard
   */
  async sendInactivityAlert(inactiveMinutes) {
    if (!this.hasActiveTrip()) return;
    
    try {
      const alertData = {
        tripId: this.currentTrip.id,
        deliveryId: this.currentTrip.userId,
        inactiveMinutes,
        timestamp: new Date().toISOString(),
        location: this.lastValidLocation ? {
          latitude: this.lastValidLocation.latitude,
          longitude: this.lastValidLocation.longitude
        } : null,
        alertType: 'inactivity',
        message: `Delivery inmóvil por ${inactiveMinutes} minutos`
      };
      
      const result = await apiService.sendInactivityAlert(this.currentTrip.userId, alertData);
      
      if (result.success) {
        console.log('🚨 Alerta de inactividad enviada al dashboard exitosamente');
      } else {
        console.warn('⚠️ Error enviando alerta de inactividad:', result.error);
      }
    } catch (error) {
      console.error('🚨 Error crítico enviando alerta de inactividad:', error);
    }
  }

  /**
   * Obtener estado actual de inactividad
   */
  getInactivityStatus() {
    if (!this.lastMovementTime) {
      return {
        isInactive: false,
        inactiveTimeMinutes: 0,
        alertSent: false
      };
    }
    
    const inactiveTimeMs = Date.now() - this.lastMovementTime;
    const inactiveTimeMinutes = Math.floor(inactiveTimeMs / (1000 * 60));
    
    return {
      isInactive: inactiveTimeMinutes > 0,
      inactiveTimeMinutes,
      alertSent: this.inactivityAlertSent,
      thresholdMinutes: this.inactivityThresholdMinutes,
      willAlertIn: Math.max(0, this.inactivityThresholdMinutes - inactiveTimeMinutes)
    };
  }
}

// Crear instancia singleton
const tripMetricsService = new TripMetricsService();

export default tripMetricsService;
