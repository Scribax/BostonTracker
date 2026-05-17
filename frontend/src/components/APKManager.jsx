import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Form, 
  Alert,
  Badge,
  Modal,
  InputGroup,
  Spinner,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import apkService from '../services/apkService';
import userService from '../services/userService';

const APKManager = () => {
  const [apkInfo, setApkInfo] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [useCustomPhone, setUseCustomPhone] = useState(false);

  // Cargar información inicial
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar info del APK y deliveries en paralelo
      const [apkResult, usersResult] = await Promise.all([
        apkService.getAPKInfo(),
        userService.getAllUsers()
      ]);
      
      if (apkResult && apkResult.success) {
        setApkInfo(apkResult.data);
      } else {
        toast.error('Error cargando información del APK');
      }
      
      if (usersResult && usersResult.success) {
        // Filtrar solo deliveries
        const deliveryUsers = usersResult.data.filter(user => user.role === 'delivery');
        setDeliveries(deliveryUsers);
      } else {
        toast.error('Error cargando lista de deliveries');
      }
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  // Enviar APK via WhatsApp
  const handleSendWhatsApp = async () => {
    try {
      setSendingWhatsApp(true);
      
      let phoneNumber = '';
      let deliveryName = '';
      
      if (useCustomPhone) {
        phoneNumber = customPhone;
        deliveryName = 'Nuevo Delivery';
      } else if (selectedDelivery) {
        phoneNumber = selectedDelivery.phone || '';
        deliveryName = selectedDelivery.name;
        
        if (!phoneNumber) {
          toast.error('El delivery seleccionado no tiene número de teléfono registrado');
          return;
        }
      } else {
        toast.error('Selecciona un delivery o ingresa un número personalizado');
        return;
      }
      
      if (!phoneNumber) {
        toast.error('Número de teléfono es requerido');
        return;
      }
      
      const result = await apkService.generateWhatsAppLink({
        phoneNumber,
        deliveryName,
        customMessage: customMessage.trim() || undefined
      });
      
      if (result && result.success) {
        // Abrir WhatsApp en nueva ventana
        window.open(result.data.whatsappUrl, '_blank');
        
        toast.success(`Enlace de WhatsApp generado para ${deliveryName}`);
        setShowSendModal(false);
        resetForm();
      } else {
        toast.error(result?.message || 'Error generando enlace de WhatsApp');
      }
      
    } catch (error) {
      console.error('Error enviando WhatsApp:', error);
      toast.error('Error enviando APK via WhatsApp');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setSelectedDelivery(null);
    setCustomPhone('');
    setCustomMessage('');
    setUseCustomPhone(false);
  };

  // Formatear tamaño de archivo
  const formatFileSize = (sizeInMB) => {
    if (!sizeInMB) return 'N/A';
    return `${sizeInMB} MB`;
  };

  // Formatear número de teléfono para mostrar
  const formatPhoneDisplay = (phone) => {
    if (!phone) return 'Sin teléfono';
    // Formatear número argentino típico
    if (phone.startsWith('549') && phone.length >= 12) {
      return `+54 9 ${phone.slice(3, 6)} ${phone.slice(6, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" variant="danger" />
        <p className="mt-2">Cargando información de APK...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>
            <i className="bi bi-phone text-danger me-2"></i>
            Gestión de APK
          </h2>
          <p className="text-muted">
            Envía la aplicación móvil a deliveries via WhatsApp
          </p>
        </Col>
      </Row>

      {/* Información del APK */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-info-circle text-primary me-2"></i>
                Información del APK
              </h5>
            </Card.Header>
            <Card.Body>
              {apkInfo ? (
                <div>
                  <p>
                    <strong>Archivo:</strong> {apkInfo.fileName}<br />
                    <strong>Tamaño:</strong> {formatFileSize(apkInfo.fileSize)}<br />
                    <strong>Versión:</strong> <Badge bg="success">{apkInfo.version}</Badge><br />
                    <strong>Build:</strong> {apkInfo.buildDate}<br />
                    <strong>Compatibilidad:</strong> {apkInfo.compatible}
                  </p>
                  
                  {apkInfo.lastModified && (
                    <p>
                      <strong>Última modificación:</strong><br />
                      <small className="text-muted">
                        {format(new Date(apkInfo.lastModified), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                      </small>
                    </p>
                  )}
                  
                  <div className="mt-3">
                    <strong>Características:</strong>
                    <ul className="mt-2">
                      {apkInfo.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Alert variant="warning">
                  No se pudo cargar la información del APK
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-download text-success me-2"></i>
                Enlaces de Descarga
              </h5>
            </Card.Header>
            <Card.Body>
              {apkInfo && (
                <div>
                  <div className="mb-3">
                    <strong>URL de Descarga Directa:</strong>
                    <InputGroup className="mt-2">
                      <Form.Control
                        type="text"
                        value={apkInfo.downloadUrl}
                        readOnly
                        className="bg-light"
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(apkInfo.downloadUrl);
                          toast.success('URL copiada al portapapeles');
                        }}
                      >
                        <i className="bi bi-clipboard"></i>
                      </Button>
                    </InputGroup>
                  </div>
                  
                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      href={apkInfo.downloadUrl}
                      target="_blank"
                    >
                      <i className="bi bi-download me-2"></i>
                      Descargar APK
                    </Button>
                    
                    <Button
                      variant="success"
                      onClick={() => setShowSendModal(true)}
                    >
                      <i className="bi bi-whatsapp me-2"></i>
                      Enviar via WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Lista de deliveries para envío rápido */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-people text-info me-2"></i>
                Envío Rápido a Deliveries ({deliveries.length})
              </h5>
            </Card.Header>
            <Card.Body>
              {deliveries.length === 0 ? (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  No hay deliveries registrados en el sistema.
                </Alert>
              ) : (
                <Row>
                  {deliveries.map((delivery) => (
                    <Col md={6} lg={4} key={delivery.id} className="mb-3">
                      <Card className={`h-100 ${!delivery.isActive ? 'opacity-75' : ''}`}>
                        <Card.Body>
                          <h6 className="card-title">
                            {delivery.name}
                            {!delivery.isActive && (
                              <Badge bg="secondary" className="ms-2">Inactivo</Badge>
                            )}
                          </h6>
                          <p className="card-text">
                            <strong>ID:</strong> {delivery.employeeId}<br />
                            <strong>Teléfono:</strong> {formatPhoneDisplay(delivery.phone)}
                          </p>
                          
                          <div className="d-grid">
                            <Button
                              variant={delivery.phone ? "outline-success" : "outline-secondary"}
                              size="sm"
                              disabled={!delivery.phone || !delivery.isActive}
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setUseCustomPhone(false);
                                setShowSendModal(true);
                              }}
                            >
                              <i className="bi bi-whatsapp me-1"></i>
                              {delivery.phone ? 'Enviar APK' : 'Sin Teléfono'}
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal para enviar via WhatsApp */}
      <Modal 
        show={showSendModal} 
        onHide={() => setShowSendModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-whatsapp text-success me-2"></i>
            Enviar APK via WhatsApp
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Destinatario</h6>
                </Card.Header>
                <Card.Body>
                  <Form.Check
                    type="radio"
                    label="Enviar a delivery existente"
                    name="phoneOption"
                    checked={!useCustomPhone}
                    onChange={() => setUseCustomPhone(false)}
                    className="mb-3"
                  />
                  
                  {!useCustomPhone && (
                    <div className="mb-3">
                      <Form.Select
                        value={selectedDelivery?.id || ''}
                        onChange={(e) => {
                          const delivery = deliveries.find(d => d.id === e.target.value);
                          setSelectedDelivery(delivery || null);
                        }}
                        disabled={useCustomPhone}
                      >
                        <option value="">Seleccionar delivery...</option>
                        {deliveries
                          .filter(d => d.phone && d.isActive)
                          .map(delivery => (
                            <option key={delivery.id} value={delivery.id}>
                              {delivery.name} ({delivery.employeeId}) - {formatPhoneDisplay(delivery.phone)}
                            </option>
                          ))
                        }
                      </Form.Select>
                    </div>
                  )}
                  
                  <Form.Check
                    type="radio"
                    label="Enviar a número personalizado"
                    name="phoneOption"
                    checked={useCustomPhone}
                    onChange={() => setUseCustomPhone(true)}
                    className="mb-3"
                  />
                  
                  {useCustomPhone && (
                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <i className="bi bi-phone"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="tel"
                        placeholder="Ej: 5491123456789"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        disabled={!useCustomPhone}
                      />
                    </InputGroup>
                  )}
                  
                  {/* Información del destinatario seleccionado */}
                  {selectedDelivery && !useCustomPhone && (
                    <Alert variant="info">
                      <strong>📱 Enviar a:</strong><br />
                      {selectedDelivery.name} ({selectedDelivery.employeeId})<br />
                      {formatPhoneDisplay(selectedDelivery.phone)}
                    </Alert>
                  )}
                  
                  {useCustomPhone && customPhone && (
                    <Alert variant="info">
                      <strong>📱 Enviar a:</strong><br />
                      Número personalizado: {formatPhoneDisplay(customPhone)}
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Mensaje (Opcional)</h6>
                </Card.Header>
                <Card.Body>
                  <Form.Group>
                    <Form.Label>Personalizar mensaje:</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={8}
                      placeholder="Dejar vacío para usar mensaje predeterminado..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="mb-3"
                    />
                    <small className="text-muted">
                      💡 Si no escribes nada, se usará un mensaje predeterminado con instrucciones completas
                    </small>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Vista previa del mensaje */}
          {apkInfo && (
            <Row className="mt-3">
              <Col>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">
                      <i className="bi bi-eye me-2"></i>
                      Vista Previa del Mensaje
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="bg-light p-3 rounded border">
                      <small style={{ whiteSpace: 'pre-line' }}>
                        {customMessage.trim() || 
                          `*BOSTON American Burgers - App Delivery*\n\nHola ${selectedDelivery?.name || (useCustomPhone ? 'Nuevo Delivery' : '')}!\n\nTe envio la aplicacion oficial de BOSTON Tracker para que puedas comenzar a trabajar como delivery.\n\nDescarga la app desde este enlace:\n\n*\n${apkInfo.downloadUrl}\n\n*Instrucciones:*\n1. Toca el enlace de arriba para descargar\n2. Permite instalacion de "Fuentes desconocidas"\n3. Instala la aplicacion\n4. Usa tus credenciales de empleado para login\n\n*Listo para comenzar!*\n\nCualquier duda, no dudes en contactarme.\n\n---\nBOSTON American Burgers`
                        }
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSendModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={handleSendWhatsApp}
            disabled={sendingWhatsApp || (!selectedDelivery && !customPhone)}
          >
            {sendingWhatsApp ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generando enlace...
              </>
            ) : (
              <>
                <i className="bi bi-whatsapp me-2"></i>
                Abrir WhatsApp
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Información adicional */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Instrucciones de Uso
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>📱 Para Envío via WhatsApp:</h6>
                  <ol>
                    <li>Selecciona un delivery de la lista o ingresa un número personalizado</li>
                    <li>Opcionalmente personaliza el mensaje</li>
                    <li>Click en "Enviar via WhatsApp"</li>
                    <li>Se abrirá WhatsApp Web/App con el mensaje listo</li>
                    <li>Solo envía el mensaje</li>
                  </ol>
                </Col>
                <Col md={6}>
                  <h6>🔧 Para el Delivery:</h6>
                  <ol>
                    <li>Recibe el mensaje con el enlace de descarga</li>
                    <li>Toca el enlace para descargar el APK</li>
                    <li>Permite "Fuentes desconocidas" en Android</li>
                    <li>Instala la aplicación</li>
                    <li>Usa sus credenciales de empleado para login</li>
                  </ol>
                </Col>
              </Row>
              
              <Alert variant="info" className="mt-3">
                <i className="bi bi-lightbulb me-2"></i>
                <strong>Consejo:</strong> Asegúrate de que el delivery tenga su número de teléfono registrado 
                en el sistema para envío directo. También puedes usar un número personalizado para 
                nuevos deliveries que aún no estén en el sistema.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default APKManager;
