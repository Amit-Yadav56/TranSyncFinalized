// src/screens/owner/AnalyticsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, ScreenHeader } from '../../components';
import { COLORS, SIZES, FONTS } from '../../utils/theme';

const W = Dimensions.get('window').width - SIZES.md * 2;

const chartConfig = {
  backgroundGradientFrom: COLORS.surfaceElevated,
  backgroundGradientTo: COLORS.surfaceElevated,
  color: (opacity = 1) => `rgba(249,115,22,${opacity})`,
  labelColor: () => COLORS.textMuted,
  strokeWidth: 2,
  barPercentage: 0.6,
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
};

export default function AnalyticsScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalTrips: 0, completedTrips: 0, totalFuel: 0, totalCost: 0, avgMileage: 0 });
  const [fuelData, setFuelData] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [vehicleRanking, setVehicleRanking] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [tripSnap, fuelSnap, vehicleSnap] = await Promise.all([
          getDocs(query(collection(db, 'trips'), where('ownerId', '==', user.uid))),
          getDocs(query(collection(db, 'fuelLogs'), where('driverId', '==', user.uid))),
          getDocs(query(collection(db, 'vehicles'), where('ownerId', '==', user.uid))),
        ]);

        const trips = tripSnap.docs.map((d) => d.data());
        const fuels = fuelSnap.docs.map((d) => d.data());

        const totalFuel = fuels.reduce((s, f) => s + (f.liters || 0), 0);
        const totalCost = fuels.reduce((s, f) => s + (f.totalCost || 0), 0);
        const avgMileage = fuels.length ? fuels.reduce((s, f) => s + (f.mileage || 0), 0) / fuels.length : 0;

        setStats({
          totalTrips: trips.length,
          completedTrips: trips.filter((t) => t.status === 'completed').length,
          totalFuel: totalFuel.toFixed(1),
          totalCost: totalCost.toFixed(0),
          avgMileage: avgMileage.toFixed(2),
        });

        // Monthly fuel chart (last 6 months)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const last6 = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
          return { label: months[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), fuel: 0 };
        });

        fuels.forEach((f) => {
          const d = f.createdAt?.toDate ? f.createdAt.toDate() : new Date(f.createdAt);
          const bucket = last6.find((b) => b.month === d.getMonth() && b.year === d.getFullYear());
          if (bucket) bucket.fuel += f.liters || 0;
        });

        setFuelData({
          labels: last6.map((b) => b.label),
          datasets: [{ data: last6.map((b) => parseFloat(b.fuel.toFixed(1))) }],
        });

        // Trip status breakdown
        const statusCounts = { assigned: 0, in_progress: 0, completed: 0, cancelled: 0 };
        trips.forEach((t) => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });
        setTripData({
          labels: ['Assigned', 'Active', 'Done', 'Cancelled'],
          datasets: [{ data: Object.values(statusCounts) }],
        });

      } catch (e) {
        console.log('Analytics error:', e);
      }
    };
    fetch();
  }, []);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Analytics" subtitle="Fleet performance overview" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total Trips" value={stats.totalTrips} icon="map" color={COLORS.primary} style={{ marginRight: SIZES.sm }} />
          <StatCard label="Completed" value={stats.completedTrips} icon="checkmark-circle" color={COLORS.success} style={{ marginLeft: SIZES.sm }} />
        </View>
        <View style={[styles.statsRow, { marginTop: SIZES.sm }]}>
          <StatCard label="Total Fuel (L)" value={stats.totalFuel} icon="water" color={COLORS.secondary} style={{ marginRight: SIZES.sm }} />
          <StatCard label="Avg Mileage" value={`${stats.avgMileage} km/L`} icon="speedometer" color={COLORS.warning} style={{ marginLeft: SIZES.sm }} />
        </View>

        {/* Fuel Chart */}
        {fuelData && (
          <Card style={{ marginTop: SIZES.lg }}>
            <Text style={styles.chartTitle}>Fuel Usage (Last 6 Months)</Text>
            <LineChart
              data={fuelData}
              width={W - SIZES.md * 2}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
            />
          </Card>
        )}

        {/* Trip Chart */}
        {tripData && (
          <Card>
            <Text style={styles.chartTitle}>Trip Status Breakdown</Text>
            <BarChart
              data={tripData}
              width={W - SIZES.md * 2}
              height={180}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(6,182,212,${opacity})`,
              }}
              style={styles.chart}
              withInnerLines={false}
              showBarTops={false}
            />
          </Card>
        )}

        {/* Cost Summary */}
        <Card>
          <Text style={styles.chartTitle}>Cost Summary</Text>
          <View style={styles.costRow}>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Total Fuel Cost</Text>
              <Text style={styles.costValue}>₹{parseInt(stats.totalCost).toLocaleString()}</Text>
            </View>
            <View style={styles.costDivider} />
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Per Trip Avg</Text>
              <Text style={styles.costValue}>
                ₹{stats.totalTrips ? (parseInt(stats.totalCost) / stats.totalTrips).toFixed(0) : '0'}
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ height: SIZES.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SIZES.md },
  statsRow: { flexDirection: 'row' },
  chartTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontMd, ...FONTS.bold, marginBottom: SIZES.sm },
  chart: { borderRadius: SIZES.radiusMd, marginTop: SIZES.xs },
  costRow: { flexDirection: 'row', alignItems: 'center' },
  costItem: { flex: 1, alignItems: 'center' },
  costLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontSm },
  costValue: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.black, marginTop: 4 },
  costDivider: { width: 1, height: 50, backgroundColor: COLORS.surfaceBorder },
});
