// src/screens/owner/TripListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, EmptyState, ScreenHeader, PrimaryButton } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';
import { format } from 'date-fns';

const STATUS_TYPE = { assigned: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger' };
const FILTERS = ['All', 'Assigned', 'Active', 'Completed', 'Cancelled'];
const FILTER_MAP = { All: null, Assigned: 'assigned', Active: 'in_progress', Completed: 'completed', Cancelled: 'cancelled' };

export default function TripListScreen({ navigation }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'trips'), where('ownerId', '==', user.uid)));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const order = { in_progress: 0, assigned: 1, completed: 2, cancelled: 3 };
          return (order[a.status] ?? 4) - (order[b.status] ?? 4);
        });
      setTrips(all);
      applyFilter(activeFilter, all);
    } catch (e) {
      console.log(e);
    }
  };

  const applyFilter = (filter, source = trips) => {
    setActiveFilter(filter);
    const statusVal = FILTER_MAP[filter];
    setFiltered(statusVal ? source.filter((t) => t.status === statusVal) : source);
  };

  useEffect(() => { fetchTrips(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchTrips(); setRefreshing(false); };

  const renderTrip = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
      activeOpacity={0.85}
    >
      <Card>
        {/* Status + Date Row */}
        <View style={styles.topRow}>
          <Badge label={item.status?.replace('_', ' ')} type={STATUS_TYPE[item.status]} />
          <Text style={styles.dateText}>
            {item.scheduledDate
              ? format(new Date(item.scheduledDate.toDate ? item.scheduledDate.toDate() : item.scheduledDate), 'dd MMM yyyy')
              : 'No date'}
          </Text>
        </View>

        {/* Route */}
        <View style={styles.routeRow}>
          <View style={styles.routeCol}>
            <View style={styles.routeDot} />
            <Text style={styles.routeText}>{item.origin}</Text>
          </View>
          <View style={styles.routeArrow}>
            <Ionicons name="arrow-forward" size={14} color={COLORS.textMuted} />
          </View>
          <View style={[styles.routeCol, { alignItems: 'flex-end' }]}>
            <Ionicons name="location" size={12} color={COLORS.danger} />
            <Text style={styles.routeText}>{item.destination}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          {Number(item.distanceKm) > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{item.distanceKm} km</Text>
            </View>
          )}
          {item.startTime && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaText}>
                Started {format(new Date(item.startTime.toDate ? item.startTime.toDate() : item.startTime), 'hh:mm a')}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="All Trips"
        subtitle={`${filtered.length} trip${filtered.length !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateTrip')}>
            <Ionicons name="add" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(i) => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => applyFilter(item)}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
                {item}
              </Text>
              {item !== 'All' && (
                <Text style={[styles.filterCount, activeFilter === item && styles.filterTextActive]}>
                  {' '}({trips.filter((t) => FILTER_MAP[item] ? t.status === FILTER_MAP[item] : true).length})
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="map-outline"
            title="No trips found"
            subtitle={activeFilter !== 'All' ? `No ${activeFilter.toLowerCase()} trips` : 'Create your first trip'}
          />
        }
      />

      <View style={styles.fab}>
        <PrimaryButton
          title="Create Trip"
          icon="add-circle-outline"
          onPress={() => navigation.navigate('CreateTrip')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  filterContainer: { borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder },
  filterList: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, gap: SIZES.sm },
  filterChip: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surfaceElevated, flexDirection: 'row' },
  filterChipActive: { backgroundColor: COLORS.primaryMuted, borderWidth: 1, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontSize: SIZES.fontSm, fontWeight: '500' },
  filterTextActive: { color: COLORS.primary, fontWeight: '700' },
  filterCount: { color: COLORS.textMuted, fontSize: SIZES.fontSm },
  list: { padding: SIZES.md, paddingBottom: 100 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  dateText: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm },
  routeCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  routeText: { color: COLORS.textPrimary, fontSize: SIZES.fontMd, fontWeight: '600', flex: 1 },
  routeArrow: { paddingHorizontal: SIZES.xs },
  metaRow: { flexDirection: 'row', gap: SIZES.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
  fab: { position: 'absolute', bottom: SIZES.lg, left: SIZES.lg, right: SIZES.lg },
});
