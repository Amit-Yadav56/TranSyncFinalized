// App.js
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import OwnerNavigator from './src/navigation/OwnerNavigator';
import DriverNavigator from './src/navigation/DriverNavigator';
import { initDB } from './src/services/localDB';
import { registerForPushNotifications } from './src/services/notifications';
import { COLORS } from './src/utils/theme';

function RootNavigator() {
  const { user, userData, loading } = useAuth();

  if (loading) return null;

  if (!user) return <AuthNavigator />;
  if (userData?.role === 'owner') return <OwnerNavigator />;
  if (userData?.role === 'driver') return <DriverNavigator />;
  return <AuthNavigator />;
}

function App() {
  useEffect(() => {
    // Init SQLite — non-fatal if it fails
    initDB().catch((e) => console.log('[DB] Init error:', e.message));

    // Init push notifications — non-fatal, local notifications still work
    registerForPushNotifications().catch((e) =>
      console.log('[Notifications] Init error:', e.message)
    );
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={COLORS.background} />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
