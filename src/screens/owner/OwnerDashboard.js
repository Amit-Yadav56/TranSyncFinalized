// src/screens/owner/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, Badge, SectionHeader, EmptyState } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';
import { format } from 'date-fns';

const STATUS_TYPE = {
  assigned: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const getGreetingByTime = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
};

export default function OwnerDashboard({ navigation }) {
  const { userData, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ vehicles: 0, trips: 0, activeTrips: 0, drivers: 0 });
  const [recentTrips, setRecentTrips] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const greeting = getGreetingByTime();

  const fetchData = async () => {
    try {
      // Stats
      const [vehicleSnap, tripSnap, driverSnap] = await Promise.all([
        getDocs(query(collection(db, 'vehicles'), where('ownerId', '==', userData.uid))),
        getDocs(query(collection(db, 'trips'), where('ownerId', '==', userData.uid))),
        getDocs(query(collection(db, 'users'), where('ownerId', '==', userData.uid), where('role', '==', 'driver'))),
      ]);

      const allTrips = tripSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const activeTrips = allTrips.filter((t) => t.status === 'in_progress').length;

      setStats({
        vehicles: vehicleSnap.size,
        trips: allTrips.length,
        activeTrips,
        drivers: driverSnap.size,
      });

      setRecentTrips(allTrips.slice(0, 5));

      // Document expiry alerts
      const today = new Date();
      const soon = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expAlerts = [];
      vehicleSnap.docs.forEach((d) => {
        const v = d.data();
        const checks = [
          { field: 'RC', date: v.rcExpiry },
          { field: 'Insurance', date: v.insuranceExpiry },
          { field: 'Pollution', date: v.pollutionExpiry },
        ];
        checks.forEach(({ field, date }) => {
          if (date && new Date(date.toDate ? date.toDate() : date) <= soon) {
            expAlerts.push({ vehicle: v.registrationNumber, field, date });
          }
        });
      });
      setAlerts(expAlerts);
    } catch (e) {
      console.log('Dashboard fetch error:', e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#111827', '#0A0F1E']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.name}>{userData?.name}</Text>
            <Badge label="Fleet Owner" type="primary" />
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
              {alerts.length > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Vehicles" value={stats.vehicles} icon="car-sport" color={COLORS.primary} style={{ marginRight: SIZES.sm }} />
          <StatCard label="Drivers" value={stats.drivers} icon="people" color={COLORS.secondary} style={{ marginLeft: SIZES.sm }} />
        </View>
        <View style={[styles.statsRow, { marginTop: SIZES.sm }]}>
          <StatCard label="Total Trips" value={stats.trips} icon="map" color={COLORS.success} style={{ marginRight: SIZES.sm }} />
          <StatCard label="Active Now" value={stats.activeTrips} icon="navigate" color={COLORS.warning} style={{ marginLeft: SIZES.sm }} />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.actionsGrid}>
            {[
              { label: 'Add Vehicle', icon: 'add-circle', color: COLORS.primary, screen: 'AddVehicle' },
              { label: 'Create Trip', icon: 'map-outline', color: COLORS.secondary, screen: 'CreateTrip' },
              { label: 'Add Driver', icon: 'person-add-outline', color: COLORS.success, screen: 'AddDriver' },
              { label: 'Analytics', icon: 'bar-chart-outline', color: COLORS.warning, screen: 'Analytics' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.actionBtn}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: item.color + '22' }]}>
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <Text style={styles.actionLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="⚠️ Document Alerts" />
            {alerts.map((a, i) => (
              <Card key={i} style={styles.alertCard}>
                <View style={styles.alertRow}>
                  <Ionicons name="warning" size={18} color={COLORS.warning} />
                  <View style={{ flex: 1, marginLeft: SIZES.sm }}>
                    <Text style={styles.alertTitle}>{a.vehicle} — {a.field} Expiry</Text>
                    <Text style={styles.alertDate}>
                      {a.date ? format(new Date(a.date.toDate ? a.date.toDate() : a.date), 'dd MMM yyyy') : 'N/A'}
                    </Text>
                  </View>
                  <Badge label="Urgent" type="warning" />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Recent Trips */}
        <View style={styles.section}>
          <SectionHeader title="Recent Trips" action="View All" onAction={() => navigation.navigate('TripList')} />
          {recentTrips.length === 0 ? (
            <EmptyState icon="map-outline" title="No trips yet" subtitle="Create your first trip to get started" />
          ) : (
            recentTrips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
                activeOpacity={0.85}
              >
                <Card>
                  <View style={styles.tripRow}>
                    <View style={styles.tripIconWrap}>
                      <Ionicons name="navigate" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: SIZES.sm }}>
                      <Text style={styles.tripRoute}>{trip.origin} → {trip.destination}</Text>
                      <Text style={styles.tripMeta}>
                        {trip.scheduledDate
                          ? format(new Date(trip.scheduledDate.toDate ? trip.scheduledDate.toDate() : trip.scheduledDate), 'dd MMM')
                          : 'N/A'}
                      </Text>
                    </View>
                    <Badge label={trip.status?.replace('_', ' ')} type={STATUS_TYPE[trip.status] || 'default'} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: SIZES.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingBottom: SIZES.lg, paddingHorizontal: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, marginBottom: 4 },
  name: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.black, marginBottom: SIZES.xs },
  headerActions: { flexDirection: 'row', gap: SIZES.sm },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
  scroll: { flex: 1, padding: SIZES.md },
  statsRow: { flexDirection: 'row' },
  section: { marginTop: SIZES.lg },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  actionBtn: {
    width: '47%', backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radiusLg, padding: SIZES.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.sm },
  actionLabel: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.semiBold },
  alertCard: { borderLeftWidth: 3, borderLeftColor: COLORS.warning },
  alertRow: { flexDirection: 'row', alignItems: 'center' },
  alertTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.semiBold },
  alertDate: { color: COLORS.textMuted, fontSize: SIZES.fontXs, marginTop: 2 },
  tripRow: { flexDirection: 'row', alignItems: 'center' },
  tripIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  tripRoute: { color: COLORS.textPrimary, fontSize: SIZES.fontMd, ...FONTS.semiBold },
  tripMeta: { color: COLORS.textMuted, fontSize: SIZES.fontXs, marginTop: 2 },
});
