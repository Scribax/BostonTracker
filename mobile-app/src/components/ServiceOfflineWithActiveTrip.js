import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const ServiceOfflineWithActiveTrip = ({
  onRetry,
  isRetrying,
  lastCheckTime,
  mileage,
  formatMileage,
  startTime,
  formatDuration,
  user
}) => {
  const formatLastCheck = () => {
    if (!lastCheckTime) return 'Nunca';
    const now = new Date();
    const diff = Math.floor((now - lastCheckTime) / 1000);
    
    if (diff < 60) return `Hace ${diff} segundos`;
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    return `Hace ${Math.floor(diff / 3600)} horas`;
  };

  const getCurrentTripInfo = () => {
    if (!startTime) return { duration: '0 min', distance: '0.00 km' };
    
    const now = new Date();
    const diffMs = now - startTime;
    const minutes = Math.floor(diffMs / 1000 / 60);
    
    let duration;
    if (minutes < 60) {
      duration = `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      duration = `${hours}h ${remainingMinutes}min`;
    }
    
    const distance = formatMileage ? formatMileage(mileage || 0) : `${(mileage || 0).toFixed(2)} km`;
    
    return { duration, distance };
  };

  const tripInfo = getCurrentTripInfo();

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header con info del usuario */}
          <View style={styles.header}>
            <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
            <Text style={styles.userRole}>Delivery • ID: {user?.employeeId || 'N/A'}</Text>
          </View>

          {/* Icono y título principal */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📡</Text>
            <Text style={styles.title}>Sin Conexión</Text>
            <Text style={styles.subtitle}>
              No hay conexión a internet, pero tu viaje sigue activo
            </Text>
          </View>

          {/* Estado del viaje activo */}
          <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <Text style={styles.tripTitle}>🚴‍♂️ Viaje en Curso</Text>
              <View style={styles.activeIndicator}>
                <View style={styles.activeDot} />
              </View>
            </View>
            
            <View style={styles.tripMetrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Distancia</Text>
                <Text style={styles.metricValue}>{tripInfo.distance}</Text>
              </View>
              
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Duración</Text>
                <Text style={styles.metricValue}>{tripInfo.duration}</Text>
              </View>
            </View>
            
            <Text style={styles.tripNote}>
              📍 El tracking continúa funcionando localmente
            </Text>
          </View>

          {/* Información sobre la desconexión */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>ℹ️ ¿Qué está pasando?</Text>
            <Text style={styles.infoText}>
              • Tu viaje sigue siendo registrado localmente
            </Text>
            <Text style={styles.infoText}>
              • Los datos se sincronizarán automáticamente al reconectar
            </Text>
            <Text style={styles.infoText}>
              • El administrador ha sido notificado de la desconexión
            </Text>
            <Text style={styles.infoText}>
              • Solo el dashboard puede detener tu viaje
            </Text>
          </View>

          {/* Estado de última verificación */}
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Última verificación: {formatLastCheck()}
            </Text>
          </View>

          {/* Botón de reintento */}
          <TouchableOpacity
            style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
            onPress={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.retryButtonText}>🔄 Reintentar Conexión</Text>
            )}
          </TouchableOpacity>

          {/* Mensaje de tranquilidad */}
          <View style={styles.reassuranceCard}>
            <Text style={styles.reassuranceText}>
              😊 No te preocupes, tu viaje está siendo registrado correctamente y se sincronizará cuando la conexión se restablezca.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>BOSTON American Burgers</Text>
          <Text style={styles.versionText}>Modo Sin Conexión</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  userRole: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  tripCard: {
    backgroundColor: '#d4edda',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
  },
  activeIndicator: {
    width: 12,
    height: 12,
    backgroundColor: '#28a745',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  tripMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 4,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#155724',
  },
  tripNote: {
    fontSize: 14,
    color: '#155724',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 6,
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  retryButtonDisabled: {
    backgroundColor: '#6c757d',
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reassuranceCard: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  reassuranceText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    backgroundColor: '#fff',
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

export default ServiceOfflineWithActiveTrip;
