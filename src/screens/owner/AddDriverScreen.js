// src/screens/owner/AddDriverScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Input, PrimaryButton, ScreenHeader, Card } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';

export default function AddDriverScreen({ navigation }) {
  const { user, userData } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', licenseNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.phone)
      return Alert.alert('Error', 'Name, email, phone and password are required.');
    if (form.password.length < 6)
      return Alert.alert('Error', 'Password must be at least 6 characters.');

    setLoading(true);
    try {
      // Create the driver's Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);

      // Save driver profile in Firestore, linked to this owner
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        licenseNumber: form.licenseNumber.trim(),
        role: 'driver',
        ownerId: user.uid,          // Links driver to this owner
        ownerName: userData?.name,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        '✅ Driver Created!',
        `${form.name} has been added.\n\nShare these credentials:\nEmail: ${form.email}\nPassword: ${form.password}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'This email is already registered.');
      } else {
        Alert.alert('Error', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScreenHeader title="Add Driver" subtitle="Create a new driver account" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={COLORS.secondary} />
            <Text style={styles.infoText}>
              You are creating a driver account under your fleet. Share the login credentials with your driver.
            </Text>
          </View>

          <Card>
            <Text style={styles.sectionTitle}>Driver Details</Text>
            <Input
              label="Full Name *"
              icon="person-outline"
              placeholder="e.g. Ravi Kumar"
              value={form.name}
              onChangeText={(v) => update('name', v)}
            />
            <Input
              label="Phone Number *"
              icon="call-outline"
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => update('phone', v)}
            />
            <Input
              label="Driving License Number"
              icon="card-outline"
              placeholder="TN01 2024 0001234"
              autoCapitalize="characters"
              value={form.licenseNumber}
              onChangeText={(v) => update('licenseNumber', v.toUpperCase())}
            />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Login Credentials</Text>
            <Text style={styles.hint}>
              These will be used by the driver to log in to TranSync.
            </Text>
            <Input
              label="Email Address *"
              icon="mail-outline"
              placeholder="driver@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(v) => update('email', v)}
            />
            <View style={styles.passRow}>
              <Input
                label="Password *"
                icon="lock-closed-outline"
                placeholder="Min. 6 characters"
                secureTextEntry={!showPass}
                value={form.password}
                onChangeText={(v) => update('password', v)}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </Card>

          <PrimaryButton
            title="Create Driver Account"
            icon="person-add-outline"
            onPress={handleCreate}
            loading={loading}
          />

          <View style={{ height: SIZES.xxxl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SIZES.md },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.secondaryMuted,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.secondary + '44',
    padding: SIZES.md,
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  infoText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: SIZES.fontSm,
    lineHeight: 20,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.fontLg,
    ...FONTS.bold,
    marginBottom: SIZES.sm,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontXs,
    marginBottom: SIZES.md,
    lineHeight: 18,
  },
  passRow: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 14, top: 38 },
});
