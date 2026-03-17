// src/screens/driver/FuelHistoryScreen.js
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, EmptyState } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';
import { format } from 'date-fns';

export default function FuelHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ totalLiters: 0, totalCost: 0, avgMileage: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, 'fuelLogs'), where('driverId', '==', user.uid))
      );
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate - aDate;
        });
      setLogs(all);

      const totalLiters = all.reduce((s, l) => s + (l.liters || 0), 0);
      const totalCost = all.reduce((s, l) => s + (l.totalCost || 0), 0);
      const avgMileage = all.length ? all.reduce((s, l) => s + (l.mileage || 0), 0) / all.length : 0;
      setSummary({
        totalLiters: totalLiters.toFixed(1),
        totalCost: totalCost.toFixed(0),
        avgMileage: avgMileage.toFixed(2),
      });
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => { fetchLogs(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchLogs(); setRefreshing(false); };

  const getMileageColor = (m) => {
    if (m >= 12) return COLORS.success;
    if (m >= 8) return COLORS.warning;
    return COLORS.danger;
  };

  const renderLog = ({ item }) => {
    const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
    const mColor = getMileageColor(item.mileage || 0);

    return (
      <Card>
        <View style={styles.logHeader}>
          <View style={styles.fuelIcon}>
            <Ionicons name="water" size={20} color={COLORS.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: SIZES.sm }}>
            <Text style={styles.logDate}>{format(date, 'dd MMM yyyy, hh:mm a')}</Text>
            <Text style={styles.logOdo}>Odometer: {item.odometer?.toLocaleString()} km</Text>
          </View>
          <Text style={styles.logCost}>₹{item.totalCost?.toFixed(0)}</Text>
        </View>

        <View style={styles.logDetails}>
          <View style={styles.logDetail}>
            <Text style={styles.logDetailLabel}>Quantity</Text>
            <Text style={styles.logDetailValue}>{item.liters}L</Text>
          </View>
          <View style={styles.logDetail}>
            <Text style={styles.logDetailLabel}>Rate</Text>
            <Text style={styles.logDetailValue}>₹{item.pricePerLiter}/L</Text>
          </View>
          <View style={styles.logDetail}>
            <Text style={styles.logDetailLabel}>Mileage</Text>
            <Text style={[styles.logDetailValue, { color: mColor }]}>{item.mileage} km/L</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Fuel Logs</Text>
        <Text style={styles.subtitle}>{logs.length} entries</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Total Fuel" value={`${summary.totalLiters}L`} icon="water" color={COLORS.secondary} style={{ marginRight: SIZES.sm }} />
        <StatCard label="Total Cost" value={`₹${parseInt(summary.totalCost).toLocaleString()}`} icon="cash" color={COLORS.success} style={{ marginHorizontal: SIZES.xs }} />
        <StatCard label="Avg Mileage" value={`${summary.avgMileage}`} icon="speedometer" color={COLORS.warning} style={{ marginLeft: SIZES.sm }} />
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderLog}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="water-outline"
            title="No fuel logs yet"
            subtitle="Fuel logs will appear here after you complete trips"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingBottom: SIZES.md, paddingHorizontal: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder },
  title: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.black },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: SIZES.md, paddingBottom: SIZES.sm },
  list: { padding: SIZES.md, paddingTop: SIZES.sm },
  logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm },
  fuelIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.secondaryMuted, alignItems: 'center', justifyContent: 'center' },
  logDate: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.semiBold },
  logOdo: { color: COLORS.textMuted, fontSize: SIZES.fontXs, marginTop: 2 },
  logCost: { color: COLORS.success, fontSize: SIZES.fontXl, ...FONTS.black },
  logDetails: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder, paddingTop: SIZES.sm },
  logDetail: { flex: 1, alignItems: 'center' },
  logDetailLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
  logDetailValue: { color: COLORS.textPrimary, fontSize: SIZES.fontMd, ...FONTS.bold, marginTop: 2 },
});
