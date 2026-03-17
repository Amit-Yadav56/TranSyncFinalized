// src/screens/owner/VehicleListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, EmptyState, ScreenHeader, PrimaryButton } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';
import { format, differenceInDays } from 'date-fns';

const getExpiryStatus = (dateVal) => {
  if (!dateVal) return null;
  const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  const days = differenceInDays(date, new Date());
  if (days < 0) return { type: 'danger', label: 'Expired' };
  if (days <= 30) return { type: 'warning', label: `${days}d left` };
  return { type: 'success', label: 'Valid' };
};

export default function VehicleListScreen({ navigation }) {
  const { userData } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, 'vehicles'), where('ownerId', '==', userData.uid))
      );
      setVehicles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      Alert.alert('Error', 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);
  useFocusEffect(
    React.useCallback(() => {
      fetchVehicles();
    }, [userData?.uid])
  );

  const handleDelete = (id) => {
    Alert.alert('Delete Vehicle', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'vehicles', id));
          fetchVehicles();
        },
      },
    ]);
  };

  const renderVehicle = ({ item }) => {
    const rc = getExpiryStatus(item.rcExpiry);
    const ins = getExpiryStatus(item.insuranceExpiry);
    const pol = getExpiryStatus(item.pollutionExpiry);
    const serviceKmLeft = (item.serviceIntervalKm || 0) - ((item.currentOdometer || 0) - (item.lastServiceKm || 0));

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
        activeOpacity={0.85}
      >
        <Card>
          {/* Title Row */}
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleIconWrap}>
              <Ionicons name="car-sport" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: SIZES.sm }}>
              <Text style={styles.vehicleReg}>{item.registrationNumber}</Text>
              <Text style={styles.vehicleModel}>{item.model} · {item.type}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>

          {/* Odometer */}
          <View style={styles.odometerRow}>
            <Ionicons name="speedometer-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.odometerText}>{item.currentOdometer?.toLocaleString() || 0} km</Text>
            {serviceKmLeft > 0 && (
              <Text style={styles.serviceText}>  |  Service in {serviceKmLeft.toFixed(0)} km</Text>
            )}
          </View>

          {/* Document Status */}
          <View style={styles.docRow}>
            {rc && (
              <View style={styles.docItem}>
                <Text style={styles.docLabel}>RC</Text>
                <Badge label={rc.label} type={rc.type} />
              </View>
            )}
            {ins && (
              <View style={styles.docItem}>
                <Text style={styles.docLabel}>Insurance</Text>
                <Badge label={ins.label} type={ins.type} />
              </View>
            )}
            {pol && (
              <View style={styles.docItem}>
                <Text style={styles.docLabel}>Pollution</Text>
                <Badge label={pol.label} type={pol.type} />
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Fleet"
        subtitle={`${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddVehicle')}
          >
            <Ionicons name="add" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicle}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="car-outline"
              title="No vehicles yet"
              subtitle="Add your first vehicle to get started"
            />
          )
        }
      />
      <View style={styles.fab}>
        <PrimaryButton
          title="Add Vehicle"
          icon="add-circle-outline"
          onPress={() => navigation.navigate('AddVehicle')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SIZES.md, paddingBottom: 100 },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm },
  vehicleIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  vehicleReg: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  vehicleModel: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, marginTop: 2 },
  odometerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm },
  odometerText: { color: COLORS.textMuted, fontSize: SIZES.fontSm, marginLeft: 4 },
  serviceText: { color: COLORS.warning, fontSize: SIZES.fontSm },
  docRow: { flexDirection: 'row', gap: SIZES.sm, flexWrap: 'wrap' },
  docItem: { alignItems: 'center', gap: 4 },
  docLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: SIZES.lg, left: SIZES.lg, right: SIZES.lg },
});
