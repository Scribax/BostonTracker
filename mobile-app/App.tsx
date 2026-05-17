import 'react-native-get-random-values';
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Alert, AppState, AppStateStatus, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { ConnectivityProvider } from './src/contexts/ConnectivityContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

// Services
import locationService from './src/services/locationService';

// Types
import { RootStackParamList } from './src/types';

// Create stack navigator
const Stack = createStackNavigator<RootStackParamList>();

// ==========================================
// NAVIGATOR COMPONENT
// ==========================================

const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Show loading while checking authentication
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
            headerLeft: () => null,
            gestureEnabled: false,
          }}
        />
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'BOSTON Tracker',
            headerShown: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function App(): JSX.Element | null {
  const [appIsReady, setAppIsReady] = useState<boolean>(false);

  useEffect(() => {
    async function prepare(): Promise<void> {
      try {
        // Load custom fonts (optional)
        await Font.loadAsync({
          // 'custom-font': require('./assets/fonts/CustomFont.ttf'),
        });

        // Initialize services
        await locationService.initialize();

        // Setup app state listener
        const handleAppStateChange = (nextAppState: AppStateStatus): void => {
          console.log('App state changed to:', nextAppState);

          if (nextAppState === 'background' || nextAppState === 'inactive') {
            // App goes to background
            locationService.onAppBackground();
          } else if (nextAppState === 'active') {
            // App comes to foreground
            locationService.onAppForeground();
          }
        };

        // Subscribe to app state changes
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        // Cleanup function
        return () => {
          appStateSubscription?.remove();
        };

      } catch (e) {
        console.warn('Error preparing app:', e);
        Alert.alert(
          'Error',
          'There was a problem starting the application. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        // Mark app as ready
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Callback when layout is ready
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Don't render anything until app is ready
  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ConnectivityProvider>
        <AuthProvider>
          <LocationProvider>
            <NavigationContainer onReady={onLayoutRootView}>
              <StatusBar style="light" />
              <View style={{ height: 0, backgroundColor: '#dc3545' }} />
              <AppNavigator />
            </NavigationContainer>
          </LocationProvider>
        </AuthProvider>
      </ConnectivityProvider>
    </SafeAreaProvider>
  );
}
