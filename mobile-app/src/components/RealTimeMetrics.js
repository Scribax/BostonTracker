import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import tripMetricsService from '../services/tripMetricsService';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

const RealTimeMetrics = ({ isActive = false }) => {
  const [metrics, setMetrics] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dataSource, setDataSource] = useState('local'); // 'local' o 'backend'
  
  // Animaciones
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Actualizar métricas cada segundo cuando esté activo
  useEffect(() => {
    let interval;
    
    if (isActive && tripMetricsService.hasActiveTrip()) {
      // Mostrar componente con animación
      if (!isVisible) {
        setIsVisible(true);
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // 🔥 NUEVA LÓGICA HÍBRIDA: Backend primero, local como fallback
      const updateMetrics = async () => {
        try {
          // 1. Intentar obtener datos del backend (datos reales sincronizados)
          const backendTrip = await apiService.getMyActiveTrip();
          
          if (backendTrip.success && backendTrip.data) {
            // Convertir datos del backend al formato esperado
            const backendMetrics = {
              tripId: backendTrip.data.tripId || backendTrip.data.id,
              userId: backendTrip.data.deliveryId,
              totalDistanceM: Math.round((backendTrip.data.mileage || 0) * 1000), // Convertir km a metros
              totalTime: backendTrip.data.duration || 0, // En minutos, convertir a segundos
              formattedTime: `${backendTrip.data.duration || 0} min`,
              currentSpeed: 0, // El backend no tiene velocidad actual
              averageSpeed: backendTrip.data.averageSpeed || 0,
              maxSpeed: 0, // El backend no tiene velocidad máxima en esta estructura
              isActive: true,
              lastUpdate: backendTrip.data.lastUpdate || new Date().toISOString(),
              locationCount: 0, // El backend no expone este dato directamente
              startTime: backendTrip.data.startTime
            };
            
            // Si hay métricas en tiempo real del backend, usarlas
            if (backendTrip.data.realTimeMetrics) {
              try {
                const rtMetrics = typeof backendTrip.data.realTimeMetrics === 'string' 
                  ? JSON.parse(backendTrip.data.realTimeMetrics)
                  : backendTrip.data.realTimeMetrics;
                  
                backendMetrics.currentSpeed = rtMetrics.currentSpeed || 0;
                backendMetrics.averageSpeed = rtMetrics.averageSpeed || backendMetrics.averageSpeed;
                backendMetrics.maxSpeed = rtMetrics.maxSpeed || 0;
                backendMetrics.totalTime = (rtMetrics.totalTime || backendMetrics.totalTime) * 60; // Convertir minutos a segundos si es necesario
                backendMetrics.locationCount = rtMetrics.validLocations || 0;
              } catch (parseError) {
                console.warn('Error parseando realTimeMetrics del backend:', parseError);
              }
            }
            
            setMetrics(backendMetrics);
            setDataSource('backend');
            return; // Éxito con datos del backend
          }
        } catch (backendError) {
          console.warn('No se pudieron obtener métricas del backend:', backendError.message);
        }
        
        // 2. Fallback: Usar datos locales del tripMetricsService
        const localMetrics = tripMetricsService.getCurrentMetrics();
        if (localMetrics) {
          setMetrics(localMetrics);
          setDataSource('local');
        }
      };

      // Actualización inicial
      updateMetrics();

      // Interval para actualizaciones continuas (cada 3 segundos para no sobrecargar)
      interval = setInterval(updateMetrics, 3000);

    } else {
      // Ocultar componente con animación
      if (isVisible) {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 0.9,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsVisible(false);
          setMetrics(null);
        });
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, isVisible, slideAnim, fadeAnim, scaleAnim]);

  // No renderizar nada si no está visible o no hay métricas
  if (!isVisible || !metrics) {
    return null;
  }

  // Formatear tiempo en formato legible
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Determinar color de velocidad basado en el valor
  const getSpeedColor = (speed) => {
    if (speed === 0) return '#6c757d'; // Gris para detenido
    if (speed < 5) return '#28a745'; // Verde para caminando
    if (speed < 20) return '#ffc107'; // Amarillo para bicicleta/scooter
    if (speed < 60) return '#fd7e14'; // Naranja para velocidad moderada
    return '#dc3545'; // Rojo para alta velocidad
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>📊 Métricas en Tiempo Real</Text>
          <Text style={styles.subtitle}>Viaje #{metrics.tripId.split('_')[1]?.substring(0, 8)}</Text>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: '#28a745' }]}>
          <View style={styles.statusDot} />
        </View>
      </View>

      {/* Métricas principales */}
      <View style={styles.metricsRow}>
        {/* Distancia */}
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>📏</Text>
          <Text style={styles.metricValue}>
            {metrics.totalDistanceM < 1000 
              ? `${metrics.totalDistanceM}m`
              : `${(metrics.totalDistanceM / 1000).toFixed(2)}km`
            }
          </Text>
          <Text style={styles.metricLabel}>Recorrido</Text>
        </View>

        {/* Velocidad actual */}
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>⚡</Text>
          <Text style={[
            styles.metricValue,
            { color: getSpeedColor(metrics.currentSpeed) }
          ]}>
            {metrics.currentSpeed} km/h
          </Text>
          <Text style={styles.metricLabel}>Velocidad</Text>
        </View>

        {/* Tiempo */}
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>⏱️</Text>
          <Text style={styles.metricValue}>
            {formatTime(metrics.totalTime)}
          </Text>
          <Text style={styles.metricLabel}>Tiempo</Text>
        </View>
      </View>

      {/* Métricas secundarias */}
      <View style={styles.secondaryMetrics}>
        <View style={styles.secondaryMetric}>
          <Text style={styles.secondaryLabel}>📊 Velocidad Promedio</Text>
          <Text style={styles.secondaryValue}>{metrics.averageSpeed} km/h</Text>
        </View>
        
        <View style={styles.secondaryMetric}>
          <Text style={styles.secondaryLabel}>🚀 Velocidad Máxima</Text>
          <Text style={styles.secondaryValue}>{metrics.maxSpeed} km/h</Text>
        </View>
      </View>

      {/* Indicadores de precisión */}
      <View style={styles.footer}>
        <View style={styles.footerColumn}>
          <View style={styles.precisionIndicator}>
            <View style={[styles.precisionDot, { backgroundColor: '#28a745' }]} />
            <Text style={styles.precisionText}>GPS Alta Precisión</Text>
          </View>
        </View>
        <View style={styles.footerColumn}>
          <View style={styles.dataSourceContainer}>
            <View style={[
              styles.dataSourceDot, 
              { backgroundColor: dataSource === 'backend' ? '#007bff' : '#ffc107' }
            ]} />
            <Text style={styles.dataSourceText}>
              {dataSource === 'backend' ? 'Sincronizado' : 'Local'}
            </Text>
          </View>
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.locationCount}>
            {metrics.locationCount} GPS
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 2,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '500',
    textAlign: 'center',
  },
  secondaryMetrics: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  secondaryMetric: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 10,
    color: '#6c757d',
    marginBottom: 2,
    textAlign: 'center',
  },
  secondaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  precisionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  precisionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  precisionText: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: '600',
  },
  dataSourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataSourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dataSourceText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#495057',
  },
  locationCount: {
    fontSize: 10,
    color: '#6c757d',
    fontStyle: 'italic',
  },
});

export default RealTimeMetrics;
