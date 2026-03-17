// src/screens/owner/DriverListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, EmptyState, ScreenHeader, PrimaryButton } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';

export default function DriverListScreen({ navigation }) {
  const { userData } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDrivers = async () => {
    try {
      const snap = await getDocs(
        query(
          collection(db, 'users'),
          where('ownerId', '==', userData.uid),
          where('role', '==', 'driver')
        )
      );
      setDrivers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      Alert.alert('Error', 'Failed to load drivers.');
    }
  };

  useEffect(() => { fetchDrivers(); }, []);
  useFocusEffect(
    React.useCallback(() => {
      fetchDrivers();
    }, [userData?.uid])
  );
  const onRefresh = async () => { setRefreshing(true); await fetchDrivers(); setRefreshing(false); };

  const handleDelete = (id, name) => {
    Alert.alert(
      'Remove Driver',
      `Remove ${name} from your fleet? They will no longer be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'users', id));
            fetchDrivers();
          },
        },
      ]
    );
  };

  const renderDriver = ({ item }) => (
    <Card>
      <View style={styles.driverRow}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1, marginLeft: SIZES.md }}>
          <Text style={styles.driverName}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.phone}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="mail-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.email}</Text>
          </View>
          {item.licenseNumber ? (
            <View style={styles.metaRow}>
              <Ionicons name="card-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{item.licenseNumber}</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Badge label="Driver" type="info" />
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Drivers"
        subtitle={`${drivers.length} driver${drivers.length !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddDriver')}
          >
            <Ionicons name="add" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        renderItem={renderDriver}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No drivers yet"
            subtitle="Add your first driver to start assigning trips"
          />
        }
      />

      <View style={styles.fab}>
        <PrimaryButton
          title="Add Driver"
          icon="person-add-outline"
          onPress={() => navigation.navigate('AddDriver')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SIZES.md, paddingBottom: 100 },
  driverRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1.5, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontSize: SIZES.fontXl, ...FONTS.black },
  driverName: { color: COLORS.textPrimary, fontSize: SIZES.fontMd, ...FONTS.bold, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
  actions: { alignItems: 'flex-end', gap: SIZES.sm },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.dangerMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  fab: { position: 'absolute', bottom: SIZES.lg, left: SIZES.lg, right: SIZES.lg },
});
