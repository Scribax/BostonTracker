import apiService from './apiService';

class SyncService {
  constructor() {
    this.isPolling = false;
    this.pollInterval = null;
    this.lastTripStatus = null;
    this.statusChangeListeners = [];
    this.currentUserId = null;
  }

  // Iniciar sincronización
  startSync(userId) {
    this.currentUserId = userId;
    
    if (this.isPolling) {
      console.log('🔄 Sincronización ya está activa');
      return;
    }

    console.log('🚀 Iniciando sincronización HTTP polling...');
    this.isPolling = true;

    // Polling cada 2 segundos para verificar estado del viaje
    this.pollInterval = setInterval(async () => {
      await this.checkTripStatus();
    }, 2000);

    // Verificar inmediatamente
    this.checkTripStatus();
  }

  // Detener sincronización
  stopSync() {
    if (!this.isPolling) return;

    console.log('⏹️ Deteniendo sincronización...');
    this.isPolling = false;
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.lastTripStatus = null;
    this.currentUserId = null;
  }

  // Verificar estado del viaje
  async checkTripStatus() {
    if (!this.currentUserId || !this.isPolling) return;

    try {
      const result = await apiService.getMyActiveTrip();
      
      if (result.success) {
        const currentStatus = result.data ? 'active' : 'inactive';
        const lastStatus = this.lastTripStatus;
        
        // Si cambió el estado del viaje
        if (lastStatus && lastStatus !== currentStatus) {
          console.log('📡 Cambio de estado detectado:', { from: lastStatus, to: currentStatus });
          
          if (currentStatus === 'inactive' && lastStatus === 'active') {
            // El viaje fue detenido remotamente
            this._notifyStatusChange({
              action: 'stopped',
              status: 'completed',
              message: 'Viaje detenido remotamente desde el dashboard'
            });
          }
        }
        
        this.lastTripStatus = currentStatus;
        
      } else {
        // Si no se puede obtener el estado, asumir que no hay viaje activo
        if (this.lastTripStatus === 'active') {
          console.log('📡 Viaje aparentemente detenido (no se pudo obtener estado)');
          this._notifyStatusChange({
            action: 'stopped',
            status: 'completed',
            message: 'Viaje detenido remotamente'
          });
        }
        this.lastTripStatus = 'inactive';
      }
      
    } catch (error) {
      console.warn('⚠️ Error verificando estado del viaje:', error.message);
      // No cambiar el estado en caso de error de red
    }
  }

  // Registrar listener para cambios de estado
  onStatusChange(callback) {
    this.statusChangeListeners.push(callback);
  }

  // Remover listener
  offStatusChange(callback) {
    const index = this.statusChangeListeners.indexOf(callback);
    if (index > -1) {
      this.statusChangeListeners.splice(index, 1);
    }
  }

  // Notificar cambio de estado a los listeners
  _notifyStatusChange(data) {
    this.statusChangeListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error en listener de cambio de estado:', error);
      }
    });
  }

  // Establecer estado inicial del viaje
  setInitialTripStatus(hasActiveTrip) {
    this.lastTripStatus = hasActiveTrip ? 'active' : 'inactive';
    console.log('🎯 Estado inicial del viaje establecido:', this.lastTripStatus);
  }

  // Verificar si está sincronizando
  isSyncing() {
    return this.isPolling;
  }
}

// Crear instancia singleton
const syncService = new SyncService();

export default syncService;
