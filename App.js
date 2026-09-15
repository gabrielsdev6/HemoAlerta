import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import { DrawerProvider } from './src/context/DrawerContext';
import { usePushToken } from './src/hooks/usePushToken';
import AppNavigator from './src/navigation/AppNavigator';
import AppDrawer from './src/components/AppDrawer';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function NotificationBridge() {
  usePushToken();
  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DrawerProvider>
          <NotificationBridge />
          <AppNavigator />
          <AppDrawer />
          <StatusBar style="light" />
        </DrawerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
