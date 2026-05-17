import { Alert, Linking, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

class BatteryOptimizationHelper {
  
  // Verificar y solicitar exclusión de optimización de batería
  async requestBatteryOptimizationExemption() {
    if (Platform.OS !== 'android') return true;

    try {
      Alert.alert(
        '🔋 Configuración Crítica para Deliveries',
        'Para mantener el GPS activo cuando guardas el teléfono en el bolsillo:\n\n' +
        '1️⃣ Optimización de Batería:\n' +
        '   • Ve a Configuración → Batería\n' +
        '   • Optimización de batería\n' +
        '   • Busca "Boston Tracker"\n' +
        '   • Selecciona "No optimizar"\n\n' +
        '2️⃣ Administración de Energía:\n' +
        '   • Busca "Administración de energía"\n' +
        '   • Aplicaciones protegidas\n' +
        '   • Activar Boston Tracker\n\n' +
        '3️⃣ Inicio Automático:\n' +
        '   • Configuración → Apps\n' +
        '   • Boston Tracker → Inicio automático\n' +
        '   • Activar todas las opciones',
        [
          { 
            text: 'Ir a Configuración', 
            onPress: () => this.openBatterySettings() 
          },
          { 
            text: 'Configurar Después', 
            style: 'cancel' 
          }
        ]
      );

      return true;
    } catch (error) {
      console.error('Error configurando optimización de batería:', error);
      return false;
    }
  }

  // Abrir configuración de batería
  async openBatterySettings() {
    try {
      if (Platform.OS === 'android') {
        // Intentar abrir configuración de optimización de batería
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          {
            data: 'package:com.bostonburgers.tracker'
          }
        );
      } else {
        // Para iOS, abrir configuración general
        await Linking.openSettings();
      }
    } catch (error) {
      console.log('No se pudo abrir configuración específica, abriendo configuración general');
      await Linking.openSettings();
    }
  }

  // Mostrar guía de configuración manual
  showManualConfigGuide() {
    Alert.alert(
      '📱 Guía de Configuración Manual',
      'Si el GPS se detiene en background, configura manualmente:\n\n' +
      '🔋 BATERÍA:\n' +
      '• Configuración → Batería → Optimización → Boston Tracker → No optimizar\n\n' +
      '🚀 INICIO AUTOMÁTICO:\n' +
      '• Configuración → Apps → Boston Tracker → Inicio automático → Activar\n\n' +
      '🔒 BLOQUEO DE PANTALLA:\n' +
      '• Permitir que la app funcione con pantalla bloqueada\n\n' +
      '📍 UBICACIÓN:\n' +
      '• Configuración → Ubicación → Boston Tracker → Permitir siempre',
      [
        { text: 'Entendido', style: 'default' },
        { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
      ]
    );
  }

  // Verificar si las configuraciones están optimizadas
  async checkOptimizationStatus() {
    // Esta función ayuda a verificar si las configuraciones están correctas
    const issues = [];

    try {
      // Verificar permisos de ubicación
      const Location = require('expo-location');
      const backgroundPermission = await Location.getBackgroundPermissionsAsync();
      
      if (backgroundPermission.status !== 'granted') {
        issues.push({
          type: 'permission',
          message: 'Permiso de ubicación en background no concedido',
          solution: 'Ir a Configuración → Apps → Boston Tracker → Permisos → Ubicación → Permitir siempre'
        });
      }

      // Verificar servicios de ubicación
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
        issues.push({
          type: 'service',
          message: 'Servicios de ubicación deshabilitados',
          solution: 'Activar GPS en Configuración → Ubicación'
        });
      }

    } catch (error) {
      console.error('Error verificando estado de optimización:', error);
    }

    return {
      isOptimized: issues.length === 0,
      issues: issues
    };
  }
}

const batteryOptimizationHelper = new BatteryOptimizationHelper();
export default batteryOptimizationHelper;
