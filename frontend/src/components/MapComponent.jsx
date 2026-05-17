import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Spinner, Badge, Button } from 'react-bootstrap';
import deliveryService from '../services/deliveryService';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
try {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
} catch (e) {
  console.warn('Error configurando iconos de Leaflet:', e);
}

// Icono personalizado para deliveries CON NOMBRE ARRIBA
const createDeliveryIcon = (deliveryName, employeeId, isSelected = false) => {
  try {
    const color = isSelected ? '#28a745' : '#dc3545';
    const displayName = deliveryName || employeeId || 'Delivery';
    
    return new L.DivIcon({
      html: `<div style="position: relative; text-align: center;">
               <!-- Nombre arriba del ícono -->
               <div style="
                 background-color: ${color}; 
                 color: white; 
                 padding: 2px 8px; 
                 border-radius: 12px; 
                 font-size: 11px; 
                 font-weight: bold; 
                 white-space: nowrap;
                 margin-bottom: 2px;
                 box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                 border: 1px solid white;
               ">
                 ${displayName}
               </div>
               <!-- Ícono del scooter -->
               <div style="
                 background-color: ${color}; 
                 border: 3px solid white; 
                 border-radius: 50%; 
                 width: 30px; 
                 height: 30px; 
                 display: flex; 
                 align-items: center; 
                 justify-content: center; 
                 box-shadow: 0 3px 6px rgba(0,0,0,0.3); 
                 cursor: pointer;
                 margin: 0 auto;
               ">
                 <i class="bi bi-scooter" style="color: white; font-size: 14px;"></i>
               </div>
             </div>`,
      iconSize: [80, 50], // Aumentado para acomodar el nombre
      iconAnchor: [40, 40], // Centrado en el ícono del scooter
      popupAnchor: [0, -25], // Ajustado para el popup
      className: "delivery-marker-with-name"
    });
  } catch (e) {
    console.warn('Error creando icono de delivery:', e);
    return L.Icon.Default();
  }
};

// Configuración del mapa desde variables de entorno
const MAP_CONFIG = {
  defaultCenter: [
    parseFloat(import.meta.env.VITE_MAP_DEFAULT_CENTER_LAT) || -34.6037,
    parseFloat(import.meta.env.VITE_MAP_DEFAULT_CENTER_LNG) || -58.3816
  ],
  defaultZoom: parseInt(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 12
};

// Componente para ajustar la vista del mapa automáticamente
const MapController = ({ deliveries, selectedDelivery, autoFollow, onMapInstanceReady }) => {
  const map = useMap();
  
  // Exponer instancia del mapa al componente padre
  useEffect(() => {
    try {
      if (onMapInstanceReady && map) {
        onMapInstanceReady(map);
      }
    } catch (e) {
      console.warn('Error configurando instancia del mapa:', e);
    }
  }, [map, onMapInstanceReady]);
  
  useEffect(() => {
    try {
      // Solo ajustar vista automáticamente si autoFollow está habilitado
      if (!autoFollow || !deliveries || deliveries.length === 0 || !map) {
        return;
      }
      
      const validDeliveries = deliveries.filter(d => d && d.currentLocation);
      
      if (validDeliveries.length === 1) {
        // Si hay solo un delivery, centrar en él
        const delivery = validDeliveries[0];
        map.setView([
          delivery.currentLocation.latitude,
          delivery.currentLocation.longitude
        ], 15, { animate: true });
      } else if (validDeliveries.length > 1) {
        // Si hay múltiples, ajustar para mostrar todos
        const bounds = validDeliveries.map(d => [
          d.currentLocation.latitude,
          d.currentLocation.longitude
        ]);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch (e) {
      console.warn('Error ajustando vista del mapa:', e);
    }
  }, [deliveries, map, autoFollow]);
  
  return null;
};

const MapComponent = ({ deliveries = [], selectedDelivery, onDeliverySelect }) => {
  // TODOS LOS HOOKS AL PRINCIPIO - NUNCA EARLY RETURNS ANTES DE ESTOS
  const [deliveryRoutes, setDeliveryRoutes] = useState({});
  const [loadingRoutes, setLoadingRoutes] = useState(new Set());
  const [showRoutes, setShowRoutes] = useState(true);
  const [autoFollow, setAutoFollow] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);

  // Cargar ruta de un delivery
  const loadDeliveryRoute = useCallback(async (deliveryId, tripId) => {
    if (loadingRoutes.has(deliveryId) || deliveryRoutes[deliveryId]) {
      return;
    }

    setLoadingRoutes(prev => new Set(prev).add(deliveryId));

    try {
      const result = await deliveryService.getDeliveryHistory(deliveryId, { 
        tripId, 
        limit: 100 
      });
      
      if (result.success && result.data?.locations?.length > 0) {
        // Convertir coordenadas para Leaflet (lat, lng)
        const coordinates = result.data.locations.map(loc => [
          loc.latitude, 
          loc.longitude
        ]);
        
        setDeliveryRoutes(prev => ({
          ...prev,
          [deliveryId]: {
            deliveryId,
            deliveryName: result.data.deliveryName,
            coordinates,
            color: selectedDelivery === deliveryId ? '#28a745' : '#007bff'
          }
        }));
      }
    } catch (error) {
      console.error('Error cargando ruta:', error);
      toast.error('Error cargando ruta del delivery');
    } finally {
      setLoadingRoutes(prev => {
        const newSet = new Set(prev);
        newSet.delete(deliveryId);
        return newSet;
      });
    }
  }, [loadingRoutes, deliveryRoutes, selectedDelivery]);

  // Manejar clic en marcador
  const handleMarkerClick = useCallback((delivery) => {
    try {
      onDeliverySelect?.(delivery.id);
      
      // Cargar ruta si no está cargada
      if (!deliveryRoutes[delivery.deliveryId] && !loadingRoutes.has(delivery.deliveryId)) {
        loadDeliveryRoute(delivery.deliveryId, delivery.id);
      }
    } catch (e) {
      console.error('Error en click del marcador:', e);
    }
  }, [onDeliverySelect, deliveryRoutes, loadDeliveryRoute, loadingRoutes]);

  // Controlar cámara del mapa
  const handleCenterOnDeliveries = useCallback(() => {
    try {
      const validDeliveries = deliveries.filter(d => d?.currentLocation);
      
      if (!mapInstance || !validDeliveries.length) return;
      
      if (validDeliveries.length === 1) {
        const delivery = validDeliveries[0];
        mapInstance.setView([
          delivery.currentLocation.latitude,
          delivery.currentLocation.longitude
        ], 15, { animate: true });
      } else {
        const bounds = validDeliveries.map(d => [
          d.currentLocation.latitude,
          d.currentLocation.longitude
        ]);
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch (e) {
      console.warn('Error centrando en deliveries:', e);
    }
  }, [mapInstance, deliveries]);
  
  const handleResetView = useCallback(() => {
    try {
      if (!mapInstance) return;
      mapInstance.setView(MAP_CONFIG.defaultCenter, MAP_CONFIG.defaultZoom, { animate: true });
    } catch (e) {
      console.warn('Error reseteando vista:', e);
    }
  }, [mapInstance]);

  // Formatear duración
  const formatDuration = (minutes) => {
    if (!minutes) return 'Sin datos';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  // VALIDACIONES DESPUÉS DE HOOKS
  const validDeliveries = Array.isArray(deliveries) 
    ? deliveries.filter(d => d && d.currentLocation) 
    : [];
  
  const hasDeliveries = Array.isArray(deliveries) && deliveries.length > 0;

  // RENDER CONDICIONAL PERO SIN EARLY RETURN
  const mapContent = hasDeliveries ? (
    // Mapa con deliveries
    <>
      {/* Controller para ajustar vista automáticamente */}
      <MapController 
        deliveries={validDeliveries} 
        selectedDelivery={selectedDelivery} 
        autoFollow={autoFollow}
        onMapInstanceReady={setMapInstance}
      />
      
      {/* Marcadores de deliveries CON NOMBRE ARRIBA */}
      {validDeliveries.map(delivery => (
        <Marker
          key={delivery.id || delivery.deliveryId}
          position={[
            delivery.currentLocation.latitude,
            delivery.currentLocation.longitude
          ]}
          icon={createDeliveryIcon(
            delivery.deliveryName || delivery.name, 
            delivery.employeeId,
            selectedDelivery === delivery.id
          )}
          eventHandlers={{
            click: () => handleMarkerClick(delivery)
          }}
        >
          <Popup>
            <div className="text-center" style={{ minWidth: '200px' }}>
              <h6 className="mb-2">
                <i className="bi bi-scooter me-2"></i>
                {delivery.deliveryName || delivery.name || delivery.employeeId}
              </h6>
              <p className="mb-2">
                <strong>ID:</strong> {delivery.employeeId}
              </p>
              <div className="row text-center">
                <div className="col">
                  <small className="text-muted">Kilometraje</small>
                  <div><strong>{delivery.mileage?.toFixed(1) || '0.0'} km</strong></div>
                </div>
                <div className="col">
                  <small className="text-muted">Duración</small>
                  <div><strong>{formatDuration(delivery.duration)}</strong></div>
                </div>
              </div>
              <div className="row text-center mt-2">
                <div className="col">
                  <small className="text-muted">Velocidad</small>
                  <div><strong>{delivery.averageSpeed?.toFixed(1) || '0.0'} km/h</strong></div>
                </div>
                <div className="col">
                  <small className="text-muted">Estado</small>
                  <div>
                    <Badge bg={delivery.status === 'active' ? 'success' : 'secondary'}>
                      {delivery.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>
              {delivery.currentLocation?.timestamp && (
                <div className="mt-2">
                  <small className="text-muted">
                    Actualizado {formatDistanceToNow(new Date(delivery.currentLocation.timestamp), { locale: es, addSuffix: true })}
                  </small>
                </div>
              )}
              <div className="mt-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleMarkerClick(delivery)}
                  disabled={loadingRoutes.has(delivery.deliveryId)}
                >
                  {loadingRoutes.has(delivery.deliveryId) ? (
                    <>
                      <Spinner size="sm" className="me-1" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-route me-1"></i>
                      Ver Ruta
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Rutas de deliveries */}
      {showRoutes && Object.values(deliveryRoutes).map(route => (
        <Polyline
          key={route.deliveryId}
          positions={route.coordinates}
          color={route.color}
          weight={4}
          opacity={0.8}
        />
      ))}
    </>
  ) : (
    // Mensaje cuando no hay deliveries
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '20px',
      borderRadius: '8px',
      textAlign: 'center',
      border: '1px solid #ddd'
    }}>
      <i className="bi bi-geo-alt display-4 text-muted"></i>
      <h5 className="mt-2">Sin deliveries activos</h5>
      <p className="text-muted mb-0">Los deliveries aparecerán aquí cuando inicien sus viajes</p>
    </div>
  );

  return (
    <div className="map-container h-100 position-relative">
      {/* Controles del mapa */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'white',
        padding: '8px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Controles principales */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            variant={autoFollow ? 'success' : 'outline-success'}
            size="sm"
            onClick={() => {
              setAutoFollow(!autoFollow);
              if (!autoFollow && validDeliveries.length > 0) {
                // Si se activa autoFollow, centrar inmediatamente
                setTimeout(handleCenterOnDeliveries, 100);
              }
            }}
            title={autoFollow ? 'Seguimiento automático ON' : 'Navegación libre ON'}
          >
            <i className={`bi ${autoFollow ? 'bi-geo-alt-fill' : 'bi-hand-index'} me-1`}></i>
            {autoFollow ? 'Auto' : 'Libre'}
          </Button>
          
          <Button
            variant={showRoutes ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setShowRoutes(!showRoutes)}
            title="Mostrar/ocultar rutas"
          >
            <i className="bi bi-route me-1"></i>
            Rutas
          </Button>
        </div>
        
        {/* Controles de cámara cuando no está en autoFollow */}
        {!autoFollow && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleCenterOnDeliveries}
              disabled={validDeliveries.length === 0}
              title="Centrar en deliveries"
            >
              <i className="bi bi-bullseye"></i>
            </Button>
            
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleResetView}
              title="Vista inicial"
            >
              <i className="bi bi-house"></i>
            </Button>
          </div>
        )}
        
        {/* Indicador de modo */}
        <div style={{
          fontSize: '10px',
          textAlign: 'center',
          color: autoFollow ? '#28a745' : '#007bff',
          fontWeight: 'bold'
        }}>
          {autoFollow ? 'AUTO' : 'LIBRE'}
        </div>
      </div>

      <MapContainer
        center={MAP_CONFIG.defaultCenter}
        zoom={MAP_CONFIG.defaultZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        whenReady={() => console.log('🗺 Mapa inicializado')}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Contenido del mapa */}
        {mapContent}
      </MapContainer>

      {/* Indicador de deliveries activos */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Badge 
          bg={validDeliveries.length > 0 ? 'success' : 'warning'}
          className="px-2 py-1"
        >
          <i className="bi bi-geo-alt-fill me-1"></i>
          {validDeliveries.length > 0 
            ? `${validDeliveries.length} delivery${validDeliveries.length !== 1 ? 's' : ''} activo${validDeliveries.length !== 1 ? 's' : ''}`
            : 'Sin deliveries activos'
          }
        </Badge>
      </div>
    </div>
  );
};

export default MapComponent;
