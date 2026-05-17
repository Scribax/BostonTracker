/**
 * 🎯 SERVICIO AVANZADO DE UBICACIÓN SIMPLIFICADO
 * 
 * Mejoras básicas sin dependencias externas complejas:
 * ✅ Filtro Kalman básico para suavizar ubicaciones GPS
 * ✅ Detección de saltos imposibles de ubicación
 * ✅ Corrección de velocidades imposibles
 * ✅ Cálculo de confianza basado en precisión GPS
 * ✅ Manejo robusto de errores
 */
class AdvancedLocationService {
  constructor() {
    this.isActive = false;
    this.currentLocation = null;
    
    // 🧠 Filtro Kalman básico
    this.kalmanFilter = {
      lat: { value: 0, variance: 1000 },
      lng: { value: 0, variance: 1000 },
      processNoise: 0.01,
      measurementNoise: 1,
      initialized: false
    };
    
    // 📊 Estadísticas
    this.stats = {
      locationsProcessed: 0,
      improvementsApplied: 0,
      errorsDetected: 0,
      lastProcessTime: null
    };
  }

  /**
   * ⚙️ Verificar si el servicio está disponible
   */
  isAvailable() {
    return true; // Siempre disponible, es una versión simplificada
  }

  /**
   * 🚀 Iniciar el servicio
   */
  async start() {
    try {
      this.isActive = true;
      this.stats = {
        locationsProcessed: 0,
        improvementsApplied: 0,
        errorsDetected: 0,
        lastProcessTime: null
      };
      
      console.log('✅ AdvancedLocationService (Simple) iniciado correctamente');
      return { success: true };
    } catch (error) {
      console.error('❌ Error iniciando AdvancedLocationService:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🛑 Detener servicio
   */
  async stop() {
    this.isActive = false;
    this.kalmanFilter.initialized = false;
    console.log('🛑 AdvancedLocationService detenido');
  }

  /**
   * 🎯 Procesar ubicación GPS con mejoras básicas
   */
  async processLocation(locationData) {
    if (!this.isActive) {
      return {
        isValid: false,
        error: 'Servicio no activo'
      };
    }

    try {
      this.stats.locationsProcessed++;
      this.stats.lastProcessTime = new Date();

      // Validar datos básicos
      if (!this.isValidLocationData(locationData)) {
        this.stats.errorsDetected++;
        return {
          isValid: false,
          error: 'Datos de ubicación inválidos'
        };
      }

      let processedLocation = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        speed: locationData.speed || 0,
        heading: locationData.heading || 0,
        altitude: locationData.altitude || 0
      };

      let improvementsApplied = [];

      // 1. Aplicar filtro Kalman básico
      if (this.kalmanFilter.initialized) {
        const kalmanResult = this.applySimpleKalmanFilter(processedLocation);
        processedLocation.latitude = kalmanResult.latitude;
        processedLocation.longitude = kalmanResult.longitude;
        improvementsApplied.push('kalman');
      } else {
        // Inicializar filtro Kalman con primera ubicación
        this.kalmanFilter.lat.value = processedLocation.latitude;
        this.kalmanFilter.lng.value = processedLocation.longitude;
        this.kalmanFilter.initialized = true;
      }

      // 2. Detectar y corregir saltos imposibles
      if (this.currentLocation) {
        const jumpCorrection = this.detectAndCorrectLocationJump(processedLocation);
        if (jumpCorrection.corrected) {
          processedLocation = jumpCorrection.location;
          improvementsApplied.push('jump-correction');
        }
      }

      // 3. Corregir velocidades imposibles
      const speedCorrection = this.correctImpossibleSpeed(processedLocation);
      if (speedCorrection.corrected) {
        processedLocation.speed = speedCorrection.speed;
        improvementsApplied.push('speed-correction');
      }

      // 4. Calcular confianza
      const confidence = this.calculateLocationConfidence(processedLocation);

      // 5. Detectar tipo de actividad básico
      const activityLevel = this.detectBasicActivity(processedLocation);

      // Actualizar ubicación actual
      this.currentLocation = {
        ...processedLocation,
        timestamp: Date.now()
      };

      if (improvementsApplied.length > 0) {
        this.stats.improvementsApplied++;
      }

      // Retornar resultado mejorado
      return {
        isValid: true,
        latitude: processedLocation.latitude,
        longitude: processedLocation.longitude,
        accuracy: processedLocation.accuracy,
        speed: processedLocation.speed,
        heading: processedLocation.heading,
        altitude: processedLocation.altitude,
        kalmanFiltered: improvementsApplied.includes('kalman'),
        confidence: confidence,
        improvements: improvementsApplied,
        activityLevel: activityLevel,
        transportMode: activityLevel // Simplificado
      };

    } catch (error) {
      console.error('❌ Error procesando ubicación:', error);
      this.stats.errorsDetected++;
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * ✅ Validar datos de ubicación
   */
  isValidLocationData(location) {
    return (
      location &&
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number' &&
      location.latitude >= -90 && location.latitude <= 90 &&
      location.longitude >= -180 && location.longitude <= 180 &&
      (!location.accuracy || location.accuracy > 0)
    );
  }

  /**
   * 🧮 Filtro Kalman simplificado
   */
  applySimpleKalmanFilter(location) {
    // Filtro para latitud
    const latGain = this.kalmanFilter.lat.variance / 
                   (this.kalmanFilter.lat.variance + this.kalmanFilter.measurementNoise);
    
    this.kalmanFilter.lat.value += latGain * (location.latitude - this.kalmanFilter.lat.value);
    this.kalmanFilter.lat.variance = (1 - latGain) * this.kalmanFilter.lat.variance + 
                                    this.kalmanFilter.processNoise;

    // Filtro para longitud
    const lngGain = this.kalmanFilter.lng.variance / 
                   (this.kalmanFilter.lng.variance + this.kalmanFilter.measurementNoise);
    
    this.kalmanFilter.lng.value += lngGain * (location.longitude - this.kalmanFilter.lng.value);
    this.kalmanFilter.lng.variance = (1 - lngGain) * this.kalmanFilter.lng.variance + 
                                    this.kalmanFilter.processNoise;

    return {
      latitude: this.kalmanFilter.lat.value,
      longitude: this.kalmanFilter.lng.value
    };
  }

  /**
   * 🚨 Detectar y corregir saltos de ubicación imposibles
   */
  detectAndCorrectLocationJump(newLocation) {
    if (!this.currentLocation) {
      return { corrected: false, location: newLocation };
    }

    const distance = this.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    const timeElapsed = (Date.now() - this.currentLocation.timestamp) / 1000; // segundos
    const maxPossibleDistance = (200 / 3.6) * timeElapsed; // 200 km/h máximo

    if (distance > maxPossibleDistance && timeElapsed > 0) {
      console.log(`🚨 Salto de ubicación detectado: ${distance.toFixed(0)}m en ${timeElapsed.toFixed(1)}s`);
      
      // Interpolar entre ubicación anterior y actual
      return {
        corrected: true,
        location: {
          ...newLocation,
          latitude: (this.currentLocation.latitude + newLocation.latitude) / 2,
          longitude: (this.currentLocation.longitude + newLocation.longitude) / 2
        }
      };
    }

    return { corrected: false, location: newLocation };
  }

  /**
   * ⚡ Corregir velocidades imposibles
   */
  correctImpossibleSpeed(location) {
    if (!location.speed || location.speed <= 0) {
      return { corrected: false, speed: location.speed };
    }

    const maxReasonableSpeed = 200; // 200 km/h
    
    if (location.speed > maxReasonableSpeed) {
      console.log(`🚨 Velocidad imposible corregida: ${location.speed.toFixed(1)} -> ${maxReasonableSpeed} km/h`);
      return { corrected: true, speed: maxReasonableSpeed };
    }

    return { corrected: false, speed: location.speed };
  }

  /**
   * 🎯 Calcular confianza de ubicación
   */
  calculateLocationConfidence(location) {
    let confidence = 100;
    
    // Reducir confianza por baja precisión GPS
    if (location.accuracy) {
      if (location.accuracy > 50) confidence -= 50;
      else if (location.accuracy > 20) confidence -= 30;
      else if (location.accuracy > 10) confidence -= 15;
    }
    
    // Normalizar entre 0 y 1
    return Math.max(0, Math.min(100, confidence)) / 100;
  }

  /**
   * 🏃 Detectar actividad básica usando velocidad
   */
  detectBasicActivity(location) {
    const speed = location.speed || 0;
    
    if (speed < 1) return 'stationary';
    if (speed < 8) return 'walking';
    if (speed < 25) return 'cycling';
    return 'driving';
  }

  /**
   * 📏 Calcular distancia entre dos puntos (Haversine)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 📊 Obtener estadísticas del servicio
   */
  getStats() {
    return {
      isActive: this.isActive,
      ...this.stats,
      kalmanState: {
        initialized: this.kalmanFilter.initialized,
        latVariance: this.kalmanFilter.lat.variance,
        lngVariance: this.kalmanFilter.lng.variance
      }
    };
  }
}

// Crear instancia singleton
const advancedLocationService = new AdvancedLocationService();

export default advancedLocationService;
