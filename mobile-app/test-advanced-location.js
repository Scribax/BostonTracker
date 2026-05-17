/**
 * Script de prueba para verificar la integración del AdvancedLocationService
 * con TripMetricsService
 */

import tripMetricsService from './src/services/tripMetricsService.js';
import advancedLocationService from './src/services/advancedLocationService.js';

async function testAdvancedLocationIntegration() {
  console.log('🧪 Iniciando pruebas de integración AdvancedLocationService\n');

  try {
    // 1. Verificar disponibilidad del servicio avanzado
    console.log('1️⃣ Verificando disponibilidad del AdvancedLocationService...');
    const isAvailable = advancedLocationService.isAvailable();
    console.log(`   ✅ AdvancedLocationService disponible: ${isAvailable}\n`);

    // 2. Obtener configuración actual
    console.log('2️⃣ Configuración actual del TripMetricsService:');
    const currentSettings = tripMetricsService.getAdvancedSettings();
    console.log('   ', JSON.stringify(currentSettings, null, 2), '\n');

    // 3. Configurar parámetros para pruebas
    console.log('3️⃣ Configurando parámetros de prueba...');
    tripMetricsService.configureAdvancedSettings({
      useAdvancedFiltering: true,
      useSensorFusion: true,
      kalmanFilterEnabled: true,
      minAccuracy: 10,
      restZoneRadius: 12,
      minValidDistance: 3,
      minSpeedThreshold: 1.5
    });

    // 4. Iniciar viaje de prueba
    console.log('4️⃣ Iniciando viaje de prueba...');
    const startResult = await tripMetricsService.startTrip('test-user-123');
    
    if (startResult.success) {
      console.log(`   ✅ Viaje iniciado: ${startResult.tripId}\n`);
      
      // 5. Simular ubicaciones GPS
      console.log('5️⃣ Simulando procesamiento de ubicaciones GPS...');
      
      const testLocations = [
        // Ubicación inicial (alta precisión)
        { latitude: -34.6118, longitude: -58.3960, accuracy: 8.5, speed: 0 },
        // Pequeñas variaciones (deriva GPS)
        { latitude: -34.6118, longitude: -58.3961, accuracy: 12.3, speed: 0 },
        { latitude: -34.6119, longitude: -58.3960, accuracy: 15.1, speed: 0 },
        { latitude: -34.6118, longitude: -58.3959, accuracy: 9.2, speed: 0 },
        { latitude: -34.6117, longitude: -58.3960, accuracy: 11.8, speed: 0 },
        // Movimiento real
        { latitude: -34.6120, longitude: -58.3965, accuracy: 7.4, speed: 5.2 },
        { latitude: -34.6125, longitude: -58.3970, accuracy: 6.8, speed: 12.1 },
        { latitude: -34.6130, longitude: -58.3975, accuracy: 5.9, speed: 18.5 }
      ];

      for (let i = 0; i < testLocations.length; i++) {
        console.log(`   📍 Procesando ubicación ${i + 1}/${testLocations.length}...`);
        
        const result = await tripMetricsService.processLocation(testLocations[i]);
        
        if (result.success && result.metrics) {
          console.log(`      Distancia: ${result.metrics.totalDistanceM}m`);
          console.log(`      Velocidad: ${result.metrics.currentSpeed} km/h`);
          console.log(`      Ubicaciones: ${result.metrics.locationCount}`);
        } else {
          console.log(`      ⚠️  ${result.error || 'Ubicación ignorada'}`);
        }
        
        // Pequeña pausa entre ubicaciones
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 6. Obtener estadísticas avanzadas
      console.log('\n6️⃣ Estadísticas del sistema avanzado:');
      const advancedStats = tripMetricsService.getAdvancedStats();
      console.log('   ', JSON.stringify(advancedStats, null, 2), '\n');

      // 7. Obtener métricas finales
      console.log('7️⃣ Métricas finales del viaje:');
      const finalMetrics = tripMetricsService.getCurrentMetrics();
      console.log(`   Distancia total: ${finalMetrics.totalDistanceM}m`);
      console.log(`   Tiempo: ${finalMetrics.formattedTime}`);
      console.log(`   Velocidad promedio: ${finalMetrics.averageSpeed} km/h`);
      console.log(`   Velocidad máxima: ${finalMetrics.maxSpeed} km/h`);
      console.log(`   Ubicaciones procesadas: ${finalMetrics.locationCount}\n`);

      // 8. Finalizar viaje
      console.log('8️⃣ Finalizando viaje...');
      const endResult = await tripMetricsService.endTrip();
      
      if (endResult.success) {
        console.log(`   ✅ Viaje finalizado exitosamente`);
        console.log(`   📊 Resumen: ${endResult.tripSummary.totalDistanceM}m en ${endResult.tripSummary.formattedTime}\n`);
      } else {
        console.log(`   ❌ Error finalizando viaje: ${endResult.error}\n`);
      }

    } else {
      console.log(`   ❌ Error iniciando viaje: ${startResult.error}\n`);
    }

    console.log('🎉 Pruebas de integración completadas!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas si este archivo se ejecuta directamente
if (typeof require !== 'undefined' && require.main === module) {
  testAdvancedLocationIntegration();
}

export default testAdvancedLocationIntegration;
