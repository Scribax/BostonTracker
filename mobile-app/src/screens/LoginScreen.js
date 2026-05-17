import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useConnectivity } from '../contexts/ConnectivityContext';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ServiceUnavailable from '../components/ServiceUnavailable';

const LoginScreen = ({ navigation }) => {
  const [credentials, setCredentials] = useState({
    employeeId: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

  const { login, isAuthenticated, loading, user } = useAuth();
  const { isOnline, isChecking, lastCheckTime, forceCheck } = useConnectivity();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'delivery') {
        navigation.replace('Home');
      } else {
        Alert.alert(
          'Acceso Denegado',
          'Esta aplicación es solo para deliverys. Los administradores deben usar la versión web.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [isAuthenticated, user, navigation]);

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error al escribir
    if (error) {
      setError('');
    }
  };

  const handleLogin = async () => {
    // Validaciones básicas
    if (!credentials.employeeId.trim() || !credentials.password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(credentials);
      
      if (result.success) {
        if (result.user.role !== 'delivery') {
          setError('Esta aplicación es solo para deliverys');
          return;
        }
        
        // La navegación se maneja en el useEffect
      } else {
        setError(result.error || 'Error en el login');
      }
    } catch (err) {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setIsLoading(false);
    }
  };


  // Mostrar ServiceUnavailable si no hay conectividad
  if (!isOnline) {
    return (
      <ServiceUnavailable 
        onRetry={forceCheck}
        isRetrying={isChecking}
        lastCheckTime={lastCheckTime}
      />
    );
  }

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc3545" />
        <Text style={styles.loadingText}>Verificando autenticación...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {/* Vista para el fondo del StatusBar sin warning */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            {/* Logo placeholder - puedes reemplazar con una imagen real */}
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>🍔</Text>
              </View>
            </View>
            
            <Text style={styles.title}>BOSTON</Text>
            <Text style={styles.subtitle}>American Burgers</Text>
            <Text style={styles.description}>Sistema de Tracking para Deliverys</Text>
          </View>

          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>ID de Empleado</Text>
              <TextInput
                style={styles.input}
                value={credentials.employeeId}
                onChangeText={(value) => handleInputChange('employeeId', value)}
                placeholder="Ej: DEL001"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                autoComplete="username"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={credentials.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Tu contraseña"
                placeholderTextColor="#999"
                secureTextEntry
                autoComplete="password"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loginButtonContent}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.loginButtonText}>Iniciando...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

          </View>

          <View style={styles.footer}>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#0d6efd',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#212529',
  },
  loginButton: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#6c757d',
    elevation: 0,
    shadowOpacity: 0,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#adb5bd',
  },
  statusBarBackground: {
    backgroundColor: '#dc3545',
  },
});

export default LoginScreen;
