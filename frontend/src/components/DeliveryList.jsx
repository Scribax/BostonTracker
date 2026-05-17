import React from 'react';
import { Card, Badge, Button, Spinner, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import deliveryService from '../services/deliveryService';

const DeliveryList = ({ 
  deliveries, 
  selectedDelivery, 
  onDeliverySelect, 
  onDeliveryAction, 
  loading 
}) => {

  const formatTime = (date) => {
    try {
      return format(new Date(date), 'HH:mm', { locale: es });
    } catch (error) {
      return '--:--';
    }
  };

  const getTimeSinceStart = (startTime) => {
    try {
      const start = new Date(startTime);
      const now = new Date();
      const diffMinutes = Math.floor((now - start) / 60000);
      
      if (diffMinutes < 60) return `${diffMinutes}min`;
      
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}min`;
    } catch (error) {
      return '--';
    }
  };

  const renderDeliveryCard = (delivery) => {
    // Validaciones de seguridad
    if (!delivery || typeof delivery !== 'object') {
      console.warn('⚠️ Delivery inválido:', delivery);
      return null;
    }
    
    const isSelected = selectedDelivery === delivery.id;
    const hasLocation = delivery.currentLocation && typeof delivery.currentLocation === 'object';
    
    return (
      <Card 
        key={delivery.id}
        className={`delivery-card ${isSelected ? 'active' : ''} mb-3`}
        onClick={() => onDeliverySelect(delivery.id)}
      >
        <Card.Body className="p-3">
          {/* Header con nombre y estado */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 className="mb-1 text-boston-red">
                <i className="bi bi-person-badge me-2"></i>
                {delivery.deliveryName}
              </h6>
              <small className="text-muted">
                ID: {delivery.employeeId}
              </small>
            </div>
            <Badge 
              bg={delivery.status === 'active' ? 'success' : 'secondary'}
              className="delivery-status"
            >
              <i className={`bi bi-${delivery.status === 'active' ? 'play' : 'pause'}-circle me-1`}></i>
              {delivery.status === 'active' ? 'Activo' : 'Pausado'}
            </Badge>
          </div>

          {/* Estadísticas principales */}
          <Row className="g-2 mb-3">
            <Col xs={4}>
              <div className="text-center">
                <div className="text-boston-blue fw-bold">
                  {deliveryService.formatMileage(delivery.mileage)}
                </div>
                <small className="text-muted">Kilometraje</small>
              </div>
            </Col>
            <Col xs={4}>
              <div className="text-center">
                <div className="text-info fw-bold">
                  {deliveryService.formatDuration(delivery.duration)}
                </div>
                <small className="text-muted">Duración</small>
              </div>
            </Col>
            <Col xs={4}>
              <div className="text-center">
                <div className="text-success fw-bold">
                  {delivery.averageSpeed}
                </div>
                <small className="text-muted">km/h</small>
              </div>
            </Col>
          </Row>

          {/* Información de tiempo */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                Inicio:
              </small>
              <small>
                {formatTime(delivery.startTime)} 
                <span className="text-muted ms-2">
                  ({getTimeSinceStart(delivery.startTime)})
                </span>
              </small>
            </div>
            
            {hasLocation && (
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="bi bi-geo-alt me-1"></i>
                  Última ubicación:
                </small>
                <small>
                  {deliveryService.getTimeSinceLastUpdate(delivery.currentLocation.timestamp || new Date())}
                </small>
              </div>
            )}
          </div>

          {/* Coordenadas (solo si hay ubicación) */}
          {hasLocation && (
            <div className="mb-3">
              <small className="text-muted d-block">
                Lat: {delivery.currentLocation.latitude.toFixed(6)}
              </small>
              <small className="text-muted d-block">
                Lng: {delivery.currentLocation.longitude.toFixed(6)}
              </small>
            </div>
          )}

          {/* Botones de acción */}
          <div className="d-flex gap-2">
            {delivery.status === 'active' ? (
              <Button
                variant="outline-danger"
                size="sm"
                className="flex-fill"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeliveryAction('stop', delivery.deliveryId);
                }}
              >
                <i className="bi bi-stop-circle me-1"></i>
                Detener
              </Button>
            ) : (
              <Button
                variant="outline-success"
                size="sm"
                className="flex-fill"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeliveryAction('start', delivery.deliveryId);
                }}
              >
                <i className="bi bi-play-circle me-1"></i>
                Iniciar
              </Button>
            )}
            
            <Button
              variant="outline-primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeliverySelect(delivery.id);
              }}
            >
              <i className="bi bi-eye"></i>
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (loading && deliveries.length === 0) {
    return (
      <div className="deliveries-sidebar">
        <div className="loading-spinner">
          <Spinner animation="border" variant="primary" />
          <p className="loading-text">Cargando deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deliveries-sidebar">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="text-boston-red mb-0">
          <i className="bi bi-people-fill me-2"></i>
          Deliveries Activos
        </h5>
        <Badge bg="primary" pill>
          {deliveries.length}
        </Badge>
      </div>

      {/* Estado de carga */}
      {loading && deliveries.length > 0 && (
        <div className="text-center mb-3">
          <Spinner animation="border" size="sm" className="me-2" />
          <small className="text-muted">Actualizando...</small>
        </div>
      )}

      {/* Lista de deliveries */}
      {deliveries.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-inbox display-1 text-muted mb-3"></i>
          <h6 className="text-muted">No hay deliveries activos</h6>
          <p className="text-muted small">
            Los deliveries aparecerán aquí cuando inicien sus viajes
          </p>
        </div>
      ) : (
        <div className="fade-in">
          {deliveries.map(renderDeliveryCard)}
        </div>
      )}

      {/* Footer con información */}
      <div className="mt-4 pt-3 border-top">
        <small className="text-muted d-block text-center">
          <i className="bi bi-arrow-clockwise me-1"></i>
          Actualización automática cada 10s
        </small>
        
        {deliveries.length > 0 && (
          <div className="mt-2">
            <small className="text-muted d-block">
              📊 Estadísticas totales:
            </small>
            <div className="d-flex justify-content-between mt-1">
              <small className="text-muted">
                Km totales: {deliveries.reduce((sum, d) => sum + d.mileage, 0).toFixed(2)}
              </small>
              <small className="text-muted">
                Tiempo activo: {Math.floor(deliveries.reduce((sum, d) => sum + d.duration, 0) / 60)}h
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryList;
