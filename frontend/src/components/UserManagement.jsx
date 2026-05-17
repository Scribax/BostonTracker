import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  ButtonGroup,
  Dropdown
} from 'react-bootstrap';
import userService from '../services/userService';
import toast from 'react-hot-toast';

const UserManagement = () => {
  // Estados principales
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Estados para formularios
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    password: '',
    phone: '',
    role: 'delivery',
    isActive: true
  });
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  // Cargar todos los usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await userService.getAllUsers();
      
      if (result.success) {
        setUsers(result.data || []);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError('Error cargando usuarios');
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios según búsqueda y filtros
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      employeeId: '',
      password: '',
      phone: '',
      role: 'delivery',
      isActive: true
    });
    setFormErrors({});
    setEditingUser(null);
  };

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo si existe
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Abrir modal de creación
  const handleCreateUser = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Abrir modal de edición
  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      employeeId: user.employeeId || '',
      password: '', // No cargar contraseña existente
      phone: user.phone || '',
      role: user.role || 'delivery',
      isActive: user.isActive
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Abrir modal de eliminación
  const handleDeleteUser = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  // Confirmar creación de usuario
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    
    // Validar datos
    const validation = userService.validateUserData(formData, false);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const result = await userService.createUser(formData);
      
      if (result.success) {
        toast.success(result.message || 'Usuario creado exitosamente');
        setShowCreateModal(false);
        resetForm();
        await loadUsers(); // Recargar lista
      } else {
        toast.error(result.error);
        // Si es un error de validación del servidor, mostrarlo
        if (result.error.includes('email') || result.error.includes('Email')) {
          setFormErrors(prev => ({ ...prev, email: result.error }));
        } else if (result.error.includes('empleado') || result.error.includes('Employee')) {
          setFormErrors(prev => ({ ...prev, employeeId: result.error }));
        }
      }
    } catch (err) {
      console.error('Error creando usuario:', err);
      toast.error('Error creando usuario');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar edición de usuario
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    if (!editingUser) return;
    
    // Validar datos
    const validation = userService.validateUserData(formData, true);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Solo enviar campos que no estén vacíos
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // No actualizar contraseña si está vacía
      }
      
      const result = await userService.updateUser(editingUser.id, updateData);
      
      if (result.success) {
        toast.success(result.message || 'Usuario actualizado exitosamente');
        setShowEditModal(false);
        resetForm();
        await loadUsers(); // Recargar lista
      } else {
        toast.error(result.error);
        // Si es un error de validación del servidor, mostrarlo
        if (result.error.includes('email') || result.error.includes('Email')) {
          setFormErrors(prev => ({ ...prev, email: result.error }));
        } else if (result.error.includes('empleado') || result.error.includes('Employee')) {
          setFormErrors(prev => ({ ...prev, employeeId: result.error }));
        }
      }
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      toast.error('Error actualizando usuario');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar eliminación de usuario
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    
    setSubmitting(true);
    
    try {
      const result = await userService.deleteUser(deletingUser.id);
      
      if (result.success) {
        toast.success(result.message || 'Usuario eliminado exitosamente');
        setShowDeleteModal(false);
        setDeletingUser(null);
        await loadUsers(); // Recargar lista
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      toast.error('Error eliminando usuario');
    } finally {
      setSubmitting(false);
    }
  };

  // Renderizar badge de estado
  const renderStatusBadge = (user) => {
    const badge = userService.getStatusBadge(user);
    return (
      <Badge bg={badge.variant}>
        <i className={`bi ${badge.icon} me-1`}></i>
        {badge.text}
      </Badge>
    );
  };

  // Renderizar badge de rol
  const renderRoleBadge = (role) => {
    const badge = userService.getRoleBadge(role);
    return (
      <Badge bg={badge.variant}>
        <i className={`bi ${badge.icon} me-1`}></i>
        {badge.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="danger" className="mb-3" />
          <h5>Cargando usuarios...</h5>
        </div>
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>
                <i className="bi bi-people me-2 text-danger"></i>
                Gestión de Usuarios
              </h2>
              <p className="text-muted mb-0">
                Administra los usuarios del sistema de tracking
              </p>
            </div>
            <Button 
              variant="success" 
              onClick={handleCreateUser}
              className="d-flex align-items-center"
            >
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Usuario
            </Button>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <Card>
            <Card.Header>
              <Row>
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Buscar por nombre, email o ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">Todos los roles</option>
                    <option value="admin">Administradores</option>
                    <option value="delivery">Deliveries</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="outline-secondary" 
                    onClick={loadUsers}
                    disabled={loading}
                    className="w-100"
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Actualizar
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="text-center p-5">
                  <i className="bi bi-people display-1 text-muted mb-3"></i>
                  <h5>No hay usuarios</h5>
                  <p className="text-muted">
                    {searchTerm || roleFilter || statusFilter 
                      ? 'No se encontraron usuarios con los filtros aplicados' 
                      : 'No hay usuarios registrados en el sistema'}
                  </p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Usuario</th>
                      <th>Email / ID Empleado</th>
                      <th>Teléfono</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Último Login</th>
                      <th width="150">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar me-3">
                              <i className="bi bi-person-circle fs-4 text-muted"></i>
                            </div>
                            <div>
                              <div className="fw-bold">{user.name}</div>
                              <small className="text-muted">
                                Creado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {user.email && (
                            <div>
                              <i className="bi bi-envelope me-1"></i>
                              {user.email}
                            </div>
                          )}
                          {user.employeeId && (
                            <div>
                              <i className="bi bi-badge-cc me-1"></i>
                              {user.employeeId}
                            </div>
                          )}
                        </td>
                        <td>
                          {user.phone ? (
                            <span>
                              <i className="bi bi-telephone me-1"></i>
                              {user.phone}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>{renderRoleBadge(user.role)}</td>
                        <td>{renderStatusBadge(user)}</td>
                        <td>
                          <small className="text-muted">
                            {userService.formatLastLogin(user.lastLogin)}
                          </small>
                        </td>
                        <td>
                          <ButtonGroup size="sm">
                            <Button
                              variant="outline-primary"
                              onClick={() => handleEditUser(user)}
                              title="Editar usuario"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={() => handleDeleteUser(user)}
                              title="Eliminar usuario"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </ButtonGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
            <Card.Footer className="text-muted">
              <small>
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Modal de Creación */}
      <Modal show={showCreateModal} onHide={() => !submitting && setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton={!submitting}>
          <Modal.Title>
            <i className="bi bi-plus-circle me-2"></i>
            Crear Nuevo Usuario
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitCreate}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre Completo *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    isInvalid={!!formErrors.name}
                    placeholder="Ej: Juan Pérez"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol *</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                  >
                    <option value="delivery">Delivery</option>
                    <option value="admin">Administrador</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {formData.role === 'admin' ? (
              <Form.Group className="mb-3">
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  isInvalid={!!formErrors.email}
                  placeholder="admin@bostonburgers.com"
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.email}
                </Form.Control.Feedback>
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>ID Empleado *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => handleFormChange('employeeId', e.target.value)}
                  isInvalid={!!formErrors.employeeId}
                  placeholder="DEL001"
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.employeeId}
                </Form.Control.Feedback>
              </Form.Group>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña *</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    isInvalid={!!formErrors.password}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    isInvalid={!!formErrors.phone}
                    placeholder="+54 9 11 1234-5678"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Usuario activo"
                checked={formData.isActive}
                onChange={(e) => handleFormChange('isActive', e.target.checked)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button 
              variant="success" 
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Creando...
                </>
              ) : (
                <>
                  <i className="bi bi-check me-2"></i>
                  Crear Usuario
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Edición */}
      <Modal show={showEditModal} onHide={() => !submitting && setShowEditModal(false)} size="lg">
        <Modal.Header closeButton={!submitting}>
          <Modal.Title>
            <i className="bi bi-pencil me-2"></i>
            Editar Usuario
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitEdit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre Completo *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    disabled // No permitir cambiar rol por ahora
                  >
                    <option value="delivery">Delivery</option>
                    <option value="admin">Administrador</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    El rol no puede ser modificado
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {formData.role === 'admin' ? (
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  isInvalid={!!formErrors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.email}
                </Form.Control.Feedback>
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>ID Empleado</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => handleFormChange('employeeId', e.target.value)}
                  isInvalid={!!formErrors.employeeId}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.employeeId}
                </Form.Control.Feedback>
              </Form.Group>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nueva Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    isInvalid={!!formErrors.password}
                    placeholder="Dejar vacío para mantener actual"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    isInvalid={!!formErrors.phone}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Usuario activo"
                checked={formData.isActive}
                onChange={(e) => handleFormChange('isActive', e.target.checked)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Actualizando...
                </>
              ) : (
                <>
                  <i className="bi bi-check me-2"></i>
                  Actualizar Usuario
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Eliminación */}
      <Modal show={showDeleteModal} onHide={() => !submitting && setShowDeleteModal(false)}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="text-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Confirmar Eliminación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            ¿Estás seguro de que quieres eliminar al usuario{' '}
            <strong>{deletingUser?.name}</strong>?
          </p>
          <Alert variant="warning">
            <i className="bi bi-warning me-2"></i>
            Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al usuario.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDelete}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Eliminando...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Eliminar Usuario
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement;
