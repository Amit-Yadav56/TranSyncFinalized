// src/services/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 Replace ALL values below with your actual Firebase project config
// Get these from: Firebase Console → Project Settings → Your Apps → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyBMzx0VV7b_nXHcj8Pcw170G142jM71rFQ",
  authDomain: "transync-85bbc.firebaseapp.com",
  projectId: "transync-85bbc",
  storageBucket: "transync-85bbc.firebasestorage.app",
  messagingSenderId: "477184457277",
  appId: "1:477184457277:web:14bc188c8ca5396edf8854",
  measurementId: "G-PB377LBTC3",
};

// Prevent re-initializing if already initialized (hot reload safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  // initializeAuth throws if called twice (e.g. hot reload) — getAuth() returns existing instance
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;

/*
 * ─── FIRESTORE DATA STRUCTURE ──────────────────────────────────────────────
 *
 * users/{userId}
 *   - name, email, role ('owner'|'driver'), phone
 *   - ownerId (owner's own uid for owners; owner's uid for drivers)
 *   - licenseNumber (drivers only)
 *   - createdAt
 *
 * vehicles/{vehicleId}
 *   - ownerId, registrationNumber, model, type
 *   - serviceIntervalKm, lastServiceKm, currentOdometer
 *   - rcExpiry, insuranceExpiry, pollutionExpiry
 *   - createdAt
 *
 * trips/{tripId}
 *   - ownerId, driverId, vehicleId
 *   - origin, destination, scheduledDate, notes
 *   - status: 'assigned'|'in_progress'|'completed'|'cancelled'
 *   - startTime, endTime, startLocation{lat,lng}, endLocation{lat,lng}
 *   - distanceKm, createdAt
 *
 * fuelLogs/{logId}
 *   - tripId, vehicleId, driverId
 *   - liters, pricePerLiter, totalCost, odometer, mileage
 *   - createdAt
 */
