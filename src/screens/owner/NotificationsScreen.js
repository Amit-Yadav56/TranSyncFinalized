// src/screens/owner/NotificationsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader, EmptyState } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';

export default function NotificationsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        subtitle="Fleet alerts and updates"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <EmptyState
          icon="notifications-off-outline"
          title="No notifications yet"
          subtitle="Trip and document alerts will appear here."
        />
        <View style={styles.tipRow}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.tipText}>You can still receive local alerts even when remote push is disabled.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SIZES.md, justifyContent: 'center' },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    marginTop: SIZES.md,
    alignSelf: 'center',
    paddingHorizontal: SIZES.md,
  },
  tipText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontXs,
    ...FONTS.medium,
    flexShrink: 1,
  },
});
