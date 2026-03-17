// src/screens/driver/TripDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import * as Location from 'expo-location';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, PrimaryButton, SecondaryButton, ScreenHeader, Divider } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';
import { sendTripStartNotification, sendTripEndNotification } from '../../services/notifications';
import { updateTripStatus } from '../../services/localDB';
import { format } from 'date-fns';

const STATUS_TYPE = { assigned: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger' };

export default function TripDetailScreen({ navigation, route }) {
  const { tripId } = route.params;
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const fetchTrip = async () => {
    const tripDoc = await getDoc(doc(db, 'trips', tripId));
    if (tripDoc.exists()) {
      const data = { id: tripDoc.id, ...tripDoc.data() };
      setTrip(data);
      if (data.vehicleId) {
        const vDoc = await getDoc(doc(db, 'vehicles', data.vehicleId));
        if (vDoc.exists()) setVehicle({ id: vDoc.id, ...vDoc.data() });
      }
      // Start timer if in_progress
      if (data.status === 'in_progress' && data.startTime) {
        const start = data.startTime.toDate ? data.startTime.toDate() : new Date(data.startTime);
        setElapsed(Math.floor((Date.now() - start.getTime()) / 1000));
      }
    }
  };

  useEffect(() => {
    fetchTrip();
    return () => clearInterval(timerRef.current);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchTrip();
    }, [tripId])
  );

  useEffect(() => {
    if (trip?.status === 'in_progress') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [trip?.status]);

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for trip tracking.');
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  };

  const handleStartTrip = async () => {
    Alert.alert('Start Trip', `Are you ready to start the trip from ${trip.origin}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start Now', onPress: async () => {
          setLoading(true);
          const location = await getLocation();
          try {
            await updateDoc(doc(db, 'trips', tripId), {
              status: 'in_progress',
              startTime: serverTimestamp(),
              startLocation: location,
            });
            await updateTripStatus(tripId, 'in_progress', { startTime: new Date().toISOString() });
            await sendTripStartNotification();
            await fetchTrip();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleEndTrip = async () => {
    Alert.alert('End Trip', 'Are you sure you want to mark this trip as complete?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Trip', onPress: async () => {
          setLoading(true);
          const location = await getLocation();
          try {
            // Calculate rough distance if start location exists
            let distanceKm = null;
            if (trip.startLocation && location) {
              const R = 6371;
              const dLat = (location.lat - trip.startLocation.lat) * Math.PI / 180;
              const dLon = (location.lng - trip.startLocation.lng) * Math.PI / 180;
              const a = Math.sin(dLat / 2) ** 2 + Math.cos(trip.startLocation.lat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
              distanceKm = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
            }
            await updateDoc(doc(db, 'trips', tripId), {
              status: 'completed',
              endTime: serverTimestamp(),
              endLocation: location,
              distanceKm,
            });
            await updateTripStatus(tripId, 'completed', { endTime: new Date().toISOString(), distanceKm });
            await sendTripEndNotification();
            await fetchTrip();
            // Navigate to fuel log
            Alert.alert('Trip Completed! 🎉', 'Would you like to log the fuel for this trip?', [
              { text: 'Skip', style: 'cancel' },
              { text: 'Log Fuel', onPress: () => navigation.navigate('FuelEntry', { tripId, vehicleId: trip.vehicleId }) },
            ]);
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (user?.uid && trip?.driverId === user.uid) {
      navigation.navigate('DriverTabs');
      return;
    }

    navigation.navigate('OwnerTabs');
  };

  if (!trip) return (
    <View style={styles.container}>
      <ScreenHeader title="Trip Details" onBack={handleBack} />
      <View style={styles.loading}><Ionicons name="reload" size={32} color={COLORS.textMuted} /></View>
    </View>
  );

  const isDriver = trip.driverId === user.uid;
  const canEditTrip = !isDriver && trip.status !== 'in_progress';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Trip Details"
        onBack={handleBack}
        rightAction={
          <View style={styles.headerActions}>
            {canEditTrip && (
              <TouchableOpacity onPress={() => navigation.navigate('CreateTrip', { tripId })}>
                <Ionicons name="create-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <Badge label={trip.status?.replace('_', ' ')} type={STATUS_TYPE[trip.status]} />
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Timer (for active trips) */}
        {trip.status === 'in_progress' && (
          <View style={styles.timerCard}>
            <Ionicons name="timer" size={24} color={COLORS.primary} />
            <Text style={styles.timerLabel}>Trip in Progress</Text>
            <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
          </View>
        )}

        {/* Route Card */}
        <Card>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeBlock}>
            <View style={styles.routePoint}>
              <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
              <View>
                <Text style={styles.routePointLabel}>FROM</Text>
                <Text style={styles.routePointText}>{trip.origin}</Text>
              </View>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routePoint}>
              <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
              <View>
                <Text style={styles.routePointLabel}>TO</Text>
                <Text style={styles.routePointText}>{trip.destination}</Text>
              </View>
            </View>
          </View>
          {trip.distanceKm && (
            <View style={styles.distanceRow}>
              <Ionicons name="navigate-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.distanceText}>{trip.distanceKm} km traveled</Text>
            </View>
          )}
        </Card>

        {/* Trip Info */}
        <Card>
          <Text style={styles.sectionTitle}>Trip Info</Text>
          <View style={styles.infoGrid}>
            <InfoRow icon="calendar-outline" label="Scheduled" value={
              trip.scheduledDate
                ? format(new Date(trip.scheduledDate.toDate ? trip.scheduledDate.toDate() : trip.scheduledDate), 'dd MMM yyyy')
                : 'Not set'
            } />
            {trip.startTime && (
              <InfoRow icon="play-circle-outline" label="Started" value={
                format(new Date(trip.startTime.toDate ? trip.startTime.toDate() : trip.startTime), 'dd MMM, hh:mm a')
              } />
            )}
            {trip.endTime && (
              <InfoRow icon="stop-circle-outline" label="Ended" value={
                format(new Date(trip.endTime.toDate ? trip.endTime.toDate() : trip.endTime), 'dd MMM, hh:mm a')
              } />
            )}
            {vehicle && <InfoRow icon="car-sport-outline" label="Vehicle" value={`${vehicle.registrationNumber} · ${vehicle.model}`} />}
            {trip.notes && <InfoRow icon="document-text-outline" label="Notes" value={trip.notes} />}
          </View>
        </Card>

        <Divider />

        {/* Actions */}
        {isDriver && trip.status === 'assigned' && (
          <PrimaryButton title="Start Trip" icon="play-circle-outline" onPress={handleStartTrip} loading={loading} />
        )}
        {isDriver && trip.status === 'in_progress' && (
          <View style={styles.actionRow}>
            <SecondaryButton
              title="Log Fuel"
              icon="water-outline"
              onPress={() => navigation.navigate('FuelEntry', { tripId, vehicleId: trip.vehicleId })}
              style={{ flex: 1, marginRight: SIZES.sm }}
            />
            <PrimaryButton
              title="End Trip"
              icon="stop-circle-outline"
              onPress={handleEndTrip}
              loading={loading}
              style={{ flex: 1 }}
            />
          </View>
        )}

        <View style={{ height: SIZES.xxxl }} />
      </ScrollView>
    </View>
  );
}

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={16} color={COLORS.textMuted} style={{ marginRight: SIZES.sm }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SIZES.md },
  timerCard: {
    backgroundColor: COLORS.primaryMuted, borderRadius: SIZES.radiusLg,
    borderWidth: 1, borderColor: COLORS.primary,
    padding: SIZES.lg, alignItems: 'center', marginBottom: SIZES.md,
  },
  timerLabel: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.semiBold, marginTop: SIZES.xs },
  timer: { color: COLORS.textPrimary, fontSize: SIZES.fontDisplay, ...FONTS.black, fontVariant: ['tabular-nums'] },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginBottom: SIZES.md },
  routeBlock: { paddingLeft: SIZES.xs },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  routePointLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.bold, letterSpacing: 0.5 },
  routePointText: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  routeConnector: { width: 2, height: 24, backgroundColor: COLORS.surfaceBorder, marginLeft: 5, marginVertical: 4 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SIZES.sm, paddingTop: SIZES.sm, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder },
  distanceText: { color: COLORS.textMuted, fontSize: SIZES.fontSm },
  infoGrid: { gap: SIZES.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium },
  infoValue: { color: COLORS.textPrimary, fontSize: SIZES.fontMd, ...FONTS.medium, marginTop: 2 },
  actionRow: { flexDirection: 'row' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
});
