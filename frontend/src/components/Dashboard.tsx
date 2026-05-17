import React, { useState, useEffect, useCallback } from 'react';
import { Container, Navbar, Nav, Button, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import toast from 'react-hot-toast';

import Logger from '../config/logger';
import { useAuth } from '../context/AuthContext';
import { ActiveDelivery, LocationUpdateEvent, TripEvent, TripCompletedEvent, TripDTO } from '../types';
import socketService from '../services/socket';
import deliveryService from '../services/deliveryService';

// Lazy load heavy components
const MapComponent = React.lazy(() => import('./MapComponent'));
const DeliveryList = React.lazy(() => import('./DeliveryList'));
const TripHistory = React.lazy(() => import('./TripHistory'));
const APKManager = React.lazy(() => import('./APKManager'));
const UserManagement = React.lazy(() => import('./UserManagement'));

// ==========================================
// TYPES
// ==========================================

type TabKey = 'tracking' | 'history' | 'apk' | 'users';

// ==========================================
// COMPONENT
// ==========================================

const Dashboard: React.FC = () => {
  // Auth state
  const { user, logout, token } = useAuth();
  
  // State
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabKey>('tracking');

  // ==========================================
  // LOAD DELIVERIES
  // ==========================================

  const loadDeliveries = useCallback(async (): Promise<void> => {
    try {
      console.log('📂 Loading deliveries...');
      setLoading(true);
      const result = await deliveryService.getActiveDeliveries();
      
      console.log('📋 getActiveDeliveries result:', result);
      
      if (result.success && result.data) {
        const deliveriesData = result.data.deliveries || [];
        console.log(`✅ ${deliveriesData.length} deliveries loaded`);
        setDeliveries(deliveriesData);
        setError('');
      } else {
        const errorMsg = result.error || 'Error loading deliveries';
        console.error('❌ Error loading deliveries:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('💥 Critical error loading deliveries:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
      console.log('🏁 Deliveries loading finished');
    }
  }, []);

  // ==========================================
  // SOCKET.IO SETUP
  // ==========================================

  useEffect(() => {
    if (token && user?.role === 'admin') {
      // Connect socket
      socketService.connect(token);
      
      // Check connection status
      const checkConnection = () => {
        setSocketConnected(socketService.getConnectionStatus());
      };
      
      const interval = setInterval(checkConnection, 1000);
      
      // Cleanup on unmount
      return () => {
        clearInterval(interval);
        socketService.disconnect();
      };
    }
  }, [token, user]);

  // ==========================================
  // SOCKET LISTENERS
  // ==========================================

  useEffect(() => {
    if (socketConnected) {
      // Location update listener
      const handleLocationUpdate = (data: LocationUpdateEvent) => {
        Logger.deliveryUpdate('Location update:', data);
        
        setDeliveries(prev => prev.map(delivery => {
          if (delivery.deliveryId === data.deliveryId) {
            return {
              ...delivery,
              currentLocation: data.currentLocation,
              mileage: data.mileage,
              duration: data.duration
            };
          }
          return delivery;
        }));
      };

      // Trip started listener
      const handleTripStarted = (data: TripEvent) => {
        Logger.tripUpdate('Trip started:', data);
        
        toast.success(
          `${data.deliveryName} ha iniciado un viaje`,
          { duration: 3000 }
        );
        
        loadDeliveries();
      };

      // Trip completed listener
      const handleTripCompleted = (data: TripCompletedEvent) => {
        console.log('✅ Trip completed:', data);
        
        toast.success(
          `${data.deliveryName} completó su viaje - ${deliveryService.formatMileage(data.totalMileage)}`,
          { duration: 4000 }
        );
        
        loadDeliveries();
      };

      // Multiple trips update listener
      const handleTripsUpdate = (tripsData: TripDTO[]) => {
        console.log('🔄 Multiple trips update:', tripsData);
        
        setDeliveries(prev => {
          return prev.map(delivery => {
            const updatedTrip = tripsData.find(trip => trip.deliveryId === delivery.deliveryId);
            if (updatedTrip) {
              return {
                ...delivery,
                currentLocation: updatedTrip.currentLocation,
                mileage: updatedTrip.mileage,
                duration: updatedTrip.duration,
                averageSpeed: updatedTrip.averageSpeed
              };
            }
            return delivery;
          });
        });
      };

      // Register listeners
      socketService.onLocationUpdate(handleLocationUpdate);
      socketService.onTripStarted(handleTripStarted);
      socketService.onTripCompleted(handleTripCompleted);
      socketService.onTripsUpdate(handleTripsUpdate);

      // Cleanup listeners on unmount
      return () => {
        socketService.off('locationUpdate', handleLocationUpdate);
        socketService.off('tripStarted', handleTripStarted);
        socketService.off('tripCompleted', handleTripCompleted);
        socketService.off('tripsUpdate', handleTripsUpdate);
      };
    }
  }, [socketConnected, loadDeliveries]);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadDeliveries();
    
    // Reload every 2 minutes as backup
    const interval = setInterval(loadDeliveries, 120000);
    return () => clearInterval(interval);
  }, [loadDeliveries]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error cerrando sesión');
    }
  };

  const handleDeliverySelect = useCallback((deliveryId: string): void => {
    setSelectedDelivery(deliveryId);
  }, []);

  const handleDeliveryAction = async (action: 'start' | 'stop', deliveryId: string): Promise<void> => {
    try {
      console.log(`🔄 Executing action '${action}' for delivery ${deliveryId}`);
      
      let result;
      
      if (action === 'start') {
        console.log('▶️ Starting trip...');
        result = await deliveryService.startTrip(deliveryId);
      } else if (action === 'stop') {
        console.log('⏹️ Stopping trip...');
        result = await deliveryService.stopTrip(deliveryId);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
      
      console.log('📋 Action result:', result);
      
      if (result?.success) {
        toast.success(result.message || `Trip ${action === 'start' ? 'started' : 'stopped'} successfully`);
        console.log('✅ Action successful, reloading deliveries...');
        await loadDeliveries();
      } else {
        console.error('❌ Error in result:', result);
        toast.error(result?.error || 'Action error');
      }
    } catch (error) {
      console.error('💥 Critical error in delivery action:', error);
      
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message || 
                          (error as Error).message || 
                          'Error performing action';
      toast.error(errorMessage);
      
      try {
        await loadDeliveries();
      } catch (reloadError) {
        console.error('Error reloading deliveries after failure:', reloadError);
      }
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  if (loading && deliveries.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="danger" className="mb-3" />
          <h5>Cargando Dashboard...</h5>
          <p className="text-muted">Conectando al sistema de tracking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Navbar */}
      <Navbar className="dashboard-navbar" expand="lg">
        <Container fluid className="px-4">
          <Navbar.Brand className="dashboard-brand text-boston-red">
            <i className="bi bi-geo-alt-fill me-2"></i>
            BOSTON Tracker
          </Navbar.Brand>
          
          <Nav className="ms-auto align-items-center">
            {/* Connection status */}
            <div className="me-3 d-flex align-items-center">
              <div 
                className={`rounded-circle me-2 ${socketConnected ? 'bg-success' : 'bg-warning'}`}
                style={{ width: '8px', height: '8px' }}
              />
              <small className="text-muted">
                {socketConnected ? 'Conectado' : 'Desconectado'}
              </small>
            </div>
            
            {/* User info */}
            <span className="navbar-text me-3">
              <i className="bi bi-person-circle me-1"></i>
              {user?.name}
            </span>
            
            {/* Logout button */}
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              Salir
            </Button>
          </Nav>
        </Container>
      </Navbar>

      {/* Main content with tabs */}
      <Container fluid className="p-0">
        {error && (
          <Alert variant="danger" className="m-3 mb-0" dismissible onClose={() => setError('')}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </Alert>
        )}
        
        <Tabs 
          activeKey={activeTab} 
          onSelect={(k) => setActiveTab(k as TabKey)}
          className="dashboard-tabs"
        >
          <Tab 
            eventKey="tracking" 
            title={
              <span>
                <i className="bi bi-geo-alt me-2"></i>
                Tracking en Tiempo Real
              </span>
            }
          >
            <div className="dashboard-main">
              <React.Suspense fallback={<Spinner animation="border" />}>
                {/* Map */}
                <MapComponent 
                  deliveries={deliveries}
                  selectedDelivery={selectedDelivery}
                  onDeliverySelect={handleDeliverySelect}
                />
                
                {/* Delivery list */}
                <DeliveryList 
                  deliveries={deliveries}
                  selectedDelivery={selectedDelivery}
                  onDeliverySelect={handleDeliverySelect}
                  onDeliveryAction={handleDeliveryAction}
                  loading={loading}
                />
              </React.Suspense>
            </div>
          </Tab>

          <Tab 
            eventKey="history" 
            title={
              <span>
                <i className="bi bi-clock-history me-2"></i>
                Historial de Viajes
              </span>
            }
          >
            <React.Suspense fallback={<Spinner animation="border" />}>
              <TripHistory />
            </React.Suspense>
          </Tab>
          
          <Tab 
            eventKey="apk" 
            title={
              <span>
                <i className="bi bi-phone me-2"></i>
                Gestión APK
              </span>
            }
          >
            <React.Suspense fallback={<Spinner animation="border" />}>
              <APKManager />
            </React.Suspense>
          </Tab>
          
          <Tab 
            eventKey="users" 
            title={
              <span>
                <i className="bi bi-people me-2"></i>
                Gestión de Usuarios
              </span>
            }
          >
            <React.Suspense fallback={<Spinner animation="border" />}>
              <UserManagement />
            </React.Suspense>
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
};

export default Dashboard;
