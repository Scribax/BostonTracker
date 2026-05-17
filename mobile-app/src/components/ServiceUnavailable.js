import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ServiceUnavailable = ({ onRetry, isRetrying = false, lastCheckTime }) => {
  const insets = useSafeAreaInsets();
  
  // Formatear tiempo desde la última verificación
  const getLastCheckText = () => {
    if (!lastCheckTime) return '';
    
    const now = new Date();
    const diff = Math.floor((now - lastCheckTime) / 1000); // segundos
    
    if (diff < 60) return `Última verificación: ${diff}s`;
    if (diff < 3600) return `Última verificación: ${Math.floor(diff / 60)}m`;
    return `Última verificación: ${Math.floor(diff / 3600)}h`;
  };

  return (
    <>
      <StatusBar style="light" />
      {/* Vista para el fondo del StatusBar sin warning */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <View style={styles.container}>
        {/* Header con logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🍔</Text>
          </View>
          <Text style={styles.brandText}>BOSTON</Text>
          <Text style={styles.subBrandText}>American Burgers</Text>
        </View>

        {/* Mensaje principal */}
        <View style={styles.messageContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
          </View>
          
          <Text style={styles.mainTitle}>SERVICIO NO DISPONIBLE</Text>
          <Text style={styles.mainMessage}>
            No se puede conectar con el servidor.{'\n'}
            Verifica tu conexión a internet y que el servidor esté funcionando.
          </Text>

          {/* Información de estado */}
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Text style={styles.statusDot}>🔴</Text>
              <Text style={styles.statusText}>Servidor desconectado</Text>
            </View>
            
            {lastCheckTime && (
              <Text style={styles.lastCheckText}>
                {getLastCheckText()}
              </Text>
            )}
          </View>
        </View>

        {/* Botón de reintentar */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
            onPress={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <View style={styles.retryButtonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.retryButtonText}>Verificando...</Text>
              </View>
            ) : (
              <Text style={styles.retryButtonText}>🔄 Reintentar Conexión</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>
            💡 Tip: La aplicación reintentará automáticamente cada pocos segundos
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            La aplicación se habilitará automáticamente cuando el servidor esté disponible
          </Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  logoEmoji: {
    fontSize: 40,
  },
  brandText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 4,
  },
  subBrandText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  messageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  mainMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    fontSize: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '600',
  },
  lastCheckText: {
    fontSize: 12,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  actionContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 200,
  },
  retryButtonDisabled: {
    backgroundColor: '#6c757d',
    elevation: 0,
    shadowOpacity: 0,
  },
  retryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#adb5bd',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  statusBarBackground: {
    backgroundColor: '#dc3545',
  },
});

export default ServiceUnavailable;
