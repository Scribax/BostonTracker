import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Alert, AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importar contextos
import { AuthProvider } from './src/contexts/AuthContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { ConnectivityProvider } from './src/contexts/ConnectivityContext';

// Importar pantallas
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import { useAuth } from './src/contexts/AuthContext';

// Importar servicios
import locationService from './src/services/locationService';

// Crear stack navigator
const Stack = createStackNavigator();

// Prevenir que se oculte el splash screen automáticamente
SplashScreen.preventAutoHideAsync();

// Componente de navegación que maneja la autenticación
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    // Mostrar loading mientras verifica autenticación
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#dc3545',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'BOSTON Tracker',
            headerLeft: null, // Deshabilitar botón de volver
            gestureEnabled: false, // Deshabilitar gesto de volver
          }}
        />
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'BOSTON Tracker',
            headerShown: false, // Ocultar header en login
          }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Cargar fuentes personalizadas (opcional)
        await Font.loadAsync({
          // 'custom-font': require('./assets/fonts/CustomFont.ttf'),
        });

        // Inicializar servicios
        await locationService.initialize();

        // Configurar listener del estado de la app
        const handleAppStateChange = (nextAppState) => {
          console.log('App state changed to:', nextAppState);
          
          if (nextAppState === 'background' || nextAppState === 'inactive') {
            // La app va a segundo plano
            locationService.onAppBackground();
          } else if (nextAppState === 'active') {
            // La app vuelve a primer plano
            locationService.onAppForeground();
          }
        };

        // Suscribirse a cambios de estado de la app
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        // Cleanup function
        return () => {
          appStateSubscription?.remove();
        };

      } catch (e) {
        console.warn('Error preparando la app:', e);
        Alert.alert(
          'Error',
          'Hubo un problema iniciando la aplicación. Por favor reinténtalo.',
          [{ text: 'OK' }]
        );
      } finally {
        // Marcar app como lista
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Callback cuando el layout está listo
  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      // Ocultar splash screen
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // No renderizar nada hasta que la app esté lista
  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ConnectivityProvider>
        <AuthProvider>
          <LocationProvider>
            <NavigationContainer onReady={onLayoutRootView}>
            {/* StatusBar sin backgroundColor para evitar warning */}
            <StatusBar style="light" />
            {/* Vista para el color de fondo del StatusBar */}
            <View style={{ height: 0, backgroundColor: '#dc3545' }} />
            
            <AppNavigator />
            </NavigationContainer>
          </LocationProvider>
        </AuthProvider>
      </ConnectivityProvider>
    </SafeAreaProvider>
  );
}
