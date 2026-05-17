import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import locationService from '../services/locationService';
import socketService from '../services/socketService';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Context
const LocationContext = createContext();

// Provider
export const LocationProvider = ({ children }) => {
  const { user } = useAuth(); // Obtener usuario del contexto de autenticación
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mileage, setMileage] = useState(0);
  const [tripId, setTripId] = useState(null);
  const [error, setError] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  // Refs para evitar re-renders innecesarios
  const trackingIntervalRef = useRef(null);
  const isTrackingRef = useRef(false);

  // Efecto para inicializar el servicio de ubicación
  useEffect(() => {
    const initService = async () => {
      await locationService.initialize();
    };
    initService();
  }, []);

  // Efecto para limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      locationService.stopTracking();
    };
  }, []);

  // Efecto para limpiar estado cuando el usuario se desloguea
  useEffect(() => {
    if (!user) {
      console.log('🗑️ Usuario deslogueado, limpiando estado de tracking...');
      
      // Detener tracking si está activo
      if (isTrackingRef.current) {
        setIsTracking(false);
        isTrackingRef.current = false;
        
        // Limpiar interval
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
          trackingIntervalRef.current = null;
        }
        
        // Detener servicio de ubicación
        locationService.stopTracking().catch(error => {
          console.warn('Error deteniendo location service:', error);
        });
      }
      
      // Resetear todo el estado
      setCurrentLocation(null);
      setMileage(0);
      setTripId(null);
      setLastUpdateTime(null);
      setError('');
      
      console.log('✅ Estado de tracking limpiado');
    }
  }, [user]);

  // Inicializar servicio de ubicación
  const initializeLocation = async () => {
    try {
      const result = await locationService.requestPermissions();
      
      if (result.success) {
        setError('');
        return true;
      } else {
        setError(result.error || 'No se pudieron obtener permisos de ubicación');
        return false;
      }
    } catch (err) {
      console.error('Error inicializando ubicación:', err);
      setError('Error inicializando servicio de ubicación');
      return false;
    }
  };

  // Iniciar tracking
  const startTracking = async (onTripStart) => {
    try {
      // Verificar permisos primero
      const permissionResult = await locationService.requestPermissions();
      if (!permissionResult.success) {
        Alert.alert(
          'Permisos Requeridos',
          'Necesitamos acceso a tu ubicación para funcionar correctamente. Por favor habilítalo en configuración.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configuración', onPress: () => locationService.openSettings() }
          ]
        );
        return false;
      }

      // Obtener ubicación inicial
      const initialLocation = await locationService.getCurrentLocation();
      
      console.log('📍 Ubicación inicial obtenida:', {
        lat: initialLocation.coords.latitude.toFixed(6),
        lng: initialLocation.coords.longitude.toFixed(6),
        accuracy: initialLocation.coords.accuracy
      });

      // Iniciar viaje en el servidor
      const tripResult = await onTripStart?.(initialLocation);
      if (!tripResult?.success) {
        throw new Error(tripResult?.error || 'Error iniciando viaje');
      }

      // Configurar estado
      setIsTracking(true);
      setCurrentLocation(initialLocation);
      setMileage(0);
      setTripId(tripResult.data?.tripId);
      setError('');
      setLastUpdateTime(new Date());
      
      // Actualizar ref
      isTrackingRef.current = true;

      // Verificar que tenemos un usuario autenticado
      if (!user || !user.id) {
        throw new Error('Usuario no autenticado o ID de usuario no disponible');
      }

      // Iniciar tracking en background con el userId
      // Configurar token para background tracking
      // Configurar token para background tracking
      // Configurar token para background tracking
      const storedToken = await AsyncStorage.getItem("bostonToken");
      if (storedToken) {
        locationService.setAuthToken(storedToken);
      }
      // Configurar token para background tracking
      const currentToken = await AsyncStorage.getItem("bostonToken");
      if (currentToken) {
        locationService.setAuthToken(currentToken);
        console.log("🔑 Token configurado para background tracking");
      }
      const trackingResult = await locationService.startHighFrequencyTracking(user.id);
      if (!trackingResult.success) {
        throw new Error(trackingResult.error || 'Error iniciando tracking de ubicación');
      }

      // Iniciar interval para enviar ubicaciones
      trackingIntervalRef.current = setInterval(async () => {
        if (isTrackingRef.current) {
          await sendLocationUpdate();
        }
      }, 10000); // Cada 10 segundos

      console.log('✅ Tracking iniciado correctamente');
      return true;

    } catch (error) {
      console.error('Error iniciando tracking:', error);
      setError(error.message || 'Error iniciando tracking');
      setIsTracking(false);
      isTrackingRef.current = false;
      
      Alert.alert(
        'Error',
        error.message || 'No se pudo iniciar el tracking',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  };

  // Detener tracking
  const stopTracking = async (onTripStop) => {
    try {
      setIsTracking(false);
      isTrackingRef.current = false;

      // Limpiar interval
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }

      // Detener tracking en background
      await locationService.stopTracking();

      // Detener viaje en el servidor si existe
      if (onTripStop && tripId) {
        const result = await onTripStop();
        if (!result.success) {
          console.warn('Error deteniendo viaje en servidor:', result.error);
        }
      }

      // Resetear estado
      setCurrentLocation(null);
      setMileage(0);
      setTripId(null);
      setLastUpdateTime(null);
      setError('');

      console.log('✅ Tracking detenido correctamente');
      return true;

    } catch (error) {
      console.error('Error deteniendo tracking:', error);
      setError(error.message || 'Error deteniendo tracking');
      
      Alert.alert(
        'Error',
        'Hubo un problema deteniendo el tracking',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  };

  // Enviar actualización de ubicación
  const sendLocationUpdate = async () => {
    try {
      if (!isTrackingRef.current) return;

      const location = await locationService.getCurrentLocation();
      
      // Actualizar estado local
      setCurrentLocation(location);

      // Enviar ubicación al backend
      try {
        if (user && user.id) {
          await apiService.updateLocation(user.id, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || null
          });
          console.log("📤 Ubicación enviada al backend correctamente");
        }
      } catch (apiError) {
        console.error("❌ Error enviando ubicación al backend:", apiError);
      }
      setLastUpdateTime(new Date());

      // Calcular distancia desde la última ubicación conocida
      if (currentLocation) {
        // Función simple para calcular distancia
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
          const R = 6371; // Radio de la Tierra en km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        const distance = calculateDistance(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          location.coords.latitude,
          location.coords.longitude
        );
        
        if (distance > 0.005) { // Solo actualizar si se movió más de 5 metros
          setMileage(prev => prev + distance);
        }
      }

      console.log('📍 Ubicación actualizada:', {
        lat: location.coords.latitude.toFixed(6),
        lng: location.coords.longitude.toFixed(6),
        accuracy: location.coords.accuracy
      });

    } catch (error) {
      console.error('Error enviando actualización de ubicación:', error);
      // No mostrar alert aquí para no interrumpir al usuario constantemente
    }
  };

  // Obtener estado actual del tracking
  const getTrackingStatus = () => {
    return {
      isTracking,
      currentLocation,
      mileage,
      tripId,
      lastUpdateTime,
      error,
    };
  };

  // Formatear kilometraje
  const formatMileage = (km) => {
    if (km < 1) {
      return `${(km * 1000).toFixed(0)} m`;
    }
    return `${km.toFixed(2)} km`;
  };

  // Calcular duración del viaje
  const getTripDuration = () => {
    if (!lastUpdateTime || !isTracking) return 0;
    
    const now = new Date();
    const diffMs = now - lastUpdateTime;
    return Math.floor(diffMs / 1000 / 60); // en minutos
  };

  const value = {
    // Estado
    isTracking,
    currentLocation,
    mileage,
    tripId,
    error,
    lastUpdateTime,
    
    // Métodos
    initializeLocation,
    startTracking,
    stopTracking,
    getTrackingStatus,
    formatMileage,
    getTripDuration,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

// Hook personalizado
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation debe ser usado dentro de LocationProvider');
  }
  return context;
};

export default LocationContext;
