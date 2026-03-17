// src/screens/owner/CreateTripScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Input, PrimaryButton, ScreenHeader, Card } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';

export default function CreateTripScreen({ navigation }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ origin: '', destination: '', scheduledDate: '', notes: '' });
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [driverSnap, vehicleSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('ownerId', '==', user.uid), where('role', '==', 'driver'))),
        getDocs(query(collection(db, 'vehicles'), where('ownerId', '==', user.uid))),
      ]);
      setDrivers(driverSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setVehicles(vehicleSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetch();
  }, []);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    if (!form.origin || !form.destination || !selectedDriver || !selectedVehicle)
      return Alert.alert('Error', 'Please fill all required fields and select a driver & vehicle.');

    setLoading(true);
    try {
      await addDoc(collection(db, 'trips'), {
        ownerId: user.uid,
        driverId: selectedDriver.id,
        vehicleId: selectedVehicle.id,
        origin: form.origin,
        destination: form.destination,
        scheduledDate: form.scheduledDate ? new Date(form.scheduledDate) : null,
        notes: form.notes,
        status: 'assigned',
        startTime: null,
        endTime: null,
        startLocation: null,
        endLocation: null,
        distanceKm: null,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Trip Created!', `Assigned to ${selectedDriver.name}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const Selector = ({ label, items, selected, onSelect, display }) => (
    <View style={{ marginBottom: SIZES.md }}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.selectorChip, selected?.id === item.id && styles.selectorChipActive]}
            onPress={() => onSelect(item)}
          >
            <Text style={[styles.selectorText, selected?.id === item.id && styles.selectorTextActive]}>
              {display(item)}
            </Text>
          </TouchableOpacity>
        ))}
        {items.length === 0 && (
          <Text style={styles.emptyChip}>No {label.toLowerCase()} found</Text>
        )}
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScreenHeader title="Create Trip" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Card>
            <Text style={styles.sectionTitle}>Route Details</Text>
            <Input label="Origin *" icon="location-outline" placeholder="Starting location" value={form.origin} onChangeText={(v) => update('origin', v)} />
            <View style={styles.routeArrow}>
              <Ionicons name="arrow-down" size={20} color={COLORS.primary} />
            </View>
            <Input label="Destination *" icon="flag-outline" placeholder="End location" value={form.destination} onChangeText={(v) => update('destination', v)} />
            <Input label="Scheduled Date" icon="calendar-outline" placeholder="YYYY-MM-DD" value={form.scheduledDate} onChangeText={(v) => update('scheduledDate', v)} />
            <Input label="Notes" icon="document-text-outline" placeholder="Special instructions, cargo details..." value={form.notes} onChangeText={(v) => update('notes', v)} multiline numberOfLines={3} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Assign Driver *</Text>
            <Selector
              label="Select Driver"
              items={drivers}
              selected={selectedDriver}
              onSelect={setSelectedDriver}
              display={(d) => d.name}
            />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Assign Vehicle *</Text>
            <Selector
              label="Select Vehicle"
              items={vehicles}
              selected={selectedVehicle}
              onSelect={setSelectedVehicle}
              display={(v) => v.registrationNumber}
            />
            {selectedVehicle && (
              <View style={styles.vehicleInfo}>
                <Ionicons name="car-sport" size={14} color={COLORS.textMuted} />
                <Text style={styles.vehicleInfoText}>{selectedVehicle.model} · {selectedVehicle.type}</Text>
              </View>
            )}
          </Card>

          <PrimaryButton title="Create & Assign Trip" icon="map-outline" onPress={handleCreate} loading={loading} />
          <View style={{ height: SIZES.xxxl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SIZES.md },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginBottom: SIZES.md },
  label: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium, marginBottom: SIZES.sm },
  routeArrow: { alignItems: 'center', marginVertical: -SIZES.xs },
  selectorChip: {
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surfaceBorder,
    marginRight: SIZES.sm, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  selectorChipActive: { backgroundColor: COLORS.primaryMuted, borderColor: COLORS.primary },
  selectorText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  selectorTextActive: { color: COLORS.primary },
  emptyChip: { color: COLORS.textMuted, fontSize: SIZES.fontSm, fontStyle: 'italic' },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SIZES.xs },
  vehicleInfoText: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
});
