import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useConnectivity } from '../contexts/ConnectivityContext';
import apiService from '../services/apiService';
import syncService from '../services/syncService';
import disconnectionService from '../services/disconnectionService';
import tripMetricsService from '../services/tripMetricsService';
import ServiceUnavailable from '../components/ServiceUnavailable';
import ServiceOfflineWithActiveTrip from '../components/ServiceOfflineWithActiveTrip';
import RealTimeMetrics from '../components/RealTimeMetrics';

// Importación condicional de socketService
let socketService = null;
try {
  socketService = require('../services/socketService').default;
} catch (error) {
  console.warn('Socket.io no disponible, usando solo HTTP polling:', error.message);
  // Crear mock de socketService para evitar errores
  socketService = {
    connect: () => {},
    disconnect: () => {},
    on: () => {},
    off: () => {},
    emit: () => {},
    isSocketConnected: () => false
  };
}
import { StatusBar } from 'expo-status-bar';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { isOnline, isChecking, lastCheckTime, forceCheck, checkConnectivity } = useConnectivity();
  const {
    isTracking,
    mileage,
    formatMileage,
    getTripDuration,
    startTracking,
    stopTracking,
    error: locationError
  } = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [tripData, setTripData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Si no hay conectividad durante un viaje activo, mostrar pantalla especial
  if (!isOnline && isTracking) {
    return (
      <ServiceOfflineWithActiveTrip 
        onRetry={forceCheck}
        isRetrying={isChecking}
        lastCheckTime={lastCheckTime}
        mileage={mileage}
        formatMileage={formatMileage}
        startTime={startTime}
        formatDuration={formatDuration}
        user={user}
      />
    );
  }

  // Si no hay conectividad sin viaje activo, mostrar ServiceUnavailable normal
  if (!isOnline) {
    return (
      <ServiceUnavailable 
        onRetry={forceCheck}
        isRetrying={isChecking}
        lastCheckTime={lastCheckTime}
      />
    );
  }

  // Cargar datos del viaje activo al montar e inicializar métricas
  useEffect(() => {
    const initializeApp = async () => {
      await loadActiveTrip();
      
      // Inicializar servicio de métricas
      try {
        await tripMetricsService.loadCurrentTrip();
        await tripMetricsService.loadTripHistory();
        console.log('📊 Servicio de métricas inicializado');
      } catch (error) {
        console.warn('Error inicializando métricas:', error);
      }
    };
    
    initializeApp();
  }, []);

  // Conectar sincronización cuando el usuario esté autenticado
  useEffect(() => {
    if (user && user.id) {
      console.log('👤 Usuario autenticado, iniciando sincronización:', user.id);
      
      // Intentar conectar Socket.io primero
      try {
        socketService.connect(user.id);
        console.log('🔌 Intentando conectar vía Socket.io...');
      } catch (error) {
        console.warn('❌ Socket.io no disponible, usando HTTP polling como fallback');
      }
      
      // Iniciar sincronización HTTP como fallback (siempre activo)
      syncService.startSync(user.id);
      
      // Configurar listeners para eventos del servidor
      const handleTripStatusChanged = (data) => {
        console.log('📡 Estado del viaje cambió desde el servidor:', data);
        
        if (data.action === 'stopped') {
          // El dashboard detuvo el viaje remotamente
          Alert.alert(
            '🛑 Viaje Detenido',
            `Tu viaje ha sido detenido remotamente desde el dashboard.\n\nDistancia total: ${(data.totalMileage || 0).toFixed(2)} km\nDuración: ${data.totalDuration || 0} min`,
            [
              {
                text: 'Entendido',
onPress: async () => {
                  try {
                    // 🔥 FINALIZAR SERVICIO DE MÉTRICAS
                    try {
                      if (tripMetricsService.hasActiveTrip()) {
                        console.log('📊 Finalizando métricas de viaje...');
                        const endResult = await tripMetricsService.endTrip();
                        if (endResult.success) {
                          console.log('✅ Métricas finalizadas:', {
                            distance: endResult.tripSummary.totalDistanceM + 'm',
                            time: endResult.tripSummary.formattedTime,
                            avgSpeed: endResult.tripSummary.averageSpeed + ' km/h'
                          });
                        } else {
                          console.warn('⚠️ Error finalizando métricas:', endResult.error);
                        }
                      }
                    } catch (metricsError) {
                      console.error('🚨 Error en finalización de métricas:', metricsError);
                    }
                    
                    // Detener el tracking local
                    await stopTracking(async () => {
                      // No enviar petición al servidor ya que fue detenido remotamente
                      return { success: true };
                    });
                    
                    // Recargar datos
                    await loadActiveTrip();
                  } catch (error) {
                    console.error('Error procesando detención remota:', error);
                  }
                }
              }
            ],
            { cancelable: false }
          );
        } else if (data.action === 'started') {
          // El dashboard inició un viaje remotamente (caso poco probable)
          console.log('📍 Viaje iniciado remotamente:', data);
          Alert.alert(
            '▶️ Viaje Iniciado',
            'Se ha iniciado un nuevo viaje desde el dashboard.',
            [{ text: 'OK', onPress: () => loadActiveTrip() }]
          );
        }
      };
      
      const handleSocketConnected = (data) => {
        console.log('✅ Socket conectado exitosamente:', data.socketId);
      };
      
      const handleSocketDisconnected = (data) => {
        console.log('🔌 Socket desconectado:', data.reason);
      };
      
      const handleConnectionError = (data) => {
        console.warn('❌ Error de conexión Socket:', data.error);
      };
      
      // Registrar listeners para Socket.io
      socketService.on('tripStatusChanged', handleTripStatusChanged);
      socketService.on('connected', handleSocketConnected);
      socketService.on('disconnected', handleSocketDisconnected);
      socketService.on('connection_error', handleConnectionError);
      
      // Registrar listener para HTTP polling como fallback
      syncService.onStatusChange(handleTripStatusChanged);
      
      // Establecer estado inicial para sincronización
      const currentTrip = tripData || null;
      syncService.setInitialTripStatus(!!currentTrip);
      
      // Cleanup al desmontar
      return () => {
        try {
          socketService.off('tripStatusChanged', handleTripStatusChanged);
          socketService.off('connected', handleSocketConnected);
          socketService.off('disconnected', handleSocketDisconnected);
          socketService.off('connection_error', handleConnectionError);
          socketService.disconnect();
        } catch (error) {
          console.warn('Error en cleanup de socketService:', error);
        }
        
        // Cleanup del syncService
        syncService.offStatusChange(handleTripStatusChanged);
        syncService.stopSync();
      };
    }
  }, [user]);

  // Actualizar datos cada minuto cuando está tracking
  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        // Forzar re-render para actualizar duración
        setTripData(prev => ({ ...prev }));
      }, 60000); // Cada minuto
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  // Monitorear cambios de conectividad y notificar al dashboard automáticamente
  useEffect(() => {
    if (!user?.id) return;

    let notificationTimeout = null;

    const handleConnectivityChange = async () => {
      if (!isOnline && isTracking && tripData) {
        // Se perdió conexión durante un viaje activo
        console.log('🚨 Detectada pérdida de conexión durante viaje activo');
        
        // Esperar un momento antes de notificar para evitar notificaciones por desconexiones temporales
        notificationTimeout = setTimeout(async () => {
          try {
            // Intentar obtener ubicación actual para la notificación
            let currentLocation = null;
            try {
              const { getCurrentPosition } = require('../contexts/LocationContext');
              if (getCurrentPosition) {
                currentLocation = await getCurrentPosition();
              }
            } catch (error) {
              console.warn('No se pudo obtener ubicación para notificación:', error);
            }

            // Notificar desconexión al dashboard
            await disconnectionService.notifyDisconnection(
              user.id, 
              tripData, 
              currentLocation
            );
          } catch (error) {
            console.error('Error notificando desconexión:', error);
          }
        }, 5000); // Esperar 5 segundos antes de notificar
        
      } else if (isOnline && disconnectionService.hasPendingDisconnection()) {
        // Se recuperó la conexión y había una desconexión pendiente
        console.log('🎉 Detectada recuperación de conexión, notificando al dashboard');
        
        // Limpiar timeout de notificación si existe
        if (notificationTimeout) {
          clearTimeout(notificationTimeout);
          notificationTimeout = null;
        }

        try {
          // Intentar obtener ubicación actual para la notificación
          let currentLocation = null;
          try {
            const { getCurrentPosition } = require('../contexts/LocationContext');
            if (getCurrentPosition) {
              currentLocation = await getCurrentPosition();
            }
          } catch (error) {
            console.warn('No se pudo obtener ubicación para notificación de reconexión:', error);
          }

          // Notificar reconexión al dashboard
          await disconnectionService.notifyReconnection(
            user.id,
            tripData,
            currentLocation
          );
        } catch (error) {
          console.error('Error notificando reconexión:', error);
        }
      }
    };

    // Ejecutar la lógica cuando cambie la conectividad
    handleConnectivityChange();

    // Cleanup
    return () => {
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
    };
  }, [isOnline, isTracking, tripData, user?.id]);

  // Resetear notificaciones cuando se termine un viaje
  useEffect(() => {
    if (!isTracking && !tripData) {
      // El viaje terminó, resetear las notificaciones de desconexión
      disconnectionService.resetNotificationFlags();
    }
  }, [isTracking, tripData]);

  const loadActiveTrip = async () => {
    try {
      const result = await apiService.getMyActiveTrip();
      if (result.success && result.data) {
        setTripData(result.data);
        setStartTime(new Date(result.data.startTime));
      } else {
        // Si no es un error de conectividad, limpiar datos
        if (result.error && !result.error.includes('Error de conexión')) {
          setTripData(null);
          setStartTime(null);
        }
      }
    } catch (error) {
      console.error('Error cargando viaje activo:', error);
      // Si es un error de conectividad, verificar inmediatamente
      if (error.message && error.message.includes('Error de conexión')) {
        console.log('🚨 Error de conectividad detectado, verificando backend...');
        setTimeout(() => {
          checkConnectivity();
        }, 500);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActiveTrip();
    setRefreshing(false);
  };

  const handleStartTrip = async () => {
    if (isTracking) return;

    Alert.alert(
      'Iniciar Viaje',
      'Se iniciará el seguimiento de tu ubicación para calcular la distancia recorrida con precisión GPS.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            setIsLoading(true);
            
            try {
              const success = await startTracking(async (location) => {
                // Iniciar viaje en el servidor
                const result = await apiService.startTrip(user.id, location);
                if (result.success) {
                  setTripData(result.data);
                  setStartTime(new Date());
                  
                  // 🔥 INICIAR SERVICIO DE MÉTRICAS REALES
                  try {
                    console.log('📊 Iniciando servicio de métricas de viaje...');
                    await tripMetricsService.loadCurrentTrip(); // Cargar datos previos si existen
                    const metricsResult = await tripMetricsService.startTrip(user.id, result.data.tripId);
                    if (metricsResult.success) {
                      console.log('✅ Servicio de métricas iniciado:', metricsResult.tripId);
                    } else {
                      console.warn('⚠️ Error iniciando métricas:', metricsResult.error);
                    }
                  } catch (metricsError) {
                    console.error('🚨 Error crítico en métricas:', metricsError);
                    // No fallar el viaje por error en métricas
                  }
                  
                  return result;
                } else {
                  throw new Error(result.error);
                }
              });

              if (!success) {
                Alert.alert(
                  'Error',
                  'No se pudo iniciar el viaje. Verifica los permisos de ubicación.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Error iniciando viaje:', error);
              Alert.alert(
                'Error',
                error.message || 'No se pudo iniciar el viaje',
                [{ text: 'OK' }]
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Función para mostrar info del viaje en curso (no puede detenerlo)
  const handleViewTripInfo = () => {
    const duration = formatDuration();
    const distance = formatMileage(mileage);
    
    Alert.alert(
      '🚴‍♂️ Viaje en Curso',
      `Tu viaje está siendo registrado automáticamente.\n\n` +
      `📍 Distancia recorrida: ${distance}\n` +
      `⏱️ Tiempo transcurrido: ${duration}\n\n` +
      `ℹ️ Solo el administrador puede detener el viaje desde el dashboard.`,
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  const handleLogout = async () => {
    // Prevenir logout si hay un viaje activo
    if (isTracking) {
      Alert.alert(
        '🚨 No se puede cerrar sesión',
        'Tienes un viaje activo en curso. Solo el administrador puede detener el viaje desde el dashboard.\n\nSi necesitas cerrar sesión urgentemente, contacta a tu supervisor.',
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Cerrando sesión...');
              await logout();
              console.log('✅ Logout completado');
            } catch (error) {
              console.error('❌ Error en logout:', error);
              // Forzar logout incluso si hay error
              await logout();
            }
          }
        }
      ]
    );
  };

  const formatDuration = () => {
    if (!startTime) return '0 min';
    
    const now = new Date();
    const diffMs = now - startTime;
    const minutes = Math.floor(diffMs / 1000 / 60);
    
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#dc3545']}
            tintColor="#dc3545"
          />
        }
      >
        {/* Header con info del usuario */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>¡Hola!</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>Delivery • ID: {user?.employeeId}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Estado del tracking */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Estado del Viaje</Text>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: isTracking ? '#28a745' : '#6c757d' }
            ]}>
              <View style={styles.statusDot} />
            </View>
          </View>
          
          <Text style={styles.statusText}>
            {isTracking ? '🚴‍♂️ En curso' : '🏠 Sin viaje activo'}
          </Text>
          
          {locationError && (
            <Text style={styles.errorText}>⚠️ {locationError}</Text>
          )}
        </View>

        {/* Métricas del viaje */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Kilometraje</Text>
            <Text style={styles.metricValue}>
              {isTracking ? formatMileage(mileage) : '0.00 km'}
            </Text>
            <Text style={styles.metricUnit}>recorridos</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Duración</Text>
            <Text style={styles.metricValue}>
              {isTracking ? formatDuration() : '0 min'}
            </Text>
            <Text style={styles.metricUnit}>tiempo activo</Text>
          </View>
        </View>

        {/* 🔥 MÉTRICAS EN TIEMPO REAL CON GPS PRECISO */}
        <RealTimeMetrics isActive={isTracking} />

        {/* Botón principal */}
        <View style={styles.actionContainer}>
          {isTracking ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.infoButton]}
              onPress={handleViewTripInfo}
            >
              <Text style={styles.actionButtonText}>📊 Ver Información del Viaje</Text>
              <Text style={styles.actionButtonSubtext}>
                Solo el administrador puede detener el viaje
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={handleStartTrip}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.actionButtonText}>▶️ Iniciar Viaje</Text>
                  <Text style={styles.actionButtonSubtext}>
                    Comenzar seguimiento de distancia
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Información adicional */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ℹ️ Información</Text>
          <Text style={styles.infoText}>
            • Esta app calcula automáticamente la distancia recorrida durante tus entregas
          </Text>
          <Text style={styles.infoText}>
            • El seguimiento funciona en segundo plano mientras realizas tus entregas
          </Text>
          <Text style={styles.infoText}>
            • Los datos se sincronizan automáticamente con el sistema
          </Text>
          <Text style={styles.infoText}>
            • Solo el administrador desde el dashboard puede detener tus viajes
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>BOSTON American Burgers</Text>
          <Text style={styles.versionText}>Tracker v1.0.0</Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6c757d',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
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
  statusText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 4,
  },
  metricUnit: {
    fontSize: 12,
    color: '#6c757d',
  },
  actionContainer: {
    marginBottom: 32,
  },
  actionButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  infoButton: {
    backgroundColor: '#17a2b8',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#6c757d',
  },
});

export default HomeScreen;
