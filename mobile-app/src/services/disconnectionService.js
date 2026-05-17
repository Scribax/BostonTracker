// Servicio para manejar notificaciones de desconexión durante viajes activos
class DisconnectionService {
  constructor() {
    this.notificationSent = false;
    this.reconnectionNotificationSent = false;
    this.lastDisconnectionTime = null;
  }

  // Notificar al dashboard que el delivery perdió conexión durante un viaje
  async notifyDisconnection(userId, tripData, location = null) {
    try {
      if (this.notificationSent) {
        console.log('⚠️ Notificación de desconexión ya enviada, omitiendo...');
        return;
      }

      console.log('📡 Notificando desconexión al dashboard...');
      
      const disconnectionData = {
        deliveryId: userId,
        timestamp: new Date().toISOString(),
        event: 'connection_lost',
        tripId: tripData?.id || null,
        lastKnownLocation: location,
        currentMileage: tripData?.totalMileage || 0,
        tripStartTime: tripData?.startTime || null
      };

      // Intentar notificar via Socket.io si está disponible
      let socketService = null;
      try {
        socketService = require('./socketService').default;
        if (socketService && socketService.isSocketConnected()) {
          console.log('📡 Enviando notificación via Socket.io...');
          socketService.emit('delivery_disconnected', disconnectionData);
          this.notificationSent = true;
          this.lastDisconnectionTime = new Date();
          return { success: true, method: 'socket' };
        }
      } catch (error) {
        console.warn('Socket.io no disponible para notificación de desconexión');
      }

      // Si Socket.io no está disponible, usar HTTP como fallback
      const apiService = require('./apiService').default;
      const result = await apiService.notifyDeliveryDisconnection(disconnectionData);
      
      if (result.success) {
        console.log('✅ Notificación de desconexión enviada via HTTP');
        this.notificationSent = true;
        this.lastDisconnectionTime = new Date();
        return { success: true, method: 'http' };
      } else {
        throw new Error(result.error || 'Error al notificar desconexión');
      }

    } catch (error) {
      console.error('❌ Error notificando desconexión:', error);
      return { success: false, error: error.message };
    }
  }

  // Notificar al dashboard que el delivery recuperó conexión
  async notifyReconnection(userId, tripData = null, location = null) {
    try {
      if (!this.notificationSent || this.reconnectionNotificationSent) {
        console.log('⚠️ No hay desconexión previa o reconexión ya notificada, omitiendo...');
        return;
      }

      console.log('📡 Notificando reconexión al dashboard...');
      
      const reconnectionData = {
        deliveryId: userId,
        timestamp: new Date().toISOString(),
        event: 'connection_restored',
        tripId: tripData?.id || null,
        currentLocation: location,
        currentMileage: tripData?.totalMileage || 0,
        disconnectionDuration: this.lastDisconnectionTime ? 
          Math.floor((new Date() - this.lastDisconnectionTime) / 1000) : null
      };

      // Intentar notificar via Socket.io si está disponible
      let socketService = null;
      try {
        socketService = require('./socketService').default;
        if (socketService && socketService.isSocketConnected()) {
          console.log('📡 Enviando notificación de reconexión via Socket.io...');
          socketService.emit('delivery_reconnected', reconnectionData);
          this.reconnectionNotificationSent = true;
          this.resetNotificationFlags();
          return { success: true, method: 'socket' };
        }
      } catch (error) {
        console.warn('Socket.io no disponible para notificación de reconexión');
      }

      // Si Socket.io no está disponible, usar HTTP como fallback
      const apiService = require('./apiService').default;
      const result = await apiService.notifyDeliveryReconnection(reconnectionData);
      
      if (result.success) {
        console.log('✅ Notificación de reconexión enviada via HTTP');
        this.reconnectionNotificationSent = true;
        this.resetNotificationFlags();
        return { success: true, method: 'http' };
      } else {
        throw new Error(result.error || 'Error al notificar reconexión');
      }

    } catch (error) {
      console.error('❌ Error notificando reconexión:', error);
      return { success: false, error: error.message };
    }
  }

  // Reiniciar banderas de notificación
  resetNotificationFlags() {
    this.notificationSent = false;
    this.reconnectionNotificationSent = false;
    this.lastDisconnectionTime = null;
    console.log('🔄 Banderas de notificación reiniciadas');
  }

  // Verificar si hay una desconexión pendiente de notificar
  hasPendingDisconnection() {
    return this.notificationSent && !this.reconnectionNotificationSent;
  }

  // Obtener tiempo transcurrido desde la última desconexión
  getDisconnectionDuration() {
    if (!this.lastDisconnectionTime) return 0;
    return Math.floor((new Date() - this.lastDisconnectionTime) / 1000);
  }
}

// Instancia singleton
const disconnectionService = new DisconnectionService();

export default disconnectionService;
