// src/screens/driver/FuelEntryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, getDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Input, PrimaryButton, ScreenHeader, Card, Divider } from '../../components';
import { saveFuelLog } from '../../services/localDB';
import { COLORS, SIZES, FONTS } from '../../utils/theme';

export default function FuelEntryScreen({ navigation, route }) {
  const { tripId, vehicleId } = route.params;
  const { user } = useAuth();
  const [form, setForm] = useState({ liters: '', pricePerLiter: '', odometer: '' });
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState({ totalCost: 0, mileage: 0 });

  useEffect(() => {
    if (vehicleId) {
      getDoc(doc(db, 'vehicles', vehicleId)).then((d) => {
        if (d.exists()) setVehicle({ id: d.id, ...d.data() });
      });
    }
  }, [vehicleId]);

  useEffect(() => {
    const liters = parseFloat(form.liters) || 0;
    const price = parseFloat(form.pricePerLiter) || 0;
    const odo = parseFloat(form.odometer) || 0;
    const totalCost = liters * price;
    const mileage = liters > 0 && vehicle?.lastServiceKm
      ? (odo - vehicle.lastServiceKm) / liters
      : 0;
    setPreview({ totalCost: totalCost.toFixed(2), mileage: mileage.toFixed(2) });
  }, [form]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('DriverTabs');
  };

  const handleSave = async () => {
    if (!form.liters || !form.pricePerLiter || !form.odometer)
      return Alert.alert('Error', 'Please fill all required fields.');

    setLoading(true);
    const liters = parseFloat(form.liters);
    const pricePerLiter = parseFloat(form.pricePerLiter);
    const odometer = parseFloat(form.odometer);
    const totalCost = liters * pricePerLiter;
    const mileage = vehicle?.lastServiceKm ? (odometer - vehicle.lastServiceKm) / liters : 0;

    try {
      const logRef = await addDoc(collection(db, 'fuelLogs'), {
        tripId,
        vehicleId,
        driverId: user.uid,
        liters,
        pricePerLiter,
        totalCost,
        odometer,
        mileage: parseFloat(mileage.toFixed(2)),
        createdAt: serverTimestamp(),
      });

      // Save offline too
      await saveFuelLog({
        id: logRef.id,
        tripId, vehicleId, driverId: user.uid,
        liters, pricePerLiter, totalCost, odometer,
        mileage: parseFloat(mileage.toFixed(2)),
      });

      // Update vehicle odometer
      if (vehicleId) {
        await updateDoc(doc(db, 'vehicles', vehicleId), { currentOdometer: odometer });
      }

      Alert.alert('Fuel Logged! ⛽', `${liters}L at ₹${pricePerLiter}/L\nTotal: ₹${totalCost.toFixed(0)}\nMileage: ${mileage.toFixed(2)} km/L`, [
        { text: 'OK', onPress: handleBack },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScreenHeader title="Log Fuel" subtitle="Enter fuel details for this trip" onBack={handleBack} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {vehicle && (
            <Card style={styles.vehicleCard}>
              <Ionicons name="car-sport" size={20} color={COLORS.primary} />
              <View style={{ marginLeft: SIZES.sm }}>
                <Text style={styles.vehicleReg}>{vehicle.registrationNumber}</Text>
                <Text style={styles.vehicleModel}>{vehicle.model}</Text>
              </View>
            </Card>
          )}

          <Card>
            <Text style={styles.sectionTitle}>Fuel Details</Text>
            <Input
              label="Fuel Quantity (Liters) *"
              icon="water-outline"
              placeholder="e.g. 45.5"
              keyboardType="numeric"
              value={form.liters}
              onChangeText={(v) => update('liters', v)}
            />
            <Input
              label="Price per Liter (₹) *"
              icon="pricetag-outline"
              placeholder="e.g. 96.72"
              keyboardType="numeric"
              value={form.pricePerLiter}
              onChangeText={(v) => update('pricePerLiter', v)}
            />
            <Input
              label="Current Odometer (km) *"
              icon="speedometer-outline"
              placeholder="e.g. 54250"
              keyboardType="numeric"
              value={form.odometer}
              onChangeText={(v) => update('odometer', v)}
            />
          </Card>

          {/* Live Preview */}
          <Card style={styles.previewCard}>
            <Text style={styles.previewTitle}>📊 Calculated Summary</Text>
            <Divider />
            <View style={styles.previewRow}>
              <View style={styles.previewItem}>
                <Ionicons name="cash-outline" size={24} color={COLORS.success} />
                <Text style={styles.previewValue}>₹{preview.totalCost}</Text>
                <Text style={styles.previewLabel}>Total Cost</Text>
              </View>
              <View style={styles.previewDivider} />
              <View style={styles.previewItem}>
                <Ionicons name="speedometer-outline" size={24} color={COLORS.secondary} />
                <Text style={styles.previewValue}>{preview.mileage}</Text>
                <Text style={styles.previewLabel}>km/Liter</Text>
              </View>
            </View>
            {parseFloat(preview.mileage) > 0 && (
              <View style={styles.efficiencyBar}>
                <Text style={styles.effLabel}>
                  {parseFloat(preview.mileage) >= 12 ? '🟢 Good efficiency' :
                    parseFloat(preview.mileage) >= 8 ? '🟡 Average efficiency' : '🔴 Poor efficiency'}
                </Text>
              </View>
            )}
          </Card>

          <PrimaryButton title="Save Fuel Log" icon="save-outline" onPress={handleSave} loading={loading} />
          <View style={{ height: SIZES.xxxl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SIZES.md },
  vehicleCard: { flexDirection: 'row', alignItems: 'center' },
  vehicleReg: { color: COLORS.textPrimary, fontSize: SIZES.fontMd, ...FONTS.bold },
  vehicleModel: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginBottom: SIZES.md },
  previewCard: { borderColor: COLORS.secondary, borderWidth: 1 },
  previewTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontMd, ...FONTS.bold, marginBottom: SIZES.sm },
  previewRow: { flexDirection: 'row', alignItems: 'center' },
  previewItem: { flex: 1, alignItems: 'center', paddingVertical: SIZES.sm },
  previewValue: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.black, marginTop: 4 },
  previewLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs, marginTop: 2 },
  previewDivider: { width: 1, height: 60, backgroundColor: COLORS.surfaceBorder },
  efficiencyBar: { marginTop: SIZES.sm, paddingTop: SIZES.sm, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder, alignItems: 'center' },
  effLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontSm },
});
