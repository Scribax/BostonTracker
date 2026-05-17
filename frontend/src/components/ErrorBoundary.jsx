import React from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para que el siguiente renderizado muestre la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // También podrías registrar el error a un servicio de reporte de errores
    console.error('💥 Error capturado por ErrorBoundary:', error);
    console.error('📋 Info del error:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="mt-5">
          <Alert variant="danger">
            <Alert.Heading>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Oops! Algo salió mal
            </Alert.Heading>
            <p>
              Ha ocurrido un error inesperado en la aplicación. 
              Por favor, recarga la página o contacta al administrador si el problema persiste.
            </p>
            
            <div className="d-flex gap-2 mt-3">
              <Button 
                variant="primary" 
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Recargar Página
              </Button>
              
              <Button 
                variant="outline-secondary" 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Intentar de Nuevo
              </Button>
            </div>

            {/* Mostrar detalles del error en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-3">
                <summary>Detalles técnicos del error</summary>
                <div className="mt-2 p-2 bg-light rounded">
                  <strong>Error:</strong>
                  <pre className="text-danger small">{this.state.error && this.state.error.toString()}</pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <strong>Stack trace:</strong>
                      <pre className="text-muted small">{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
