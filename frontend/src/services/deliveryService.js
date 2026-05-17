import api from './api';

class DeliveryService {
  
  // Obtener deliveries activos
  async getActiveDeliveries() {
    try {
      const response = await api.get('deliveries');
      return {
        success: true,
        data: response.data.data,
        count: response.data.count
      };
    } catch (error) {
      console.error('Error obteniendo deliveries activos:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error obteniendo deliveries'
      };
    }
  }

  // Iniciar viaje de delivery
  async startTrip(deliveryId, location = null) {
    try {
      const payload = {};
      if (location) {
        payload.latitude = location.latitude;
        payload.longitude = location.longitude;
        payload.accuracy = location.accuracy;
      }

      const response = await api.post(`/deliveries/${deliveryId}/start`, payload);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error iniciando viaje:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error iniciando viaje'
      };
    }
  }

  // Detener viaje de delivery
  async stopTrip(deliveryId) {
    try {
      const response = await api.post(`/deliveries/${deliveryId}/stop`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deteniendo viaje:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error deteniendo viaje'
      };
    }
  }

  // Obtener historial de ubicaciones
  async getDeliveryHistory(deliveryId, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.tripId) params.append('tripId', options.tripId);
      if (options.limit) params.append('limit', options.limit);

      const response = await api.get(`/deliveries/${deliveryId}/history?${params}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error obteniendo historial'
      };
    }
  }

  // Actualizar ubicación (usado por admin para simular)
  async updateLocation(deliveryId, location) {
    try {
      const response = await api.post(`/deliveries/${deliveryId}/location`, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || null
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error actualizando ubicación'
      };
    }
  }

  // Obtener viaje activo propio (para deliverys)
  async getMyActiveTrip() {
    try {
      const response = await api.get('deliveries/my-trip');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error obteniendo mi viaje activo:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error obteniendo viaje activo'
      };
    }
  }

  // Formatear datos de delivery para el mapa
  formatDeliveryForMap(delivery) {
    if (!delivery.currentLocation) return null;

    return {
      id: delivery.id,
      deliveryId: delivery.deliveryId,
      name: delivery.deliveryName,
      employeeId: delivery.employeeId,
      latitude: delivery.currentLocation.latitude,
      longitude: delivery.currentLocation.longitude,
      mileage: delivery.mileage,
      duration: delivery.duration,
      averageSpeed: delivery.averageSpeed,
      status: delivery.status,
      startTime: new Date(delivery.startTime),
      lastUpdate: delivery.currentLocation.timestamp ? 
        new Date(delivery.currentLocation.timestamp) : new Date()
    };
  }

  // Calcular tiempo desde última actualización
  getTimeSinceLastUpdate(lastUpdate) {
    const now = new Date();
    const diffMs = now - new Date(lastUpdate);
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Hace menos de 1 min';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours}h ${diffMinutes % 60}min`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  }

  // Formatear duración en formato legible
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return `${hours}h ${remainingMinutes}min`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  // Formatear kilometraje
  formatMileage(km) {
    if (km < 1) {
      return `${(km * 1000).toFixed(0)} m`;
    }
    return `${km.toFixed(2)} km`;
  }
}

const deliveryService = new DeliveryService();
export default deliveryService;
