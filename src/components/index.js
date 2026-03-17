// src/components/index.js
//hi
import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';

// ── PrimaryButton ──────────────────────────────────────────────────────────
export const PrimaryButton = ({ title, onPress, loading, style, icon }) => (
  <TouchableOpacity onPress={onPress} disabled={loading} style={[styles.btnWrapper, style]} activeOpacity={0.85}>
    <LinearGradient colors={COLORS.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 8 }} />}
          <Text style={styles.btnText}>{title}</Text>
        </>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

// ── SecondaryButton ────────────────────────────────────────────────────────
export const SecondaryButton = ({ title, onPress, style, icon }) => (
  <TouchableOpacity onPress={onPress} style={[styles.secondaryBtn, style]} activeOpacity={0.8}>
    {icon && <Ionicons name={icon} size={16} color={COLORS.primary} style={{ marginRight: 6 }} />}
    <Text style={styles.secondaryBtnText}>{title}</Text>
  </TouchableOpacity>
);

// ── Input ──────────────────────────────────────────────────────────────────
export const Input = ({ label, icon, error, ...props }) => (
  <View style={styles.inputWrapper}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.inputContainer, error && { borderColor: COLORS.danger }]}>
      {icon && <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.inputIcon} />}
      <TextInput
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ── Card ───────────────────────────────────────────────────────────────────
export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ── StatCard ───────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon, color, style }) => (
  <View style={[styles.statCard, style]}>
    <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ── Badge ──────────────────────────────────────────────────────────────────
export const Badge = ({ label, type = 'default' }) => {
  const colors = {
    default: { bg: COLORS.surfaceElevated, text: COLORS.textSecondary },
    success: { bg: COLORS.successMuted, text: COLORS.success },
    warning: { bg: COLORS.warningMuted, text: COLORS.warning },
    danger: { bg: COLORS.dangerMuted, text: COLORS.danger },
    primary: { bg: COLORS.primaryMuted, text: COLORS.primary },
    info: { bg: COLORS.secondaryMuted, text: COLORS.secondary },
  };
  const c = colors[type] || colors.default;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
};

// ── SectionHeader ──────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Header ────────────────────────────────────────────────────────────────
export const ScreenHeader = ({ title, subtitle, onBack, rightAction }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screenHeader, { paddingTop: insets.top + SIZES.sm }]}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {rightAction}
    </View>
  );
};

// ── EmptyState ─────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, subtitle }) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon} size={56} color={COLORS.textMuted} />
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

// ── Divider ────────────────────────────────────────────────────────────────
export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

const styles = StyleSheet.create({
  // Button
  btnWrapper: { borderRadius: SIZES.radiusMd, overflow: 'hidden', ...SHADOWS.lg },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 24 },
  btnText: { color: '#fff', fontSize: SIZES.fontLg, ...FONTS.bold },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 20, borderRadius: SIZES.radiusMd, borderWidth: 1.5, borderColor: COLORS.primary },
  secondaryBtnText: { color: COLORS.primary, fontSize: SIZES.fontMd, ...FONTS.semiBold },

  // Input
  inputWrapper: { marginBottom: SIZES.md },
  label: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium, marginBottom: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.surfaceBorder, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.fontMd, paddingVertical: 14 },
  errorText: { color: COLORS.danger, fontSize: SIZES.fontXs, marginTop: 4 },

  // Card
  card: { backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusLg, padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.surfaceBorder, ...SHADOWS.sm },

  // StatCard
  statCard: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusLg, padding: SIZES.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.sm },
  statValue: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.black },
  statLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontXs, ...FONTS.medium, marginTop: 2 },

  // Badge
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  badgeText: { fontSize: SIZES.fontXs, ...FONTS.semiBold },

  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  sectionAction: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.semiBold },

  // Screen Header
  screenHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm },
  backBtn: { marginRight: SIZES.sm, padding: 4 },
  headerTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold },
  headerSubtitle: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, marginTop: 2 },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: SIZES.xxxl },
  emptyTitle: { color: COLORS.textSecondary, fontSize: SIZES.fontLg, ...FONTS.semiBold, marginTop: SIZES.md },
  emptySubtitle: { color: COLORS.textMuted, fontSize: SIZES.fontSm, marginTop: 6, textAlign: 'center' },

  // Divider
  divider: { height: 1, backgroundColor: COLORS.surfaceBorder, marginVertical: SIZES.md },
});
