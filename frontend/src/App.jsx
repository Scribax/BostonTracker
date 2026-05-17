import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-danger mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <h5>Verificando autenticación...</h5>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Solo admins pueden acceder al dashboard
  if (user?.role !== 'admin') {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <i className="bi bi-shield-x display-1 text-danger mb-3"></i>
          <h4>Acceso Denegado</h4>
          <p className="text-muted">
            Solo los administradores pueden acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

// Componente para rutas públicas (redirige si ya está autenticado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-danger mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <h5>Cargando aplicación...</h5>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Configuración de notificaciones */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              success: {
                iconTheme: {
                  primary: '#28a745',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#dc3545',
                  secondary: '#fff',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#0d6efd',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            {/* Ruta raíz - redirige según estado de autenticación */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />

            {/* Ruta de login */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />

            {/* Ruta del dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />

            {/* Ruta 404 */}
            <Route 
              path="*" 
              element={
                <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
                  <div className="text-center">
                    <h1 className="display-1 text-boston-red">404</h1>
                    <h4>Página no encontrada</h4>
                    <p className="text-muted mb-4">
                      La página que buscas no existe.
                    </p>
                    <a href="/dashboard" className="btn btn-danger">
                      <i className="bi bi-house me-2"></i>
                      Volver al Dashboard
                    </a>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
