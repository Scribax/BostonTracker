# AdvancedLocationService Integration API

## Nuevos Métodos en TripMetricsService

### Configuración Avanzada

#### `configureAdvancedSettings(settings)`
Configura parámetros del sistema avanzado de ubicación.

**Parámetros:**
```javascript
{
  useAdvancedFiltering: boolean,    // Activar filtrado avanzado
  useSensorFusion: boolean,         // Activar fusión con sensores
  kalmanFilterEnabled: boolean,     // Activar filtro Kalman
  minAccuracy: number,             // Precisión mínima GPS en metros
  restZoneRadius: number,          // Radio de zona de reposo en metros
  minValidDistance: number,        // Distancia mínima válida en metros
  minSpeedThreshold: number        // Velocidad mínima en km/h
}
```

**Ejemplo:**
```javascript
tripMetricsService.configureAdvancedSettings({
  useAdvancedFiltering: true,
  minAccuracy: 10,
  restZoneRadius: 12,
  minValidDistance: 3
});
```

#### `getAdvancedSettings()`
Obtiene la configuración actual del sistema avanzado.

**Retorna:** Objeto con todos los parámetros de configuración.

### Estadísticas y Monitoreo

#### `getAdvancedStats()`
Obtiene estadísticas del sistema avanzado de ubicación.

**Retorna:**
```javascript
{
  isAdvancedServiceAvailable: boolean,
  currentServiceStatus: object,
  recentLocationsCount: number,
  enhancedLocationsProcessed: number,
  standardLocationsProcessed: number
}
```

## Nuevas Propiedades en Ubicaciones

Cada ubicación procesada ahora incluye:

```javascript
{
  latitude: number,
  longitude: number,
  accuracy: number,
  timestamp: string,
  altitude: number,
  heading: number,
  speed: number,
  isEnhanced: boolean,        // NUEVO: Si fue mejorada por AdvancedLocationService
  kalmanFiltered: boolean,    // NUEVO: Si pasó por filtro Kalman
  confidence: number          // NUEVO: Nivel de confianza (0-1)
}
```

## Logs de Depuración

El sistema ahora proporciona logs detallados:

```
🎯 Ubicación procesada con AdvancedLocationService:
   originalAccuracy: 15.3m
   enhancedAccuracy: 8.7m
   confidence: 0.85
   kalmanFiltered: true

🔍 Análisis de reposo: 8/10 ubicaciones dentro de 15m (máx: 12.4m)
```

## Configuración Recomendada

Para mayor precisión:
```javascript
tripMetricsService.configureAdvancedSettings({
  useAdvancedFiltering: true,
  useSensorFusion: true,
  kalmanFilterEnabled: true,
  minAccuracy: 10,           // Más estricto
  restZoneRadius: 12,        // Radio más pequeño
  minValidDistance: 3,       // Más sensible al movimiento
  minSpeedThreshold: 1.5     // Detectar movimientos lentos
});
```

Para mayor eficiencia:
```javascript
tripMetricsService.configureAdvancedSettings({
  useAdvancedFiltering: true,
  useSensorFusion: false,    // Deshabilitar sensores adicionales
  kalmanFilterEnabled: true,
  minAccuracy: 15,
  restZoneRadius: 20,
  minValidDistance: 8,
  minSpeedThreshold: 3
});
```
