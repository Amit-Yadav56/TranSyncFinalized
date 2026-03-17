// src/navigation/OwnerNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

// Screens
import OwnerDashboard from '../screens/owner/OwnerDashboard';
import VehicleListScreen from '../screens/owner/VehicleListScreen';
import AddVehicleScreen from '../screens/owner/AddVehicleScreen';
import CreateTripScreen from '../screens/owner/CreateTripScreen';
import TripListScreen from '../screens/owner/TripListScreen';
import AnalyticsScreen from '../screens/owner/AnalyticsScreen';
import DriverListScreen from '../screens/owner/DriverListScreen';
import AddDriverScreen from '../screens/owner/AddDriverScreen';
import NotificationsScreen from '../screens/owner/NotificationsScreen';
import TripDetailScreen from '../screens/driver/TripDetailScreen';
import FuelEntryScreen from '../screens/driver/FuelEntryScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function OwnerTabs() {
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
            Dashboard: focused ? 'home' : 'home-outline',
            Fleet:     focused ? 'car-sport' : 'car-sport-outline',
            Trips:     focused ? 'map' : 'map-outline',
            Drivers:   focused ? 'people' : 'people-outline',
            Analytics: focused ? 'bar-chart' : 'bar-chart-outline',
          };
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={icons[route.name]} size={21} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboard} />
      <Tab.Screen name="Fleet"     component={VehicleListScreen} />
      <Tab.Screen name="Trips"     component={TripListScreen} />
      <Tab.Screen name="Drivers"   component={DriverListScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}

export default function OwnerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerTabs"   component={OwnerTabs} />
      <Stack.Screen name="AddVehicle"  component={AddVehicleScreen} />
      <Stack.Screen name="VehicleList" component={VehicleListScreen} />
      <Stack.Screen name="CreateTrip"  component={CreateTripScreen} />
      <Stack.Screen name="TripList"    component={TripListScreen} />
      <Stack.Screen name="TripDetail"  component={TripDetailScreen} />
      <Stack.Screen name="FuelEntry"   component={FuelEntryScreen} />
      <Stack.Screen name="DriverList"  component={DriverListScreen} />
      <Stack.Screen name="AddDriver"   component={AddDriverScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
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
  tabLabel: { fontSize: SIZES.fontXs, fontWeight: '600', marginTop: 2 },
  iconWrap: { width: 40, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: SIZES.radiusMd },
  iconWrapActive: { backgroundColor: COLORS.primaryMuted },
});
