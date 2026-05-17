import api from './api';

class TripService {
  // Obtener historial de viajes completados
  async getTripHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'endTime',
        sortOrder: params.sortOrder || 'DESC'
      });

      const response = await api.get(`/trips/history?${queryParams}`);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        console.error('Error en respuesta del servidor:', response.data);
        return { success: false, message: 'Error obteniendo historial de viajes' };
      }
    } catch (error) {
      console.error('Error en getTripHistory:', error);
      
      if (error.response?.status === 401) {
        return { success: false, message: 'No autorizado. Inicia sesión nuevamente.' };
      } else if (error.response?.status === 403) {
        return { success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión con el servidor' 
      };
    }
  }

  // Obtener detalles de un viaje específico
  async getTripDetails(tripId) {
    try {
      const response = await api.get(`/trips/details/${tripId}`);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        console.error('Error en respuesta del servidor:', response.data);
        return { success: false, message: 'Error obteniendo detalles del viaje' };
      }
    } catch (error) {
      console.error('Error en getTripDetails:', error);
      
      if (error.response?.status === 401) {
        return { success: false, message: 'No autorizado. Inicia sesión nuevamente.' };
      } else if (error.response?.status === 403) {
        return { success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' };
      } else if (error.response?.status === 404) {
        return { success: false, message: 'Viaje no encontrado' };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión con el servidor' 
      };
    }
  }

  // Eliminar viaje del historial
  async deleteTrip(tripId) {
    try {
      const response = await api.delete(`/trips/details/${tripId}`);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        console.error('Error en respuesta del servidor:', response.data);
        return { success: false, message: 'Error eliminando viaje' };
      }
    } catch (error) {
      console.error('Error en deleteTrip:', error);
      
      if (error.response?.status === 401) {
        return { success: false, message: 'No autorizado. Inicia sesión nuevamente.' };
      } else if (error.response?.status === 403) {
        return { success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' };
      } else if (error.response?.status === 404) {
        return { success: false, message: 'Viaje no encontrado' };
      } else if (error.response?.status === 400) {
        return { success: false, message: error.response.data?.message || 'No se puede eliminar el viaje' };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión con el servidor' 
      };
    }
  }

  // Obtener estadísticas generales
  async getTripStats() {
    try {
      const historyResult = await this.getTripHistory({ limit: 1000 });
      
      if (historyResult.success) {
        const trips = historyResult.data || [];
        
        const stats = {
          totalTrips: trips.length,
          totalDistance: trips.reduce((acc, trip) => acc + (trip.mileage || 0), 0),
          totalDuration: trips.reduce((acc, trip) => acc + (trip.duration || 0), 0),
          averageSpeed: trips.length > 0 ? 
            trips.reduce((acc, trip) => acc + (trip.averageSpeed || 0), 0) / trips.length : 0,
          totalLocations: trips.reduce((acc, trip) => acc + (trip.totalLocations || 0), 0)
        };
        
        return { success: true, data: stats };
      }
      
      return historyResult;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { success: false, message: 'Error obteniendo estadísticas' };
    }
  }
}

const tripService = new TripService();
export default tripService;
