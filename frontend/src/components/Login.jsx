import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated, loading } = useAuth();

  // Redirigir si ya está autenticado
  if (loading) {
    return (
      <div className="login-container">
        <div className="loading-spinner">
          <Spinner animation="border" variant="danger" />
          <p className="loading-text">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error al escribir
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData);
      
      if (result.success) {
        toast.success(`¡Bienvenido ${result.user.name}!`);
      } else {
        setError(result.error || 'Error en el login');
        toast.error(result.error || 'Error en el login');
      }
    } catch (err) {
      const errorMessage = 'Error de conexión. Verifica tu internet.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <div className="text-center mb-4">
          <h1 className="brand-logo">BOSTON</h1>
          <p className="brand-subtitle">Sistema de Tracking de Deliverys</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-3" dismissible onClose={() => setError('')}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-envelope me-2"></i>
              Email
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@bostonburgers.com"
              required
              disabled={isLoading}
              className="form-control-lg"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>
              <i className="bi bi-lock me-2"></i>
              Contraseña
            </Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Tu contraseña"
              required
              disabled={isLoading}
              className="form-control-lg"
            />
          </Form.Group>

          <Button
            type="submit"
            className="w-100 mb-3 btn-lg bg-boston-red border-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Iniciar Sesión
              </>
            )}
          </Button>
        </Form>

      </div>
    </div>
  );
};

export default Login;
