// src/screens/owner/VehicleDetailScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../services/firebase';
import { Card, Badge, ScreenHeader, EmptyState } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';

const getStatus = (dateValue) => {
  if (!dateValue) return null;
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { type: 'danger', label: 'Expired' };
  if (daysLeft <= 30) return { type: 'warning', label: `${daysLeft}d left` };
  return { type: 'success', label: 'Valid' };
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'Not set';
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return format(date, 'dd MMM yyyy');
};

const InfoRow = ({ label, value, icon }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={16} color={COLORS.textMuted} style={styles.infoIcon} />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? 'N/A'}</Text>
    </View>
  </View>
);

export default function VehicleDetailScreen({ navigation, route }) {
  const { vehicleId } = route.params || {};
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'vehicles', vehicleId));
        if (snap.exists()) {
          setVehicle({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        Alert.alert('Error', 'Unable to load vehicle details.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  const rcStatus = getStatus(vehicle?.rcExpiry);
  const insuranceStatus = getStatus(vehicle?.insuranceExpiry);
  const pollutionStatus = getStatus(vehicle?.pollutionExpiry);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Vehicle Details" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <Ionicons name="reload" size={30} color={COLORS.textMuted} />
          <Text style={styles.loadingText}>Loading vehicle...</Text>
        </View>
      ) : !vehicle ? (
        <EmptyState
          icon="car-outline"
          title="Vehicle not found"
          subtitle="This vehicle may have been deleted."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="car-sport" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: SIZES.sm }}>
                <Text style={styles.regText}>{vehicle.registrationNumber || 'N/A'}</Text>
                <Text style={styles.modelText}>{vehicle.model || 'Unknown'} · {vehicle.type || 'Unknown'}</Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              {rcStatus && <Badge label={`RC: ${rcStatus.label}`} type={rcStatus.type} />}
              {insuranceStatus && <Badge label={`Insurance: ${insuranceStatus.label}`} type={insuranceStatus.type} />}
              {pollutionStatus && <Badge label={`Pollution: ${pollutionStatus.label}`} type={pollutionStatus.type} />}
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Odometer & Service</Text>
            <InfoRow icon="speedometer-outline" label="Current Odometer" value={`${vehicle.currentOdometer || 0} km`} />
            <InfoRow icon="construct-outline" label="Last Service" value={`${vehicle.lastServiceKm || 0} km`} />
            <InfoRow icon="refresh-outline" label="Service Interval" value={`${vehicle.serviceIntervalKm || 0} km`} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Document Expiry</Text>
            <InfoRow icon="document-outline" label="RC Expiry" value={formatDate(vehicle.rcExpiry)} />
            <InfoRow icon="shield-outline" label="Insurance Expiry" value={formatDate(vehicle.insuranceExpiry)} />
            <InfoRow icon="leaf-outline" label="Pollution Expiry" value={formatDate(vehicle.pollutionExpiry)} />
          </Card>

          <View style={{ height: SIZES.xxxl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SIZES.md },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.textMuted, marginTop: SIZES.sm, fontSize: SIZES.fontSm },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryMuted,
  },
  regText: { color: COLORS.textPrimary, fontSize: SIZES.fontXl, ...FONTS.bold },
  modelText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginTop: SIZES.md },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginBottom: SIZES.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.sm },
  infoIcon: { marginRight: SIZES.sm },
  infoContent: { flex: 1 },
  infoLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
  infoValue: { color: COLORS.textPrimary, fontSize: SIZES.fontMd, ...FONTS.medium, marginTop: 2 },
});
