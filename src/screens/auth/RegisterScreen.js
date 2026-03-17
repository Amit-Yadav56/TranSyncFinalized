// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input, PrimaryButton } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone)
      return Alert.alert('Error', 'Please fill all fields.');
    if (form.password.length < 6)
      return Alert.alert('Error', 'Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register({ ...form, role: 'owner' });
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0A0F1E', '#111827']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerArea}>
            <View style={styles.iconBox}>
              <Ionicons name="business" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Fleet Owner Sign Up</Text>
            <Text style={styles.subtitle}>
              Create your owner account. You can add drivers from your dashboard after registering.
            </Text>
          </View>

          <View style={styles.card}>
            <Input label="Your Full Name" icon="person-outline" placeholder="e.g. Suresh Patel" value={form.name} onChangeText={(v) => update('name', v)} />
            <Input label="Email Address" icon="mail-outline" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => update('email', v)} />
            <Input label="Phone Number" icon="call-outline" placeholder="+91 9876543210" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => update('phone', v)} />
            <View style={styles.passWrapper}>
              <Input label="Password" icon="lock-closed-outline" placeholder="Min. 6 characters" secureTextEntry={!showPass} value={form.password} onChangeText={(v) => update('password', v)} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <PrimaryButton title="Create Owner Account" onPress={handleRegister} loading={loading} icon="checkmark-circle-outline" />
          </View>

          <View style={styles.noteBox}>
            <Ionicons name="people-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.noteText}>
              Driver accounts are created by you from the dashboard — drivers don't register themselves.
            </Text>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: SIZES.lg, paddingTop: SIZES.xxl },
  backBtn: { marginBottom: SIZES.md },
  headerArea: { alignItems: 'center', marginBottom: SIZES.xl },
  iconBox: { width: 68, height: 68, borderRadius: 18, backgroundColor: COLORS.primaryMuted, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.md },
  title: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.black, textAlign: 'center' },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, textAlign: 'center', marginTop: SIZES.sm, lineHeight: 20 },
  card: { backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusXl, padding: SIZES.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  passWrapper: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 14, top: 38 },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.sm, marginTop: SIZES.lg, padding: SIZES.md, backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  noteText: { flex: 1, color: COLORS.textMuted, fontSize: SIZES.fontXs, lineHeight: 18 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.lg },
  loginText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm },
  loginLink: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.semiBold },
});
