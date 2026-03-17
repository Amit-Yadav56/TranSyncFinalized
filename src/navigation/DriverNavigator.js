// src/navigation/DriverNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

// Screens
import DriverDashboard from '../screens/driver/DriverDashboard';
import TripDetailScreen from '../screens/driver/TripDetailScreen';
import FuelEntryScreen from '../screens/driver/FuelEntryScreen';
import FuelHistoryScreen from '../screens/driver/FuelHistoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            'My Trips': focused ? 'map' : 'map-outline',
            'Fuel Logs': focused ? 'water' : 'water-outline',
          };
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={icons[route.name]} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="My Trips" component={DriverDashboard} />
      <Tab.Screen name="Fuel Logs" component={FuelHistoryScreen} />
    </Tab.Navigator>
  );
}

export default function DriverNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverTabs" component={DriverTabs} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="FuelEntry" component={FuelEntryScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.surfaceBorder,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radiusMd,
  },
  iconWrapActive: {
    backgroundColor: COLORS.primaryMuted,
  },
});
