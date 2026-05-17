import React, { ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

// ==========================================
// TYPES
// ==========================================

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ==========================================
// COMPONENT
// ==========================================

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    // Update state so the next render shows the error UI
    return { hasError: true, error: null, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    console.error('💥 Error caught by ErrorBoundary:', error);
    console.error('📋 Error info:', errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
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
              <Button variant="primary" onClick={this.handleReload}>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Recargar Página
              </Button>

              <Button variant="outline-secondary" onClick={this.handleRetry}>
                Intentar de Nuevo
              </Button>
            </div>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-3">
                <summary>Detalles técnicos del error</summary>
                <div className="mt-2 p-2 bg-light rounded">
                  <strong>Error:</strong>
                  <pre className="text-danger small">{this.state.error?.toString()}</pre>

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
