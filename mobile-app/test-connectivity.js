#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://192.168.1.36:5000/api';

console.log('🔍 Probando sistema de conectividad de la aplicación móvil\n');

// Función para probar el health check
async function testHealthCheck() {
  try {
    console.log('📡 Probando health check...');
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    
    console.log('✅ Backend disponible:');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Message: ${response.data.message}`);
    console.log(`   Timestamp: ${response.data.timestamp}`);
    return true;
  } catch (error) {
    console.log('❌ Backend no disponible:');
    console.log(`   Error: ${error.message}`);
    if (error.code) console.log(`   Code: ${error.code}`);
    return false;
  }
}

// Función para probar el endpoint de autenticación
async function testAuthEndpoint() {
  try {
    console.log('\n🔐 Probando endpoint de login...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      employeeId: 'TEST',
      password: 'test'
    }, { timeout: 5000 });
    
    console.log('✅ Endpoint de auth disponible (aunque credenciales sean incorrectas)');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Endpoint de auth disponible (respuesta de credenciales inválidas esperada)');
      return true;
    } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.log('❌ Endpoint de auth no disponible:');
      console.log(`   Error: ${error.message}`);
      return false;
    } else {
      console.log('✅ Endpoint de auth disponible (respuesta de error esperada)');
      return true;
    }
  }
}

// Función principal de prueba
async function runConnectivityTest() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 PRUEBA DE CONECTIVIDAD - BOSTON TRACKER MOBILE APP');
  console.log('═══════════════════════════════════════════════════════');
  
  const healthCheckOk = await testHealthCheck();
  const authEndpointOk = await testAuthEndpoint();
  
  console.log('\n📊 RESULTADOS:');
  console.log('───────────────────────────────────────────────────────');
  console.log(`Health Check:     ${healthCheckOk ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Auth Endpoint:    ${authEndpointOk ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Overall Status:   ${healthCheckOk && authEndpointOk ? '✅ ONLINE' : '❌ OFFLINE'}`);
  
  if (healthCheckOk && authEndpointOk) {
    console.log('\n🎉 El backend está completamente disponible.');
    console.log('   La aplicación móvil debería funcionar normalmente.');
  } else {
    console.log('\n⚠️  El backend no está completamente disponible.');
    console.log('   La aplicación móvil debería mostrar "SERVICIO NO DISPONIBLE".');
  }
  
  console.log('\n💡 Para probar la pantalla de "SERVICIO NO DISPONIBLE":');
  console.log('   1. Detén el backend');
  console.log('   2. Observa cómo la aplicación detecta la desconexión');
  console.log('   3. Reinicia el backend');
  console.log('   4. Observa cómo la aplicación se reconecta automáticamente');
  
  console.log('\n═══════════════════════════════════════════════════════');
}

// Ejecutar prueba
runConnectivityTest().catch(console.error);
