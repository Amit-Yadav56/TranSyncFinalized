// src/screens/driver/DriverDashboard.js
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, StatCard, SectionHeader, EmptyState } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';
import { format } from 'date-fns';

const STATUS_TYPE = { assigned: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger' };

export default function DriverDashboard({ navigation }) {
  const { userData, user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, inProgress: 0, completed: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, 'trips'), where('driverId', '==', user.uid))
      );
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTrips(all.sort((a, b) => {
        const order = { in_progress: 0, assigned: 1, completed: 2, cancelled: 3 };
        return (order[a.status] ?? 4) - (order[b.status] ?? 4);
      }));
      setStats({
        assigned: all.filter((t) => t.status === 'assigned').length,
        inProgress: all.filter((t) => t.status === 'in_progress').length,
        completed: all.filter((t) => t.status === 'completed').length,
      });
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchTrips(); setRefreshing(false); };

  const activeTrip = trips.find((t) => t.status === 'in_progress');

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#111827', '#0A0F1E']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, Driver 👋</Text>
            <Text style={styles.name}>{userData?.name}</Text>
            <Badge label="Driver" type="info" />
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Active Trip Banner */}
        {activeTrip && (
          <TouchableOpacity
            style={styles.activeTripBanner}
            onPress={() => navigation.navigate('TripDetail', { tripId: activeTrip.id })}
            activeOpacity={0.9}
          >
            <LinearGradient colors={COLORS.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bannerGradient}>
              <View style={styles.bannerContent}>
                <View>
                  <Text style={styles.bannerLabel}>🚚 ACTIVE TRIP</Text>
                  <Text style={styles.bannerRoute}>{activeTrip.origin} → {activeTrip.destination}</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color="rgba(255,255,255,0.9)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Pending" value={stats.assigned} icon="time-outline" color={COLORS.secondary} style={{ marginRight: SIZES.sm }} />
          <StatCard label="Active" value={stats.inProgress} icon="navigate" color={COLORS.warning} style={{ marginHorizontal: SIZES.xs }} />
          <StatCard label="Done" value={stats.completed} icon="checkmark-done" color={COLORS.success} style={{ marginLeft: SIZES.sm }} />
        </View>

        {/* My Trips */}
        <View style={styles.section}>
          <SectionHeader title="My Trips" />
          {trips.length === 0 ? (
            <EmptyState icon="map-outline" title="No trips assigned" subtitle="Your fleet owner will assign trips to you" />
          ) : (
            trips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
                activeOpacity={0.85}
              >
                <Card style={trip.status === 'in_progress' ? styles.activeCard : undefined}>
                  <View style={styles.tripHeader}>
                    <View style={styles.routeWrap}>
                      <Ionicons name="ellipse" size={8} color={COLORS.success} />
                      <Text style={styles.routeText}>{trip.origin}</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routeWrap}>
                      <Ionicons name="location" size={14} color={COLORS.danger} />
                      <Text style={styles.routeText}>{trip.destination}</Text>
                    </View>
                    <Badge label={trip.status?.replace('_', ' ')} type={STATUS_TYPE[trip.status]} />
                  </View>
                  <View style={styles.tripMeta}>
                    <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.tripMetaText}>
                      {trip.scheduledDate
                        ? format(new Date(trip.scheduledDate.toDate ? trip.scheduledDate.toDate() : trip.scheduledDate), 'dd MMM yyyy')
                        : 'No date set'}
                    </Text>
                    {Number(trip.distanceKm) > 0 && (
                      <>
                        <Ionicons name="speedometer-outline" size={13} color={COLORS.textMuted} style={{ marginLeft: SIZES.sm }} />
                        <Text style={styles.tripMetaText}>{trip.distanceKm} km</Text>
                      </>
                    )}
                  </View>
                  {trip.status === 'assigned' && (
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
                    >
                      <Ionicons name="play-circle" size={16} color={COLORS.primary} />
                      <Text style={styles.startBtnText}>Start Trip</Text>
                    </TouchableOpacity>
                  )}
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
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, padding: SIZES.md },
  activeTripBanner: { borderRadius: SIZES.radiusLg, overflow: 'hidden', marginBottom: SIZES.md },
  bannerGradient: { padding: SIZES.md },
  bannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.fontXs, ...FONTS.bold, letterSpacing: 1 },
  bannerRoute: { color: '#fff', fontSize: SIZES.fontXl, ...FONTS.bold, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginBottom: SIZES.lg },
  section: { marginBottom: SIZES.md },
  activeCard: { borderColor: COLORS.primary, borderWidth: 1.5 },
  tripHeader: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs, marginBottom: SIZES.sm, flexWrap: 'wrap' },
  routeWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeText: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.semiBold },
  routeLine: { flex: 1, height: 1, backgroundColor: COLORS.surfaceBorder, minWidth: 20 },
  tripMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripMetaText: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SIZES.sm, paddingTop: SIZES.sm, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder },
  startBtnText: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.semiBold },
});
