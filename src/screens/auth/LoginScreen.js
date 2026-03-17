// src/screens/auth/LoginScreen.js
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

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields.');
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Navigation handled by AuthContext listener in App.js
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0A0F1E', '#111827']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <Ionicons name="car-sport" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.logoText}>TranSync</Text>
            <Text style={styles.logoTagline}>Smart Transport Management</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <Input
              label="Email Address"
              icon="mail-outline"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.passWrapper}>
              <Input
                label="Password"
                icon="lock-closed-outline"
                placeholder="••••••••"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <PrimaryButton title="Sign In" onPress={handleLogin} loading={loading} icon="log-in-outline" style={styles.loginBtn} />

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
              <Text style={styles.infoText}>Secure</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="cloud-done" size={16} color={COLORS.secondary} />
              <Text style={styles.infoText}>Cloud Synced</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="wifi" size={16} color={COLORS.warning} />
              <Text style={styles.infoText}>Works Offline</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SIZES.lg },
  logoArea: { alignItems: 'center', marginBottom: SIZES.xl },
  logoBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1.5, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  logoText: { color: COLORS.textPrimary, fontSize: SIZES.fontDisplay, ...FONTS.black, letterSpacing: -1 },
  logoTagline: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, marginTop: 4, letterSpacing: 1 },
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  title: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold, marginBottom: 4 },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.fontMd, marginBottom: SIZES.lg },
  passWrapper: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 14, top: 38 },
  loginBtn: { marginTop: SIZES.sm },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.md },
  registerText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm },
  registerLink: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.semiBold },
  infoRow: { flexDirection: 'row', justifyContent: 'center', gap: SIZES.lg, marginTop: SIZES.xl },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
});
