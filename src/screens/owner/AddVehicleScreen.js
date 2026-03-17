// src/screens/owner/AddVehicleScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { collection, addDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Input, PrimaryButton, ScreenHeader, Card } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';
import { scheduleDateAlert } from '../../services/notifications';

const VEHICLE_TYPES = ['Truck', 'Mini Truck', 'Van', 'Bus', 'Pickup', 'Tanker'];

export default function AddVehicleScreen({ navigation, route }) {
  const { user } = useAuth();
  const vehicleId = route.params?.vehicleId;
  const isEditMode = !!vehicleId;
  const [form, setForm] = useState({
    registrationNumber: '', model: '', type: 'Truck',
    serviceIntervalKm: '5000', lastServiceKm: '0',
    currentOdometer: '0', rcExpiry: '', insuranceExpiry: '', pollutionExpiry: '',
  });
  const [loading, setLoading] = useState(false);

  const normalizeDateInput = (value) => {
    if (!value) return '';
    const date = value.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  useEffect(() => {
    const loadVehicle = async () => {
      if (!isEditMode) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'vehicles', vehicleId));
        if (!snap.exists()) {
          Alert.alert('Error', 'Vehicle not found.');
          navigation.goBack();
          return;
        }
        const data = snap.data();
        setForm({
          registrationNumber: data.registrationNumber || '',
          model: data.model || '',
          type: data.type || 'Truck',
          serviceIntervalKm: `${data.serviceIntervalKm ?? 5000}`,
          lastServiceKm: `${data.lastServiceKm ?? 0}`,
          currentOdometer: `${data.currentOdometer ?? 0}`,
          rcExpiry: normalizeDateInput(data.rcExpiry),
          insuranceExpiry: normalizeDateInput(data.insuranceExpiry),
          pollutionExpiry: normalizeDateInput(data.pollutionExpiry),
        });
      } catch (e) {
        Alert.alert('Error', 'Failed to load vehicle details.');
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [isEditMode, vehicleId]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.registrationNumber || !form.model)
      return Alert.alert('Error', 'Registration number and model are required.');

    setLoading(true);
    try {
      const payload = {
        ...form,
        ownerId: user.uid,
        serviceIntervalKm: parseFloat(form.serviceIntervalKm) || 5000,
        lastServiceKm: parseFloat(form.lastServiceKm) || 0,
        currentOdometer: parseFloat(form.currentOdometer) || 0,
        rcExpiry: form.rcExpiry || null,
        insuranceExpiry: form.insuranceExpiry || null,
        pollutionExpiry: form.pollutionExpiry || null,
      };

      if (isEditMode) {
        await updateDoc(doc(db, 'vehicles', vehicleId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'vehicles'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      // Schedule expiry alerts
      if (form.rcExpiry) {
        await scheduleDateAlert({
          title: '📋 RC Expiry Alert',
          body: `${form.registrationNumber} RC expires in 7 days!`,
          date: form.rcExpiry,
        });
      }
      if (form.insuranceExpiry) {
        await scheduleDateAlert({
          title: '🛡️ Insurance Expiry',
          body: `${form.registrationNumber} insurance expires in 7 days!`,
          date: form.insuranceExpiry,
        });
      }

      Alert.alert('Success', isEditMode ? 'Vehicle updated successfully!' : 'Vehicle added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save vehicle. ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScreenHeader title={isEditMode ? 'Edit Vehicle' : 'Add Vehicle'} onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Card>
            <Text style={styles.sectionTitle}>Vehicle Info</Text>
            <Input label="Registration Number" icon="document-text-outline" placeholder="MH 12 AB 1234" value={form.registrationNumber} onChangeText={(v) => update('registrationNumber', v.toUpperCase())} autoCapitalize="characters" />
            <Input label="Model / Make" icon="car-outline" placeholder="Tata Ace, Ashok Leyland..." value={form.model} onChangeText={(v) => update('model', v)} />

            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.typeGrid}>
              {VEHICLE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                  onPress={() => update('type', t)}
                >
                  <Text style={[styles.typeBtnText, form.type === t && styles.typeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Odometer & Service</Text>
            <Input label="Current Odometer (km)" icon="speedometer-outline" placeholder="0" keyboardType="numeric" value={form.currentOdometer} onChangeText={(v) => update('currentOdometer', v)} />
            <Input label="Last Service Odometer (km)" icon="construct-outline" placeholder="0" keyboardType="numeric" value={form.lastServiceKm} onChangeText={(v) => update('lastServiceKm', v)} />
            <Input label="Service Interval (km)" icon="refresh-outline" placeholder="5000" keyboardType="numeric" value={form.serviceIntervalKm} onChangeText={(v) => update('serviceIntervalKm', v)} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Document Expiry Dates</Text>
            <Text style={styles.hint}>Format: YYYY-MM-DD (e.g. 2025-12-31)</Text>
            <Input label="RC Expiry Date" icon="document-outline" placeholder="YYYY-MM-DD" value={form.rcExpiry} onChangeText={(v) => update('rcExpiry', v)} />
            <Input label="Insurance Expiry Date" icon="shield-outline" placeholder="YYYY-MM-DD" value={form.insuranceExpiry} onChangeText={(v) => update('insuranceExpiry', v)} />
            <Input label="Pollution Certificate Expiry" icon="leaf-outline" placeholder="YYYY-MM-DD" value={form.pollutionExpiry} onChangeText={(v) => update('pollutionExpiry', v)} />
          </Card>

          <PrimaryButton title={isEditMode ? 'Update Vehicle' : 'Save Vehicle'} icon="checkmark-circle-outline" onPress={handleSave} loading={loading} />
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
  hint: { color: COLORS.textMuted, fontSize: SIZES.fontXs, marginBottom: SIZES.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  typeBtn: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surfaceBorder },
  typeBtnActive: { backgroundColor: COLORS.primaryMuted, borderWidth: 1, borderColor: COLORS.primary },
  typeBtnText: { color: COLORS.textMuted, fontSize: SIZES.fontSm, ...FONTS.medium },
  typeBtnTextActive: { color: COLORS.primary },
});
